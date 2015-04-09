'use strict';

var express = require('express');
var controller = require('./pixel.controller');

var router = express.Router();

router.get('/snapshot', controller.snapshot);
router.put('/', controller.update);
router.patch('/', controller.update);

module.exports = router;
