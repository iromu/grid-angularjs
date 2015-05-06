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
var socket;

exports.snapshot = function (req, res) {
  Pixel.find({image: 'lena.png'})
    .sort({x: +1, y: +1})
    .exec(function (err, pixels) {
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
        d[3] = pixel.a || 255;
        ctx.putImageData(id, pixel.x, pixel.y);
      });

      var stream = canvas.syncPNGStream();

      return stream.pipe(res);
    });
};

exports.preview = function (req, res) {
  Pixel.find({image: 'lena.png'})
    .sort({x: +1, y: +1})
    .exec(function (err, pixels) {
      if (err) {
        return handleError(res, err);
      }

      var canvas = new Canvas(width, height);
      var ctx = canvas.getContext('2d');

      var id = ctx.createImageData(1, 1);
      var d = id.data;

      pixels.forEach(function (pixel) {
        d[0] = pixel.s;
        d[1] = pixel.s;
        d[2] = pixel.s;
        d[3] = pixel.a || 255;
        ctx.putImageData(id, pixel.x, pixel.y);
      });

      var stream = canvas.syncPNGStream();

      return stream.pipe(res);
    });
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
          updated.locked = true;
          updated.save(function (err) {
            if (err) {
              return handleError(res, err);
            }
          });
        }
      });
    });
  }
  return res.send(200);
};

function handleError(res, err) {
  return res.send(500, err);
}



