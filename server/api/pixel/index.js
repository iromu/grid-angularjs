'use strict';

var express = require('express');
var controller = require('./pixel.controller');

var router = express.Router();

router.get('/snapshot/:room', controller.snapshot);
router.get('/preview/:room', controller.preview);
router.put('/:room', controller.update);
router.patch('/:room', controller.update);

module.exports = router;
