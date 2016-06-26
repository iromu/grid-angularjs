(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var _ = require('lodash');
  var Canvas = require('canvas');
  var Image = Canvas.Image;
  var Promise = require('bluebird');

  var redis = require('redis');
  require('redis-streams')(redis);
  var base64encode = require('base64-stream').Encode;
  var base64decode = require('base64-stream').Decode;
  var PassThrough = require('stream').PassThrough;

  var redisClient = require('../../components/redis').getRedisClient({label: 'Pixel'});
  var logger = require('../../logging').getLogger();
  var Pixel = require('./pixel.model.js');
  var Lock = require('./pixel.lock.js');

  var width = 100;
  var height = 100;
  var length = width * height;

  var region_width = 10;
  var region_height = 10;
  var region_length = region_width * region_height;


  var LENA_PNG = __dirname + '/lena.png';
  var options = {multi: true};
  var prevPixelIds = [];
  var lastX = -1;
  var lastY = 9;
  var region = 0;


  var getIdsFromPixels = function (pixels) {
    return pixels.map(function (pixel) {
      return pixel._id.toString();
    });
  };

  var verifyPixels = function (pixels) {
    var pixelIds = getIdsFromPixels(pixels);
    if (prevPixelIds.length === 0) {
      prevPixelIds = pixelIds;
      return true;
    } else {
      var diff = _.difference(pixelIds, prevPixelIds);
      if (_.isEqual(diff, prevPixelIds)) {
        logger.warn('Duplicated ' + diff);
        logger.warn('prevPixelIds ' + prevPixelIds);
        logger.warn('pixelIds ' + pixelIds);
        return false;
      }
      prevPixelIds = prevPixelIds.concat(pixelIds);
      return true;
    }
  };

  var lockPixels = function (pixels, callback) {
    var ids = getIdsFromPixels(pixels);
    Pixel.collection.update({_id: {$in: ids}}, {$set: {locked: true}}, options, function (err, numAffected, raw) {
      if (numAffected === 0) {
        logger.warn('The number of updated documents was %d', numAffected);
        logger.warn('The raw response from Mongo was ', raw);
      }
      if (err) {
        logger.error('UPDATE ERROR %s', JSON.stringify(err, null, 2));
      }
      callback();
    });
  };

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


  var reloadImageForRoom = function (room) {
    return new Promise(function (resolve, reject) {
      if (Lock.get(room).reloading === false) {
        Lock.get(room).reloading = true;

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
                Lock.get(room).reloading = false;
                return reject(err);
              }
              var persist = function (_pixels) {
                logger.info('Retrieving from file. ' + room);
                Pixel.collection.insert(_.map(_pixels, function (pixel) {
                  pixel.room = room;
                  return pixel;
                }), {multi: true}, function () {
                  Lock.get(room).reloading = false;
                  resolve(_pixels);
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
            });
        });
      }
    });
  };

  var retrievePNGStreamFor = function (cache_key, res, process, room, maxAge) {
    return new Promise(function (resolve, reject) {
      redisClient.exists(cache_key, function (err, exists) {
        if (err) {
          return reject(err);
        }

        if (exists) {
          logger.info('Retrieving ' + cache_key + ' from cache.');
          redisClient.readStream(cache_key)
            .pipe(base64decode()).pipe(res);
          return resolve();
        } else {

          Pixel.find({image: 'lena.png', room: room})
            .sort({x: +1, y: +1})
            .lean()
            .exec(function (err, pixels) {

              if (err) {
                return reject(err);
              }

              var pipePixels = function (_pixels) {

                var canvas = new Canvas(width, height);
                var ctx = canvas.getContext('2d');

                var id = ctx.createImageData(1, 1);
                var d = id.data;
                process(_pixels, d, ctx, id);
                var stream = canvas.syncPNGStream();
                var base64pass = new PassThrough();
                stream.pipe(base64pass)
                  .pipe(base64encode())
                  .pipe(redisClient.writeStream(cache_key, maxAge));
                stream.pipe(res);
                resolve();
              };

              if (!Array.isArray(pixels) || pixels.length === 0) {
                reloadImageForRoom(room).then(pipePixels);
              }
              else {
                logger.info('Retrieving ' + cache_key + ' from database. ' + pixels.length);
                pipePixels(pixels);
              }
            });
        }
      });
    });
  };

  var calcWindowSlice = function (region, width, height, size) {
    var maxRegionW = Math.floor(width / size);
    var maxRegionH = Math.floor(height / size);

    var col = (region - 1) % maxRegionW + 1;
    var row = Math.floor((region - 1) / maxRegionH) + 1;

    var selectX = (col - 1) * size - 1;
    selectX = selectX < 0 ? 0 : selectX;
    selectX = selectX - 1 >= width ? 0 : selectX;

    var selectY = (row - 1) * size - 1;
    selectY = selectY < 0 ? 0 : selectY;

    if (selectX - 1 >= width) {
      selectY = 29;
    }

    return {region: region, size: size, col: col, row: row, x: selectX, y: selectY};
  };

  exports.retrievePNGStreamFor = retrievePNGStreamFor;

  exports.getPixels = function (room) {
    return new Promise(function (resolve, reject) {
      if (Lock.get(room).updating === false) {
        Lock.get(room).updating = true;
        var index = Math.floor(Math.random() * 100 + 1);
        var selection = calcWindowSlice(index, width, height, 10);
        var iteration = (lastX === -1) ? false : (lastX + 1) % region_width;
        var selectX = (iteration === 0) ? 9 : lastX + 10;
        var selectY = (iteration === 0) ? lastY + 10 : lastY;

        Pixel
          .find({
            room: room,
            image: 'lena.png',
            x: {'$lte': selection.x + region_width - 1, '$gte': selection.x},
            y: {'$lte': selection.y + region_height - 1, '$gte': selection.y}
          })
          .sort({x: +1, y: +1})
          .limit(region_length)
          .lean()
          .exec(function (err, pixels) {
            if (!Array.isArray(pixels) || pixels.length === 0) {
              Lock.get(room).updating = false;
              lastX = -1;
              lastY = 9;
              logger.info('reloadBuffer');
              reloadImageForRoom(room).then(reject);
            } else {
              if (verifyPixels(pixels)) {

                logger.info('getPixels() locking selectX: %s selectY: %s', selectX, selectY);
                lockPixels(pixels, function () {

                  logger.info('getPixels() post lockPixels selectX: %s selectY: %s', selectX, selectY);
                  lastX = selectX;
                  lastY = selectY;
                  region++;
                  Lock.get(room).updating = false;
                  resolve({
                    room: room,
                    selection: selection,
                    pixels: pixels
                  })
                  ;
                });
              } else {
                Lock.get(room).updating = false;
                logger.warn('duplicated');
                resolve();
              }
            }
          });

      } else {
        logger.info('locked');
        resolve();
      }
    });
  };


  exports.savePixels = function (pixels, cb) {

    pixels.forEach(function (item) {
      var update = {
        r: item.r || item.s,
        g: item.g || item.s,
        b: item.b || item.s,
        s: item.s,
        processed: true,
        locked: false
      };


      Pixel.collection.update({_id: item._id}, {$set: update}, function (err) {
        if (err) {
          logger.error('UPDATE ERROR %s', JSON.stringify(err, null, 2));
        }
      });
    });
    cb();
  };
}());
