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

function handleError(res, err) {
  return res.send(500, err);
}



