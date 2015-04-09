'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

//mongoose.set('debug', true);

var PixelSchema = new Schema({
  image: String,
  x: {type: Number, index: true},
  y: {type: Number, index: true},
  r: Number,
  g: Number,
  b: Number,
  a: Number,
  version: {type: Number, default: 0},
  processed: {type: Boolean, index: true},
  locked: {type: Boolean, index: true}
}, {collection: 'Pixel'});

PixelSchema.pre('save', function (next) {
  if (!this.locked) this.locked = false;
  next();
});


PixelSchema.index({processed: 1, locked: 1}, {x: 1, y: 1});
module.exports = mongoose.model('Pixel', PixelSchema);
