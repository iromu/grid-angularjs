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

      pixelSocketService.onSnapshot = function (cb) {
        cb = cb || angular.noop;
        socket.socket.on('snapshot', function (imageName) {
          $log.debug('snapshot');
          cb(imageName);
        });
      };

      pixelSocketService.onPixelBatchUpdate = function (cb) {
        cb = cb || angular.noop;
        socket.socket.on('pixel:batch:update', function (items) {
          cb(items);
        });
      };

      pixelSocketService.onPixelBufferResponse = function (cb) {
        cb = cb || angular.noop;
        socket.socket.on('pixel:buffer:response', function (items) {
          cb(items);
        });
      };

      pixelSocketService.putPixels = function (pixels) {
        socket.socket.emit('pixel:put', pixels);
      };

      pixelSocketService.requestPixelBuffer = function () {
        socket.socket.emit('pixel:buffer:request');
      };

      pixelSocketService.unsync = function () {
        socket.removeAllListeners('snapshot');
        socket.removeAllListeners('pixel:batch:update');
        socket.removeAllListeners('pixel:buffer:response');
        socket.removeAllListeners('socket:info');
        socket.removeAllListeners('socket:connect');
        socket.removeAllListeners('socket:disconnect');
      };

      pixelSocketService.joinNetwork = function (network) {
        socket.socket.emit('room:join', network);
      };

      pixelSocketService.leaveNetwork = function (network) {
        socket.socket.emit('room:leave', network);
      };

      return pixelSocketService;
    });
}());
