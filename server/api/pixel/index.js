(function () {
  'use strict';

  var express = require('express');
  var controller = require('./pixel.controller');

  var router = express.Router();

  router.get('/snapshot/:room', controller.snapshot);
  router.get('/preview/:room', controller.preview);

  module.exports = router;

}());
