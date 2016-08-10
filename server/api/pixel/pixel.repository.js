(function () {
  'use strict';

  var width = 100;
  var height = 100;
  var LENA_PNG = __dirname + '/lena.png';

  var Canvas = require('canvas');
  var fs = require('fs');
  var _ = require('lodash');
  var PNG = require('pngjs').PNG;
  var Promise = require('bluebird');

  var base64encode = require('base64-stream').Encode;
  var base64decode = require('base64-stream').Decode;
  var PassThrough = require('stream').PassThrough;


  var Pixel = require('./pixel.model');
  var redisClient = require('../../components/redis').getRedisClient({label: 'Pixel'});

  var logger;
  var cacheClient;


  var readFromFileAsync = function (room, png) {
    return new Promise(function (resolve, reject) {
      fs.createReadStream(png)
        .pipe(new PNG())
        .on('parsed', function () {
          var self = this;
          var pixels = [];

          var processPixels = function (room) {
            for (var x = 0; x < self.width; x++) {
              for (var y = 0; y < self.height; y++) {
                var idx = (self.width * y + x) << 2;
                pixels.push({
                  x: x,
                  y: y,
                  r: self.data[idx],
                  g: self.data[idx + 1],
                  b: self.data[idx + 2],
                  image: png.split("/").pop(),
                  room: room
                });
              }
            }
          };

          processPixels('room');
          resolve(pixels);
        });
    });
  };

  var getCacheClient = function () {
    if (cacheClient === undefined) {
      cacheClient = redisClient;
    }
    return cacheClient;
  };

  var reloadImageForRoom = function (room) {
    return new Promise(function (resolve, reject) {

      logger.info('reloadImageForRoom ' + room);
      Pixel.find({room: room}).remove(function () {
        Pixel
          .find({
            room: 'raw',
            image: 'lena.png'
          })
          .sort({x: +1, y: +1})
          .lean()
          .exec()
          .then(function (rawPixels) {

            var persist = function (newPixels) {
              logger.debug('(reloadImageForRoom) Persist starts ' + room);

              newPixels = _.map(newPixels, function (pixel) {
                delete pixel._id;
                delete pixel.id;
                pixel.room = room;
                return pixel;
              });

              var insertPixels = function () {
                return Pixel.collection
                  .insert(newPixels, {multi: true})
                  .then(function (data) {
                    logger.info('(reloadImageForRoom) Resolving from file. ' + room);
                    resolve({
                      room: room,
                      image: 'lena.png',
                      reload: {pixels: data}
                    });
                  })
                  .catch(function (error) {
                    logger.error('(reloadImageForRoom) Error inserting pixels for room %s. \n%s', room, error);
                    reject(error);
                  });
              };

              return Pixel
                .find({
                  room: room,
                  image: 'lena.png'
                })
                .remove()
                .lean()
                .exec()
                .then(insertPixels)
                .catch(function (error) {
                  logger.error('(reloadImageForRoom) Error removing pixels before inserting for room %s. \n%s', room, error);
                  reject(error);
                });

            };

            if (!Array.isArray(rawPixels) || rawPixels.length === 0) {
              readFromFileAsync('raw', LENA_PNG).then(function (rawPixels) {
                Pixel.collection
                  .insert(rawPixels, {multi: true})
                  .then(function () {
                    logger.info('Retrieving from file. raw forced');
                    return persist(rawPixels);
                  })
                  .catch(function (error) {
                    logger.error('(reloadImageForRoom) Error inserting pixels for raw image. \n%s', error);
                    reject(error);
                  });
              });
            }
            else {
              return persist(rawPixels);
            }

          })
          .catch(function (error) {
            logger.error('(reloadImageForRoom) Error reading raw pixels. \n%s', error);
            reject(error);
          });
      });

    });
  };

  var getPixels = function (room, selection) {
    return new Promise(function (resolve, reject) {
      if (true) {

        Pixel
          .find({
            room: room,
            image: 'lena.png',
            x: {'$lte': selection.x + selection.size - 1, '$gte': selection.x},
            y: {'$lte': selection.y + selection.size - 1, '$gte': selection.y}
          })
          .sort({x: +1, y: +1})
          .limit(selection.width)
          .lean()
          .exec()
          .then(function (pixels) {
            if (!Array.isArray(pixels) || pixels.length === 0) {
              logger.error('reloadBuffer selection: ', JSON.stringify(selection, null, 2));
              reject(new Error('reloadBuffer'));
            } else {
              resolve({
                room: room,
                image: 'lena.png',
                selection: selection,
                pixels: pixels
              });
            }
          })
          .catch(function (err) {
            logger.debug('Error reading pixels for getPixels. %s', err);
            reject(err);
          });

      } else {
        logger.info('locked');
        resolve('locked');
      }
    });
  };

  function PixelRepository(logger_) {

    logger = logger_;

    return {
      retrieveAsStream: function (cache_key, room, maxAge, validate, pipeOut) {
        return new Promise(function (resolve, reject) {

          getCacheClient().exists(cache_key, function (err, exists) {
            if (err) {
              reject(err);
            } else if (exists) {
              logger.info('Retrieving ' + cache_key + ' from cache.');
              getCacheClient().readStream(cache_key)
                .pipe(base64decode())
                .pipe(pipeOut);
              resolve();
            } else {

              Pixel.find({image: 'lena.png', room: room})
                .sort({x: +1, y: +1})
                .lean()
                .exec(function (err, pixels) {


                  if (err) {
                    reject(err);
                  }
                  else {
                    var extractPixels = function (data) {
                      return (Array.isArray(data)) ? data : data.reload.pixels;
                    };

                    var pipePixels = function (_pixels) {
                      var canvas = new Canvas(width, height);
                      var ctx = canvas.getContext('2d');

                      var id = ctx.createImageData(1, 1);
                      var d = id.data;
                      if (validate) validate(_pixels, d, ctx, id);
                      var stream = canvas.syncPNGStream();

                      //PassThrough pipe
                      stream.pipe(new PassThrough())
                        .pipe(base64encode())
                        .pipe(getCacheClient().writeStream(cache_key, maxAge));

                      //Consumer pipe
                      stream.pipe(pipeOut);

                      resolve();
                    };

                    if (!Array.isArray(pixels) || pixels.length === 0) {
                      reloadImageForRoom(room).then(extractPixels).then(pipePixels).catch(reject);
                    }
                    else {
                      logger.info('Retrieving ' + cache_key + ' from database. ' + pixels.length);
                      pipePixels(pixels);
                    }
                  }
                });
            }
          });
        });
      },
      setLogger: function setLogger(logger_) {
        logger = logger_;
      },
      getPixels: getPixels,
      reloadImageForRoom: reloadImageForRoom
    };
  }

  module.exports = PixelRepository;

}());
