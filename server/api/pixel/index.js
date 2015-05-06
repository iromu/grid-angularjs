'use strict';

var express = require('express');
var controller = require('./pixel.controller');

var router = express.Router();

router.get('/snapshot', controller.snapshot);
router.get('/preview', controller.preview);
router.put('/', controller.update);
router.patch('/', controller.update);

module.exports = router;
