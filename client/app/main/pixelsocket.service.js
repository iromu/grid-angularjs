(function () {
  'use strict';

  angular.module('gridApp')
    .factory('pixelSocketService', function (socket, $log) {
      var pixelSocketService = angular.extend(socket, {});

      pixelSocketService.bindArray = function (array) {
        socket.socket.on('socket:connect', function (id) {
          $log.debug('Connected ' + id);
          array.push(id);
        });
        socket.socket.on('socket:info', function (ids) {
          array.splice(0, array.length);
          ids.forEach(function (id) {
            array.push(id);
          });
        });
        socket.socket.on('socket:disconnect', function (id) {
          //$log.warn('Disconnected ' + id);
          _.remove(array, function (current) {
            return id === current;
          });
        });

        socket.socket.emit('socket:info');
      };

      pixelSocketService.onSnapshot = function (room, cb) {
        cb = cb || angular.noop;
        socket.socket.on('snapshot', function (data) {
          if (room === data.room) {
            $log.debug('snapshot');
            cb(data.image);
          }
        });
      };

      pixelSocketService.onPixelBatchUpdate = function (room, cb) {
        cb = cb || angular.noop;
        socket.socket.on('pixel:batch:update', function (data) {
          if (room === data.room) {
            cb(data.pixels);
          }
        });
      };

      pixelSocketService.onPixelBufferResponse = function (room, cb) {
        cb = cb || angular.noop;
        socket.socket.on('pixel:buffer:response', function (data) {
            if (room === data.room) {
              $log.debug('<pixel:buffer:response ' + room);
              cb(data);
            }
          }
        );
      };

      pixelSocketService.putPixels = function (data) {
        $log.debug('>pixel:put room: ' + data.room);
        socket.socket.emit('pixel:put', data);
      };

      pixelSocketService.onPutPixelsEnd = function (room, cb) {
        cb = cb || angular.noop;
        socket.socket.on('pixel:put:end', function (data) {
          if (room === data.room) {
            $log.debug('<pixel:put:end ' + room);
            cb(room);
          }
        });
      };
      pixelSocketService.requestPixelBuffer = function (room) {
        $log.debug('>pixel:buffer:request ' + room);
        socket.socket.emit('pixel:buffer:request', room);
      };

      pixelSocketService.unsync = function () {
        socket.socket.removeAllListeners('snapshot');
        socket.socket.removeAllListeners('pixel:batch:update');
        socket.socket.removeAllListeners('room:joined');
        socket.socket.removeAllListeners('pixel:put:end');
        socket.socket.removeAllListeners('pixel:buffer:response');
        socket.socket.removeAllListeners('socket:info');
        socket.socket.removeAllListeners('socket:connect');
        socket.socket.removeAllListeners('socket:disconnect');
      };

      pixelSocketService.joinNetwork = function (network) {
        $log.debug('>room:join ' + network);
        socket.socket.emit('room:join', network);
      };


      pixelSocketService.onJoinNetwork = function (room, cb) {
        cb = cb || angular.noop;
        socket.socket.on('room:joined', function (_room) {
          if (room === _room) {
            $log.debug('<room:joined ' + room);
            cb(room);
          }
        });
      };

      pixelSocketService.leaveNetwork = function (network) {
        socket.socket.emit('room:leave', network);
      };
      $log.info('Created pixelSocketService');
      return pixelSocketService;
    });
}());
