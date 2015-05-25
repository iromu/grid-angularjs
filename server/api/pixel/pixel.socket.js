(function () {
  /**
   * Broadcast updates to client when the model changes
   */

  'use strict';

  var service = require('./pixel.service.js');

  exports.onConnectCallback = null;

  exports.register = function (s, sio) {
    var socket = s;
    var io = sio;

    if (this.onConnectCallback) {
      this.onConnectCallback(s);
    }

    socket.on('pixel:buffer:request', function (room) {
      service.getPixels(function (pixels) {
        socket.emit('pixel:buffer:response', pixels, room);
      }, function (imageName) {
        io.sockets.emit('snapshot', imageName);
      });
    });

    socket.on('pixel:put', function (pixels, room) {
      service.savePixels(pixels, function () {
        io.sockets.emit('pixel:batch:update', pixels, room);
        socket.emit('pixel:put:end', room);
      });
    });

  };

  exports.onConnect = function (cb) {
    this.onConnectCallback = cb;
  };
}());
