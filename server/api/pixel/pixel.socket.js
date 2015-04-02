/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Pixel = require('./pixel.model.js');
var Canvas = require('canvas');
var Image = Canvas.Image;
var fs = require('fs');
var path = require('path');
var _ = require('lodash');


exports.onConnectCallback = null;

exports.register = function (s, sio) {

  var socket = s;
  var io = sio;

  var lockPixels = function (pixels, callback) {
    var ids = pixels.map(function (pixel) {
      return pixel._id;
    });
    Pixel.update({_id: {$in: ids}}, {$set: {processed: true}}, {multi: true}, callback);
  };

  var reloadBuffer = function () {
    Pixel.find({}).remove(function () {
      fs.readFile(__dirname + '/lena.json', function read(err, data) {
        if (err) {
          throw err;
        }
        var arr = JSON.parse(data);

        Pixel.collection.insert(arr, function () {
          io.sockets.emit('snapshot');
        });
      });
    });
  };

  if (this.onConnectCallback) {
    this.onConnectCallback(s);
  }

  socket.on('pixel:buffer:request', function () {
    //console.info('[%s] pixel:buffer:request', socket.id);
    Pixel.find({processed: {'$ne': true}})
      .limit(500)
      .exec(function (err, pixels) {

        if (pixels.length === 0) {
          reloadBuffer();
        } else {
          //socket.broadcast.emit('pixel:buffer:lock', pixels);
          lockPixels(pixels, function () {
            socket.emit('pixel:buffer:response', pixels);
          });
        }

      });
  });


  socket.on('pixel:put', function (pixels) {
    pixels.forEach(function (item) {
      Pixel.findById(item._id, function (err, pixel) {
        if (!err && pixel) {
          var updated = _.merge(pixel, item);
          updated.processed = true;
          updated.save();
        }
      });
    });

    //console.info('[%s] updateBatch', socket.id);
    socket.broadcast.emit('pixel:batch:update', pixels);
  });
}

exports.onConnect = function (cb) {
  this.onConnectCallback = cb;
};



