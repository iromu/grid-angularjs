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

var LENA_PNG = __dirname + '/../api/pixel/lena.png';
var LENA_JSON = __dirname + '/../api/pixel/lena.json';
var NN_X = __dirname + '/../api/nn/X.txt';

var readJson = function (json) {
  var data = fs.readFileSync(json);
  return JSON.parse(data);
};

var readNnXFile = function () {
  var data = fs.readFileSync(NN_X);
  return JSON.parse(data);
};


var readLenaFile = function () {

//  console.log('Read file ' + __dirname + LENA_PNG);
  var lena = fs.readFileSync(LENA_PNG);
  var img = new Image;
  img.src = lena;

  var canvas = new Canvas(img.width, img.height);
  var ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, img.width, img.height);

  var pixels = [];
  for (var x = 0; x < img.width; x++) {
    for (var y = 0; y < img.height; y++) {
      var d = ctx.getImageData(x, y, 1, 1);
      var pixel = {x: x, y: y, r: d.data[0], g: d.data[1], b: d.data[2], image: 'lena.png'};
      pixels.push(pixel);
    }
  }
  return pixels;
};


Pixel.find({}).remove(function () {
  var pixels = [];
  var save = false;
  if (!fs.existsSync(LENA_JSON)) {
    console.log('Reading png file');
    pixels = readLenaFile();
    save = true;
  } else {
    console.log('Reading json file');
    pixels = readJson(LENA_JSON);
  }
  Pixel.collection.insert(pixels, {multi: true}, function () {
    if (save) fs.writeFileSync(LENA_JSON, JSON.stringify(pixels));
    console.log('finished populating ' + pixels.length + ' pixels for lena.png');
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

