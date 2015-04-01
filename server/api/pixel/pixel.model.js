'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PixelSchema = new Schema({
  x: Number,
  y: Number,
  r: Number,
  g: Number,
  b: Number,
  a: Number,
  processed:  Boolean
});

module.exports = mongoose.model('Pixel', PixelSchema);
