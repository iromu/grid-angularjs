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
var service = require('./pixel.service.js');
var logger = require('../../logging').getLogger();

var process = function (pixels, d, ctx, id) {
  pixels.forEach(function (pixel) {
    d[0] = pixel.r || 0;
    d[1] = pixel.g || 0;
    d[2] = pixel.b || 0;
    d[3] = pixel.a || 255;
    ctx.putImageData(id, pixel.x, pixel.y);
  });
};

exports.snapshot = function (req, res) {
  var cache_key = 'pixels:snapshot:' + req.params.room;
  service.retrievePNGStreamFor(cache_key, res, process, 'raw', 1)
    .catch(function (err) {
      handleError(res, err);
    });
};

exports.preview = function (req, res) {
  var cache_key = 'pixels:preview:' + req.params.room;
  service.retrievePNGStreamFor(cache_key, res, process, req.params.room, 1)
    .catch(function (err) {
      handleError(res, err);
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
  return res.status(500).send(err);
}



