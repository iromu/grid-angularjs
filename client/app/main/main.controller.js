'use strict';

angular.module('gridApp')
  .controller('MainCtrl', function ($scope, $http, pixelSocketService, canvasViewService) {
    $scope.pixelBuffer = [];
    $scope.serverResponse = '';

    var pixelSocketServiceListening = false;

    var process = function (pixels) {
      if (Array.isArray(pixels) && pixels.length > 0) {
        var element = $('#snapshot')[0];
        var c = element.getContext('2d');
        var imageData = c.createImageData(1, 1);
        var arrayProcessed = [];

        pixels.forEach(function (item) {
          arrayProcessed.push(canvasViewService.processPixel(c, imageData, item));
        });

        $scope.putPixels(arrayProcessed);
        $scope.loadPixelBuffer();
      }
    };

    var addListeners = function () {

      pixelSocketService.onSnapshot(function (imageName) {
        $scope.imageName = imageName;
        $scope.loadSnapshot();
      });

      pixelSocketService.onPixelBatchUpdate(function (pixels) {
        canvasViewService.pixelBatchUpdate('#preview', pixels);
        canvasViewService.pixelBatchUpdate('#snapshot', pixels.map(function (pixel) {
          pixel.g = 255;
          return pixel;
        }));
      });

      pixelSocketService.onPixelBufferResponse(function (items) {
        process(items);
      });

      pixelSocketServiceListening = true;

    };

    $scope.loadPixelBuffer = function () {
      pixelSocketService.requestPixelBuffer();
    };

    $scope.putPixels = function (pixels) {
      pixelSocketService.putPixels(pixels);
    };

    $scope.$on('$destroy', function () {
      pixelSocketServiceListening = false;
      pixelSocketService.unsync();
    });

    $scope.loadSnapshot = function () {

      canvasViewService.loadImage('#snapshot', 'api/pixels/snapshot', function () {
        if (!pixelSocketServiceListening) {
          addListeners();
        }
        $scope.loadPixelBuffer();
        canvasViewService.clearImage('#preview');
      });

    };

  });

