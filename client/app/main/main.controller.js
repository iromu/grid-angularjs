'use strict';

angular.module('gridApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.pixelBuffer = [];
    var socketListening = false;

    var process = function (pixels) {
      if (Array.isArray(pixels) && pixels.length > 0) {
        var element = $('#snapshot')[0];
        var c = element.getContext('2d');
        var imageData = c.createImageData(1, 1);
        var arrayProcessed = [];

        pixels.forEach(function (item) {
          arrayProcessed.push(processPixel(c, imageData, item));
        });

        $scope.putPixels(arrayProcessed);
        $scope.loadPixelBuffer();
      }
    };

    var addListeners = function () {

      socket.onSnapshot(function () {
        $scope.loadSnapshot();
      });

      socket.onPixelBatchUpdate(function (items) {
        pixelBatchUpdate(items);
      });

      socket.onPixelBufferResponse(function (items) {
        process(items);
      });

      socket.syncUpdates('pixel', $scope.pixelBuffer, function (event, item) {

        if ('update' === event) {
          //updatePixel(item);
        }
      });
      socketListening = true;

    };

    $scope.loadPixelBuffer = function () {
      socket.requestPixelBuffer();
    };

    $scope.putPixels = function (pixels) {
      socket.putPixels(pixels);
    };

    $scope.$on('$destroy', function () {
      socketListening = false;
      socket.unsyncUpdates('pixel');
    });

    $scope.loadSnapshot = function () {
      var snapshot = $('#snapshot')[0];
      var c = snapshot.getContext('2d');

      c.clearRect(0, 0, snapshot.width, snapshot.height);
      c.fillText('Loading...', 20, 50);

      var drawing = new Image();
      drawing.src = 'api/pixels/snapshot';
      drawing.onload = function () {

        c.drawImage(drawing, 0, 0);

        if (!socketListening) {
          addListeners();
        }

        $scope.loadPixelBuffer();

      };
    };

    var pixelBatchUpdate = function (pixels) {
      var element = $('#snapshot')[0];
      var c = element.getContext('2d');
      var imageData = c.createImageData(1, 1);

      pixels.forEach(function (item) {
        setPixel(imageData, 0, 0, item.r, 255, item.b, item.a);
        c.putImageData(imageData, item.x, item.y);
      });

    };

    var updatePixel = function (item) {
      var element = $('#snapshot')[0];
      var c = element.getContext('2d');
      var imageData = c.createImageData(1, 1);
      setPixel(imageData, 0, 0, item.r, 255, 255, item.a);
      c.putImageData(imageData, item.x, item.y);
    };

    var processPixel = function (c, imageData, item) {

      var grayscalecolor = (item.r + item.g + item.b) / 3;
      item.r = grayscalecolor;
      item.g = grayscalecolor;
      item.b = grayscalecolor;

      setPixel(imageData, 0, 0, 255, item.g, item.b, item.a); // 255 opaque
      c.putImageData(imageData, item.x, item.y); // at coords 0,0

      return item;
    };

    var setPixel = function (imageData, x, y, r, g, b, a) {
      var index = (x + y * imageData.width) * 4;
      imageData.data[index] = r;
      imageData.data[index + 1] = g;
      imageData.data[index + 2] = b;
      imageData.data[index + 3] = a;
    };

  });

