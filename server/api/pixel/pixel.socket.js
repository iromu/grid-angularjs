(function () {
  /**
   * Broadcast updates to client when the model changes
   */

  'use strict';

  var _ = require('lodash');
  var service = require('./pixel.service.js');

  exports.onConnectCallback = null;

  exports.register = function (s, sio, l) {
    var socket = s;
    var io = sio;
    var room;
    var logger = l;

    if (this.onConnectCallback) {
      this.onConnectCallback(s);
    }

    socket.on('pixel:buffer:request', function (_room) {
      room = _room;
      logger.debug('[%s] pixel:buffer:request %s', socket.id, room);
      service.getPixels(function (pixels) {
        socket.emit('pixel:buffer:response', pixels);
      }, function (imageName) {
        io.sockets.emit('snapshot', imageName);
      });
    });

    socket.on('pixel:put', function (pixels) {

      logger.debug('[%s] pixel:put %s', socket.id, JSON.stringify(_.size(pixels), null, 2));

      service.savePixels(pixels, function () {
        var pixelSize = _.size(pixels);
        logger.debug('[%s] pixel:batch:update %s', room, JSON.stringify(pixelSize, null, 2));
        socket.broadcast.emit('pixel:batch:update', pixels);
        socket.emit('pixel:put:end', pixelSize);
      });
    });

  };

  exports.onConnect = function (cb) {
    this.onConnectCallback = cb;
  };
}());
