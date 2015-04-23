(function () {
  'use strict';

  angular.module('gridApp')
    .controller('MainCtrl', function ($scope, $log, $http, $filter, pixelSocketService, canvasViewService) {
      $scope.pixelBuffer = [];
      $scope.pixelsReceived = 0;
      $scope.maxWorkers = 4;
      $scope.pixelsExternalProcessed = 0;
      $scope.serverResponse = '';
      $scope.lastError = '';
      $scope.imageName = 'Processing';

      var stopRequestingBuffer = false;
      var pixelSocketServiceListening = false;

      var getIdsFromPixels = function (pixels) {
        var ids = pixels.map(function (pixel) {
          return pixel._id;
        });
        return ids;
      };

      var process = function (pixels) {
        if (Array.isArray(pixels) && pixels.length > 0) {
          var element = $('#snapshot')[0];
          var c = element.getContext('2d');
          var imageData = c.createImageData(1, 1);
          $scope.pixelsReceived += pixels.length;
          var p = new Parallel(pixels, {maxWorkers: $scope.maxWorkers});
          var job = function (item) {
            var grayscalecolor = (item.r + item.g + item.b) / 3;
            item.r = grayscalecolor;
            item.g = grayscalecolor;
            item.b = grayscalecolor;
            item.processed = true;
            return item;
          };
          p.map(job).then(function (arrayProcessed) {
            $scope.putPixels(arrayProcessed);
            canvasViewService.drawProcessed(c, imageData, arrayProcessed);
            setTimeout($scope.loadPixelBuffer, 500);
          });

        }
      };

      var addListeners = function () {

        pixelSocketService.onSnapshot(function (imageName) {
          $scope.imageName = 'Processing ' + imageName;
          $scope.loadSnapshot();
        });

        pixelSocketService.onPixelBatchUpdate(function (pixels) {
          if (Array.isArray(pixels) && pixels.length > 0) {
            $scope.pixelsExternalProcessed += pixels.length;
            canvasViewService.pixelBatchUpdate('#preview', pixels);
            canvasViewService.pixelBatchUpdate('#snapshot', pixels.map(function (pixel) {
              pixel.g = 255;
              return pixel;
            }));
          } else {
            $log.warn('onPixelBatchUpdate() empty array received.');
          }
        });

        pixelSocketService.onPixelBufferResponse(function (pixels) {

          if (Array.isArray(pixels) && pixels.length > 0) {
            var pixelIds = getIdsFromPixels(pixels);
            if ($scope.pixelBuffer.length > 0) {
              var diff = _.difference(pixelIds, $scope.pixelBuffer);
              if (diff !== $scope.pixelBuffer) {
                $log.warn('Duplicated ' + pixelIds[0]);
              }
            }
            $scope.pixelBuffer = $scope.pixelBuffer.concat(pixelIds);

            process(pixels);
          } else {
            $log.warn('onPixelBufferResponse() empty array received for processing.');
            setTimeout($scope.loadPixelBuffer, 1000);
          }
        });

        pixelSocketServiceListening = true;

      };

      $scope.loadPixelBuffer = function () {
        if (stopRequestingBuffer === false) {
          pixelSocketService.requestPixelBuffer();
        }
      };

      $scope.putPixels = function (pixels) {
        pixelSocketService.putPixels(pixels);
        // $scope.updatePixels(pixels);
      };

      $scope.$on('$destroy', function () {
        pixelSocketServiceListening = false;
        pixelSocketService.unsync();
      });

      $scope.loadSnapshot = function () {
        stopRequestingBuffer = true;

        var totalReceived = $scope.pixelsReceived + $scope.pixelsExternalProcessed;
        var msg = sprintf('\n%s - %s Consistency warning. Expected %s Received %s',
          moment().format(), $scope.imageName, ($filter('number')((100 * 100), 0)),
          ($filter('number')(totalReceived, 0)));

        $scope.lastError += (totalReceived > 0 && totalReceived > (100 * 100)) ? msg : '';
        $scope.pixelsReceived = 0;
        $scope.pixelsExternalProcessed = 0;
        canvasViewService.loadImage('#snapshot', 'api/pixels/snapshot', function () {
          // $scope.lastError = '';
          stopRequestingBuffer = false;
          if (!pixelSocketServiceListening) {
            addListeners();
          }
          $scope.loadPixelBuffer();
          canvasViewService.clearImage('#preview');
        });

      };

      $scope.updatePixels = function (pixels) {
        $http.put('/api/pixels/', pixels);
      };

    });

}());
