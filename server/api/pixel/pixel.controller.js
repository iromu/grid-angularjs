/**
 * Using Rails-like standard naming convention for endpoints.
 * GET     /pixels              ->  index
 * POST    /pixels              ->  create
 * GET     /pixels/:id          ->  show
 * PUT     /pixels/:id          ->  update
 * DELETE  /pixels/:id          ->  destroy
 */

'use strict';

var _ = require('lodash');
var Pixel = require('./pixel.model');
var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');
var path = require('path');
var width = 100;
var height = 100;

exports.snapshot = function (req, res) {

  Pixel.find(function (err, pixels) {
    if (err) {
      return handleError(res, err);
    }

    var canvas = new Canvas(width, height);
    var ctx = canvas.getContext('2d');

    var id = ctx.createImageData(1, 1);
    var d = id.data;

    pixels.forEach(function (pixel) {
      d[0] = pixel.r;
      d[1] = pixel.g;
      d[2] = pixel.b;
      d[3] = pixel.a;
      ctx.putImageData(id, pixel.x, pixel.y);
    });

    var stream = canvas.syncPNGStream();

    return stream.pipe(res);
  });
}

exports.index = function (req, res) {
  _index(res, false);
};

// Updates an existing pixel in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  if (Array.isArray(req.body)) {
    req.body.forEach(function (item) {
      Pixel.findById(item._id, function (err, pixel) {
        if (!err && pixel) {
          var updated = _.merge(pixel, item);
          updated.processed = true;
          updated.save(errorCallback);
        }
      });
    });
  }
  return res.send(200);
};

function handleError(res, err) {
  return res.send(500, err);
}

function _index(res, re) {
  Pixel.find({processed: {'$ne': true}})
    .limit(100)
    .exec(function (err, pixels) {
      if (err) {
        return handleError(res, err);
      }
      if (pixels.length == 0 && !re) {
        Pixel.find({}).remove(function () {
          for (var x = 0; x < width; x++) {
            for (var y = 0; y < height; y++) {
              var r = Math.random() * 256 | 0;
              var g = Math.random() * 256 | 0;
              var b = Math.random() * 256 | 0;
              Pixel.create({x: x, y: y, r: r, g: g, b: b, a: 255});
            }
          }
          _index(res, true);
        });
      }
      else {
        var ids = pixels.map(function (pixel) {
          return pixel._id;
        });

        Pixel.update({_id: {$in: ids}}, {$set: {processed: true}}, {multi: true}, errorCallback);

        return res.status(200).json(pixels);
      }
    });
};

function errorCallback(err) {
  if (err) {
    return handleError(res, err);
  }
}
