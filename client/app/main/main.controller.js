'use strict';

angular.module('gridApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomePixels = [];


    var syncUpdates = function () {
      $http.get('/api/pixels').success(function (awesomePixels) {
        process(awesomePixels);
        $scope.awesomePixels = awesomePixels;
        socket.syncUpdates('pixel', $scope.awesomePixels, function (event, item, array) {
          if ('created' === event) {
            var element = $('#snapshot')[0];
            var c = element.getContext("2d");
            var imageData = c.createImageData(1, 1);

            processPixel(c, imageData, item);
          }
          else if ('updated' === event) {
            var element = $('#snapshot')[0];
            var c = element.getContext("2d");
            var imageData = c.createImageData(1, 1);
            setPixel(imageData, 0, 0, item.r, item.g, item.b, 255); // 255 opaque
            c.putImageData(imageData, item.x, item.y); // at coords 0,0
          }
        });
      });
    };

    $scope.loadSnapshot = function () {
      var c = $('#snapshot')[0].getContext("2d");
      c.clearRect ( 0 , 0 , $('#snapshot')[0].width, $('#snapshot')[0].height );
      c.fillText('Loading...', 50, 50);
      var drawing = new Image();
      drawing.src = "api/pixels/snapshot";
      drawing.onload = function () {
        c.drawImage(drawing, 0, 0);
        syncUpdates();
      };
    }

    var process = function (array) {
      if (array.length > 0) {
        var element = $('#snapshot')[0];
        var c = element.getContext("2d");
        var imageData = c.createImageData(1, 1);
        var array_p = [];

        array.forEach(function (item) {
          array_p.push(processPixel(c, imageData, item));
        });
        $scope.updatePixels(array_p);
        $http.get('/api/pixels').success(function (awesomePixels) {
          process(awesomePixels);
        });
      } else {
        $scope.loadSnapshot();
      }
    };

    var processPixel = function (c, imageData, item) {

      var grayscalecolor = (item.r + item.g + item.b) / 3;
      item.r = grayscalecolor;
      item.g = grayscalecolor;
      item.b = grayscalecolor;

      setPixel(imageData, 0, 0, item.r, item.g, item.b, 255); // 255 opaque
      c.putImageData(imageData, item.x, item.y); // at coords 0,0

      return item;
    };

    var setPixel = function (imageData, x, y, r, g, b, a) {
      var index = (x + y * imageData.width) * 4;
      imageData.data[index + 0] = r;
      imageData.data[index + 1] = g;
      imageData.data[index + 2] = b;
      imageData.data[index + 3] = a;
    };

    $scope.addPixel = function () {
      if ($scope.newPixel === '') {
        return;
      }
      $http.post('/api/pixels', {name: $scope.newPixel});
      $scope.newPixel = '';
    };

    $scope.deletePixel = function (pixel) {
      $http.delete('/api/pixels/' + pixel._id);
    };

    $scope.updatePixel = function (pixel) {
      $http.put('/api/pixels/' + pixel._id, pixel);
    };

    $scope.updatePixels = function (pixels) {
      $http.put('/api/pixels/', pixels);
    };

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('pixel');
    });
  });
