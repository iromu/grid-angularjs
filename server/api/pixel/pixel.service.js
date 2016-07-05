(function () {
  'use strict';

  var fs = require('fs');
  var path = require('path');
  var _ = require('lodash');
  var Promise = require('bluebird');

  var redis = require('redis');

  var logger = require('../../logging').getLogger();
  var Pixel = require('./pixel.model');

  var pixelRepository = require('./pixel.repository')(logger);

  var width = 100;
  var height = 100;

  var region_width = 10;
  var region_height = 10;
  var region_length = region_width * region_height;

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


  var retrievePNGStreamFor = function (cache_key, res, room, maxAge) {

    var validate = function (pixels, d, ctx, id) {
      pixels.forEach(function (pixel) {
        d[0] = pixel.r || 0;
        d[1] = pixel.g || 0;
        d[2] = pixel.b || 0;
        d[3] = pixel.a || 255;
        ctx.putImageData(id, pixel.x, pixel.y);
      });
    };

    return pixelRepository.retrieveAsStream(cache_key, room, maxAge, validate, res);
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
      if (true) {

        var available = Lock.get(room).index.available;
        var index = available.splice(_.random(available.length - 1), 1)[0];

        logger.info('available ' + available.length + ' locked ' + Lock.get(room).index.locked.length);
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
