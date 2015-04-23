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

var reloadBuffer = function (errCb) {

  Pixel.find({}).remove(function () {
    fs.readFile(__dirname + '/lena.json', function read(err, data) {
      if (err) {
        throw err;
      }
      var arr = JSON.parse(data);

      var imageName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 36);
      arr.map(function (item) {
        item.image = imageName;
        return item;
      });
      Pixel.collection.insert(arr, function () {
        errCb(imageName);
      });
    });
  });
};

exports.getPixels = function (cb, errCb) {
  if (Lock.updating === false) {
    Lock.updating = true;
    Pixel
      .find({processed: {'$ne': true}, locked: {'$ne': true}})
      .sort({y: +1})
      .limit(200)
      .exec(function (err, pixels) {
        if (!Array.isArray(pixels) || pixels.length === 0) {
          Lock.updating = false;
          reloadBuffer(errCb);
        } else {
          if (verifyPixels(pixels)) {
            lockPixels(pixels, function () {
              cb(pixels);
              Lock.updating = false;
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

exports.savePixels = function (pixels, cb) {
  pixels.forEach(function (item) {
    var update = {r: item.r, g: item.g, b: item.b, a: item.a, processed: true, locked: false};
    Pixel.collection.update({_id: item._id}, {$set: update}, function (err) {
      if (err) {
        console.info('UPDATE ERROR %s', JSON.stringify(err, null, 2));
      }
    });
  });
  cb();
};
