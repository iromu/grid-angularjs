/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Pixel = require('../api/pixel/pixel.model');
var User = require('../api/user/user.model');

var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');

Pixel.find({}).remove(function () {

  var width = 100;
  var height = 100;

  fs.readFile(__dirname + '/../api/pixel/lena.png', function (err, lena) {
    if (err) throw err;
    var img = new Image;
    img.src = lena;

    var canvas = new Canvas(width, height);
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);
    for (var x = 0; x < width; x++) {
      for (var y = 0; y < height; y++) {
        var d = ctx.getImageData(x, y, 1, 1);
        Pixel.create({x: x, y: y, r: d.data[0], g: d.data[1], b: d.data[2], a: d.data[3]});
      }
    }
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
