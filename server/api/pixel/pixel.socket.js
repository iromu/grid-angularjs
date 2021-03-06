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
      if (!room) {
        logger.error('Socket Error\n%s', 'no room');
      } else {
        service.getPixels(room)
          .then(function (data) {
            if (data.hasOwnProperty('reload')) {
              logger.debug('[%s] to [%s] pixel:buffer:reload %s', socket.id, room, JSON.stringify(data.image, null, 2));
              io.to(room).emit('pixel:buffer:reload', {image: data.image, room: room});
            }
            if (data.hasOwnProperty('pixels')) {
              socket.emit('pixel:buffer:response', data);
            }
          })
          .catch(function (error) {
            logger.error('ERROR to [%s] pixel:buffer:reload %s', room, JSON.stringify(error, null, 2));
          });
      }
    });

    socket.on('pixel:put', function (request) {
      var room = request.room;

      var broadcast = function () {
        var pixelSize = _.size(request.pixels);
        socket.to(room).emit('pixel:batch:update', {room: request.room, pixels: request.pixels});
        socket.emit('pixel:put:end', {pixelSize: pixelSize, room: request.room});
      };

      if (Array.isArray(request.pixels)) {
        service
          .bulkUpdate(request.pixels)
          .then(broadcast)
          .catch(function (error) {
            logger.error('Socket Error\n%s', error.stack);
          });
      }

    });

  };

  exports.onConnect = function (cb) {
    this.onConnectCallback = cb;
  };
}());
