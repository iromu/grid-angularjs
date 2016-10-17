/**
 * Populate DB with sample data on server start
 * to disable, edit config/environment/index.js, and set `seedDB: false`
 */

'use strict';

var Promise = require('bluebird');
var _ = require('lodash');
var PNG = require('pngjs').PNG;
var fs = require('fs');

var Pixel = require('../api/pixel/pixel.model');
var User = require('../api/user/user.model');

var LENA_PNG = __dirname + '/../api/pixel/lena.png';
var BABOON_PNG = __dirname + '/../api/pixel/baboon.png';

var readFromFileAsync = function (png) {
  return new Promise(function (resolve, reject) {
    fs.createReadStream(png)
      .pipe(new PNG())
      .on('parsed', function () {
        var self = this;
        var pixels = [];

        var processPixels = function (room) {
          for (var x = 0; x < self.width; x++) {
            for (var y = 0; y < self.height; y++) {
              var idx = (self.width * y + x) << 2;
              pixels.push({
                x: x,
                y: y,
                r: self.data[idx],
                g: self.data[idx + 1],
                b: self.data[idx + 2],
                image: png.split("/").pop(),
                room: room
              });
            }
          }
        };
        processPixels('raw');
        resolve(pixels);
      });
  });
};

var populatePixelsForImage = function (file) {
  return readFromFileAsync(file)
    .then(function (pixels) {
      console.log('populating ' + pixels.length + ' pixels for ' + file);
      return Pixel.collection.insert(pixels, {multi: true});
    });
};

var init = function () {

  var loadPixels = function () {
    return Pixel.find({}).remove().exec().then(function () {
      console.log('Reading png file');
      return Promise.all([populatePixelsForImage(LENA_PNG), populatePixelsForImage(BABOON_PNG)]);
    });
  };

  var loadUsers = function () {
    return User.find({}).remove().exec().then(function () {
      console.log('populating users');
      return User.create({
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
        }
      );
    });
  };

  return Promise.all([loadPixels(), loadUsers()]);

};

exports.init = init;
