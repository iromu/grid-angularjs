(function () {
    'use strict';

    var LENA_PNG = __dirname + '/lena.png';
    var BABOON_PNG = __dirname + '/baboon.png';
    var PNG_FILES = {'lena.png': LENA_PNG, 'baboon.png': BABOON_PNG};

    var fs = require('fs');
    var _ = require('lodash');
    var PNG = require('pngjs').PNG;
    var Promise = require('bluebird');

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

            processPixels(room);
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

    /**
     * @param {string} image
     */
    var reloadImageForRoom2 = function (room, image) {
      image = image || 'lena.png';

      logger.info('reloadImageForRoom ' + room);

      return Pixel.find({room: room, image: image}).remove().exec().then(function () {
        populatePixelsForImage({room: room, image: image});
      })
    };

    var populatePixelsForImage = function (data) {
      return readFromFileAsync(data.room, data.image)
        .then(function (pixels) {
          console.log('populating ' + pixels.length + ' pixels for ' + data.image);
          return Pixel.collection.insert(pixels, {multi: true});
        });
    };

    /**
     * @param room
     * @param {string} image
     */
    var reloadImageForRoom = function (room, image) {
      image = image || 'lena.png';
      return new Promise(function (resolve, reject) {


        Pixel.find({room: room}).remove(function () {
          Pixel
            .find({
              room: 'raw',
              image: image
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

                var cachePixels = function (data) {
                  return getCacheClient().setexAsync(data.room + '::' + data.image, 36000, JSON.stringify(data.reload.pixels, null, 2))
                    .then(function () {
                      return data;
                    });
                };
                var insertPixels = function () {
                  return Pixel.collection
                    .insert(newPixels, {multi: true})
                    .then(function (data) {
                      logger.info('(reloadImageForRoom) Resolving from file. ' + room);
                      var info = {
                        room: room,
                        image: image,
                        reload: {pixels: data}
                      };
                      cachePixels(info);
                      resolve(info);
                    })
                    .catch(function (error) {
                      logger.error('(reloadImageForRoom) Error inserting pixels for room %s. \n%s', room, error);
                      reject(error);
                    });
                };


                return Pixel
                  .find({
                    room: room,
                    image: image
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


    function PixelSeed(logger_) {

      logger = logger_;

      return {
        setLogger: function setLogger(logger_) {
          logger = logger_;
        },
        reloadImageForRoom: reloadImageForRoom
      };
    }

    module.exports = PixelSeed;

  }()
);
