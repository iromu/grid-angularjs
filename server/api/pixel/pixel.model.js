'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var PixelSchema = new Schema({
  image: String,
  x: {type: Number, index: true},
  y: {type: Number, index: true},
  r: Number,
  g: Number,
  b: Number,
  s: Number,//shades of grey
  a: Number,//alpha
  processed: {type: Boolean, index: true},
  locked: {type: Boolean, index: true}
});

PixelSchema.index({processed: 1, locked: 1, x: 1, y: 1}, {x: 1, y: 1});
module.exports = mongoose.model('Pixel', PixelSchema);
