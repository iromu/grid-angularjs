/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Pixel = require('../api/pixel/pixel.model');
var User = require('../api/user/user.model');

Pixel.find({}).remove(function () {

  var width = 100;
  var height = 100;

  for (var x = 0; x < width; x++) {
    for (var y = 0; y < height; y++) {
      var r = Math.random() * 256 | 0;
      var g = Math.random() * 256 | 0;
      var b = Math.random() * 256 | 0;
      Pixel.create({x: x, y: y, r: r, g: g, b: b, a: 255});
    }
  }
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
