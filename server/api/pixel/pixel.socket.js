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
    var logger = l;

    if (this.onConnectCallback) {
      this.onConnectCallback(s);
    }

    socket.on('pixel:buffer:request', function (_room) {
      var room = _room;
      logger.debug('[%s] pixel:buffer:request room %s', socket.id, room);

      service.getPixels(room).then(function (data) {

        logger.debug('[%s] pixel:buffer:response %s', data.room, JSON.stringify(_.size(data.pixels), null, 2));
        socket.emit('pixel:buffer:response', data);

      }, function (imageName) {

        logger.debug('to [%s] snapshot %s', room, JSON.stringify(imageName, null, 2));
        socket.to(room).emit('snapshot', {imageName: imageName, room: room});

      });

    });

    socket.on('pixel:put', function (request) {
      var room = request.room;
      logger.debug('[%s] pixel:put %s', socket.id, JSON.stringify(_.size(request.pixels), null, 2));

      service.savePixels(request.pixels, function () {

        var pixelSize = _.size(request.pixels);
        logger.debug('[%s] pixel:batch:update %s', room, JSON.stringify(pixelSize, null, 2));
        socket.to(room).emit('pixel:batch:update', {room: request.room, pixels: request.pixels});
        socket.emit('pixel:put:end', {pixelSize: pixelSize, room: request.room});

      });
    });

  };

  exports.onConnect = function (cb) {
    this.onConnectCallback = cb;
  };
}());
