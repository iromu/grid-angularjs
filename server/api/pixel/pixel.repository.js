(function () {
    'use strict';

    var width = 100;
    var height = 100;

    var Canvas = require('canvas');
    var fs = require('fs');
    var _ = require('lodash');
    var Promise = require('bluebird');

    var base64encode = require('base64-stream').Encode;
    var base64decode = require('base64-stream').Decode;
    var PassThrough = require('stream').PassThrough;


    var Pixel = require('./pixel.model');
    var redisClient = require('../../components/redis').getRedisClient({label: 'Pixel'});
    var pixelSeed;


    var logger;
    var cacheClient;


    var getCacheClient = function () {
      if (cacheClient === undefined) {
        cacheClient = redisClient;
      }
      return cacheClient;
    };


    /**
     * @param {string} room
     * @param selection
     * @param {string} image
     */
    var getPixels = function (room, selection, image) {
      image = image || 'lena.png';


      var readFromStorage = new Promise(function (resolve, reject) {
        Pixel
          .find({
            room: room,
            image: image,
            x: {'$lte': selection.x + selection.size - 1, '$gte': selection.x},
            y: {'$lte': selection.y + selection.size - 1, '$gte': selection.y}
          })
          .sort({x: +1, y: +1})
          .limit(selection.width)
          .lean()
          .exec()
          .then(function (pixels) {
            if (!Array.isArray(pixels) || pixels.length === 0) {
              logger.error('pixelRepository#getPixels() reloadBuffer selection empty.');
              reject(new Error(room));
            } else {
              resolve({
                room: room,
                image: image,
                selection: selection,
                pixels: pixels
              });
            }
          })
          .catch(function (err) {
            logger.error('Error reading pixels for pixelRepository#getPixels. %s', err);
            reject(new Error(room));
          });

      });


      var cacheKey = JSON.stringify(selection, null, 2);

      return getCacheClient().existsAsync(cacheKey).then(function (pixels) {
        if (pixels) {
          return getCacheClient().getAsync(new Buffer(cacheKey));
        } else {
          return readFromStorage;
        }
      }).catch(function (err) {
        logger.debug('Error reading pixels for getPixels. %s', err);
        return readFromStorage;
      });


    };

    /**
     * @param cache_key
     * @param room
     * @param maxAge
     * @param validate
     * @param pipeOut
     * @param {string} image
     */
    var retrieveAsStream = function (cache_key, room, maxAge, validate, pipeOut, image) {
      image = image || 'lena.png';
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

            Pixel.find({image: image, room: room})
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
                    pixelSeed.reloadImageForRoom(room).then(extractPixels).then(pipePixels).catch(reject);
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
    };

    function PixelRepository(logger_) {
      pixelSeed = require('./pixel.seed')(logger_);
      logger = logger_;

      return {
        retrieveAsStream: retrieveAsStream,
        setLogger: function setLogger(logger_) {
          logger = logger_;
        },
        getPixels: getPixels
      };
    }

    module.exports = PixelRepository;

  }()
);
