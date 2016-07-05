(function () {
  'use strict';

  var width = 100;
  var height = 100;
  var LENA_PNG = __dirname + '/lena.png';

  var Canvas = require('canvas');
  var fs = require('fs');
  var _ = require('lodash');

  var base64encode = require('base64-stream').Encode;
  var base64decode = require('base64-stream').Decode;
  var PassThrough = require('stream').PassThrough;


  var Pixel = require('./pixel.model');
  var redisClient = require('../../components/redis').getRedisClient({label: 'Pixel'});

  var logger;
  var cacheClient;

  var readFile = function (room, png) {

    var lena = fs.readFileSync(png);
    var img = new Image();
    img.src = lena;

    var canvas = new Canvas(img.width, img.height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, img.width, img.height);

    var pixels = [];

    for (var x = 0; x < img.width; x++) {
      for (var y = 0; y < img.height; y++) {
        var d = ctx.getImageData(x, y, 1, 1);
        pixels.push({x: x, y: y, r: d.data[0], g: d.data[1], b: d.data[2], image: png.split("/").pop(), room: room});
      }
    }

    return pixels;
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
          .exec(function (err, pixels) {
            if (err) {
              reject(err);
            } else {
              var persist = function (_pixels) {
                logger.info('Retrieving from file. ' + room);
                Pixel.collection.insert(_.map(_pixels, function (pixel) {
                  pixel.room = room;
                  return pixel;
                }), {multi: true}, function () {
                  resolve({
                    room: room,
                    image: 'lena.png',
                    reload: {pixels: _pixels}
                  });
                });
              };

              if (!Array.isArray(pixels) || pixels.length === 0) {
                pixels = readFile('raw', LENA_PNG);
                Pixel.collection.insert(pixels, {multi: true}, function () {
                  logger.info('Retrieving from file. raw forced');
                  persist(pixels);
                });
              }
              else {
                persist(pixels);
              }
            }
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
              reject('reloadBuffer');
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
            logger.debug('Error reading pixels from persistence. %s', err);
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
                      validate(_pixels, d, ctx, id);
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
                      reloadImageForRoom(room).then(extractPixels).then(pipePixels);
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
