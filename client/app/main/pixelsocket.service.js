(function () {
  'use strict';

  angular.module('gridApp')
    .factory('pixelSocketService', function (socket) {
      var pixelSocketService = angular.extend(socket, {});

      pixelSocketService.onSnapshot = function (cb) {
        cb = cb || angular.noop;
        socket.socket.on('snapshot', function (imageName) {
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
      };

      return pixelSocketService;
    });
}());
