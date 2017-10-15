'use strict';

import mongoose from 'mongoose';

var PixelSchema = new mongoose.Schema({
  room: String,
  image: String,
  x: {type: Number, index: true},
  y: {type: Number, index: true},
  r: Number,
  g: Number,
  b: Number,
  s: Number, //shades of grey
  a: Number, //alpha
  processed: {type: Boolean, index: true},
  locked: {type: Boolean, index: true}
});

PixelSchema.index(
  {room: 1, image: 1, processed: 1, locked: 1, x: 1, y: 1},
  {x: 1, y: 1},
  {image: 1, room: 1}
);

//PixelSchema.set('redisCache', true);
//PixelSchema.set('expires', 300);

export default mongoose.model('Pixel', PixelSchema);
