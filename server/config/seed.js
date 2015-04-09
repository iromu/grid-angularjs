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

var imageName = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 36);

var LENA_JSON = __dirname + '/../api/pixel/lena.json';

var readLenaFile = function () {
  var data = fs.readFileSync(LENA_JSON);
  var arr = JSON.parse(data);
  Pixel.collection.insert(arr, function () {
    console.log('finished populating pixels from ' + LENA_JSON);
  });
};
Pixel.find({}).remove(function () {

    if (!fs.existsSync(LENA_JSON)) {

      var lena = fs.readFileSync(__dirname + '/../api/pixel/lena.png');
      var img = new Image;
      img.src = lena;

      var canvas = new Canvas(img.width, img.height);
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, img.width, img.height);


      var pixels = [];
      for (var x = 0; x < img.width; x++) {
        for (var y = 0; y < img.height; y++) {
          var d = ctx.getImageData(x, y, 1, 1);
          var pixel = {x: x, y: y, r: d.data[0], g: d.data[1], b: d.data[2], a: d.data[3], image: imageName};
          //Pixel.create(pixel);
          pixels.push(pixel);
        }
      }

      Pixel.collection.insert(pixels, {multi: true}, function () {
        fs.writeFileSync(LENA_JSON, JSON.stringify(pixels));
      });

    } else
      readLenaFile();
  }
)
;

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

