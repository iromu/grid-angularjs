'use strict';

var mongoose = require('mongoose'),
  Schema = mongoose.Schema;

var NnSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Nn', NnSchema);
