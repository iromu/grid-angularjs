'use strict';

var express = require('express');
var controller = require('./pixel.controller');

var router = express.Router();

router.get('/snapshot', controller.snapshot);

module.exports = router;
