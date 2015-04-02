/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var _ = require('lodash');
var Pixel = require('../api/pixel/pixel.model');
var User = require('../api/user/user.model');

var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');

Pixel.find({}).remove(function () {
  var data = fs.readFileSync(__dirname + '/../api/pixel/lena.json');
  var arr = JSON.parse(data);
  Pixel.collection.insert(arr, function () {
    console.log('finished populating pixels');
  });
});

User.find({}).remove(function () {
  User.create({
      provider: 'local',
      name: 'Test User',
      email: 'test@test.com',
      password: 'test'
    }, {
      provider: 'local',
      role: 'admin',
      name: 'Admin',
      email: 'admin@admin.com',
      password: 'admin'
    }, function () {
      console.log('finished populating users');
    }
  );
});

