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

var redis = require('redis');
require('redis-streams')(redis);

var redisClient = require('../../components/redis').getRedisClient();

var base64encode = require('base64-stream').Encode;
var base64decode = require('base64-stream').Decode;

var PassThrough = require('stream').PassThrough;

var retrievePNGStreamFor = function (cache_key, res, process) {
  redisClient.exists(cache_key, function (err, exists) {
    if (err) {
      return handleError(res, err);
    }

    if (exists) {
      console.log(cache_key + ' from cache');
      return redisClient.readStream(cache_key)
        .pipe(base64decode()).pipe(res);
    } else {
      Pixel.find({image: 'lena.png'})
        .sort({x: +1, y: +1})
        .lean()
        .exec(function (err, pixels) {
          if (err) {
            return handleError(res, err);
          }

          console.log(cache_key);
          var canvas = new Canvas(width, height);
          var ctx = canvas.getContext('2d');

          var id = ctx.createImageData(1, 1);
          var d = id.data;
          process(pixels, d, ctx, id);
          var stream = canvas.syncPNGStream();
          var base64pass = new PassThrough();
          stream.pipe(base64pass)
            .pipe(base64encode())
            .pipe(redisClient.writeStream(cache_key, 5));
          stream.pipe(res);
        });
    }
  });
};
exports.snapshot = function (req, res) {
  var process = function (pixels, d, ctx, id) {
    pixels.forEach(function (pixel) {
      d[0] = pixel.r;
      d[1] = pixel.g;
      d[2] = pixel.b;
      d[3] = pixel.a || 255;
      ctx.putImageData(id, pixel.x, pixel.y);
    });
  };
  var cache_key = '/api/pixels/snapshot';
  retrievePNGStreamFor(cache_key, res, process);
};

exports.preview = function (req, res) {
  var process = function (pixels, d, ctx, id) {
    pixels.forEach(function (pixel) {
      d[0] = pixel.s;
      d[1] = pixel.s;
      d[2] = pixel.s;
      d[3] = pixel.a || 255;
      ctx.putImageData(id, pixel.x, pixel.y);
    });
  };

  var cache_key = '/api/pixels/preview';
  retrievePNGStreamFor(cache_key, res, process);
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
  return res.status(500).send(err);
}



