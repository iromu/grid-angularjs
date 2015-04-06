'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PixelSchema = new Schema({
  image: String,
  x: Number,
  y: Number,
  r: Number,
  g: Number,
  b: Number,
  a: Number,
  version: {type: Number, default: 0},
  processed: {type: Boolean, index: true},
  locked: {type: Boolean, index: true}
});
PixelSchema.index({processed: 1, locked: 1});
module.exports = mongoose.model('Pixel', PixelSchema);
