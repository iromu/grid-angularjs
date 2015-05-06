'use strict';

var Pixel = require('./pixel.model.js');
var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var Lock = require('./pixel.lock.js');


var options = {multi: true};

var prevPixelIds = [];
var w = 100;
var h = 100;

var lastX = -1;
var lastY = 9;


var getIdsFromPixels = function (pixels) {
  var ids = pixels.map(function (pixel) {
    return pixel._id.toString();
  });
  return ids;
};

var verifyPixels = function (pixels) {
  var pixelIds = getIdsFromPixels(pixels);
  if (prevPixelIds.length === 0) {
    prevPixelIds = pixelIds;
    return true;
  } else {
    var diff = _.difference(pixelIds, prevPixelIds);
    if (_.isEqual(diff, prevPixelIds)) {
      console.warn('Duplicated ' + diff);
      console.warn('prevPixelIds ' + prevPixelIds);
      console.warn('pixelIds ' + pixelIds);
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
      console.warn('The number of updated documents was %d', numAffected);
      console.warn('The raw response from Mongo was ', raw);
    }
    if (err) {
      console.error('UPDATE ERROR %s', JSON.stringify(err, null, 2));
    }
    callback();
  });
};

var insertPixelsFrom = function (jsonFile, imageName, cb) {
  fs.readFile(__dirname + jsonFile, function read(err, data) {
    if (err) {
      throw err;
    }
    var arr = JSON.parse(data);

    arr.map(function (item) {
      item.image = imageName;
      return item;
    });
    Pixel.collection.insert(arr, function () {
      cb(imageName);
    });
  });
};
var reloadBuffer = function (errCb) {
  var update = {s: null, processed: false, locked: false};

  Pixel.collection.update({image: 'lena.png'}, {$set: update}, options, function (err, numAffected, raw) {
    if (numAffected === 0) {
      console.warn('The number of updated documents was %d', numAffected);
      console.warn('The raw response from Mongo was ', raw);

      insertPixelsFrom('/lena.json', 'lena.png', errCb);
    }
    if (err) {
      console.info('UPDATE ERROR %s', JSON.stringify(err, null, 2));
    }
    errCb('lena.png');
  });
};

exports.getPixels = function (cb, errCb) {
  if (Lock.updating === false) {
    Lock.updating = true;

    var iteration = (lastX === -1) ? false : (lastX + 1) % w;
    var selectX = (iteration === 0) ? 9 : lastX + 10;
    var selectY = (iteration === 0) ? lastY + 10 : lastY;

    Pixel
      .find({
        processed: {'$ne': true},
        locked: {'$ne': true},
        x: {'$lte': selectX},
        y: {'$lte': selectY},
        image: 'lena.png'
      })
      .sort({x: +1, y: +1})
      .limit(99)
      .exec(function (err, pixels) {
        if (!Array.isArray(pixels) || pixels.length === 0) {
          Lock.updating = false;
          lastX = -1;
          lastY = 9;
          reloadBuffer(errCb);
        } else {
          if (verifyPixels(pixels)) {
            lockPixels(pixels, function () {
              lastX = selectX;
              lastY = selectY;

              Lock.updating = false;
              cb(pixels);
            });
          } else {
            Lock.updating = false;
            console.info('duplicated');
            cb([]);
          }
        }
      });

  } else {
    console.info('locked');
    cb([]);
  }
};

var removeIfNull = function (update, p) {
  if (!update[p])delete update[p];
};

exports.savePixels = function (pixels, cb) {

  pixels.forEach(function (item) {
    var update = {r: item.r, g: item.g, b: item.b, a: item.a, s: item.s, processed: true, locked: false};

    removeIfNull(update, 'a');

    if (update.s) {
      removeIfNull(update, 'r');
      removeIfNull(update, 'g');
      removeIfNull(update, 'b');
    }

    Pixel.collection.update({_id: item._id}, {$set: update}, function (err) {
      if (err) {
        console.info('UPDATE ERROR %s', JSON.stringify(err, null, 2));
      }
    });
  });
  cb();
};
