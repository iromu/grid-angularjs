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

    socket.on('pixel:buffer:request', function () {
      console.info('[%s] pixel:buffer:request', socket.id);
      service.getPixels(function (pixels) {
        socket.emit('pixel:buffer:response', pixels);
      }, function (imageName) {
        io.sockets.emit('snapshot', imageName);
      });
    });

    socket.on('pixel:put', function (pixels) {
      console.info('[%s] pixel:put', socket.id);
      service.savePixels(pixels, function () {
        socket.broadcast.emit('pixel:batch:update', pixels);
      });
    });

  };

  exports.onConnect = function (cb) {
    this.onConnectCallback = cb;
  };
}());
