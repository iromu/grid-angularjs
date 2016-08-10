(function () {
  'use strict';

  var width = 100;
  var height = 100;

  var _ = require('lodash');

  var Pixel = require('./pixel.model');

  var logger = require('../../logging').getLogger();
  var pixelRepository = require('./pixel.repository')(logger);


  var store = {};

  var Lock = {
    get: function (lock) {
      if (!store.hasOwnProperty(lock)) {
        store[lock] = {
          updating: false,
          reloading: false,
          index: {locked: [], available: Array.apply(null, {length: 100}).map(Number.call, Number)}
        };
      }
      return store[lock];
    }
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

    if (_.isEmpty(Lock.get(room).index.available)) {
      Lock.get(room).index.available = Array.apply(null, {length: 100}).map(Number.call, Number);
      return pixelRepository.reloadImageForRoom(room);
    } else {
      var index = Lock.get(room).index.available.splice(_.random(Lock.get(room).index.available.length - 1), 1)[0];
      var selection = calcWindowSlice(index, width, height, 10);
      return pixelRepository.getPixels(room, selection);
    }
  };


  exports.savePixels = function (pixels) {
    pixels.forEach(function (item) {
      var update = {
        r: item.r || item.s,
        g: item.g || item.s,
        b: item.b || item.s,
        s: item.s,
        processed: true,
        locked: false
      };
      return Pixel.collection.update({_id: item._id}, {$set: update});
    });
  };

  exports.bulkUpdate = function (records, match) {
    match = match || '_id';
    return new Promise(function (resolve, reject) {
      var bulk = Pixel.collection.initializeUnorderedBulkOp();
      records.forEach(function (item) {
        var update = {
          r: item.r || item.s,
          g: item.g || item.s,
          b: item.b || item.s,
          s: item.s,
          processed: true,
          locked: false
        };
        var query = {};
        query[match] = item[match];
        bulk.find(query).upsert().updateOne(update);
      });
      bulk.execute(function (err, bulkres) {
        if (err) return reject(err);
        resolve(bulkres);
      });
    });
  }

}());
