(function () {
  'use strict';

  angular.module('gridApp')
    .controller('MainCtrl', function ($scope, $log, $http, $filter, pixelSocketService, canvasViewService) {
      //$scope.pixelBuffer = [];
      $scope.pixelsReceived = 0;
      $scope.maxWorkers = 0;
      $scope.pixelsExternalProcessed = 0;
      $scope.serverResponse = '';
      $scope.lastError = '';
      $scope.imageName = '';
      $scope.totalNodes = [];

      $scope.joined = false;
      $scope.stopRequestingBuffer = true;

      var pixelSocketServiceListening = false;


      var process = function (pixels) {
        if (Array.isArray(pixels) && pixels.length > 0) {
          var element = $('#snapshot')[0];
          var c = element.getContext('2d');
          var imageData = c.createImageData(1, 1);

          var onWorkDone = function (pixels) {
            $scope.putPixels(pixels);
            canvasViewService.drawProcessed(c, imageData, pixels);
            setTimeout($scope.loadPixelBuffer, 500);
          };

          $scope.pixelsReceived += pixels.length;
          if ($scope.maxWorkers > 0) {
            var p = new Parallel(pixels, {maxWorkers: $scope.maxWorkers});
            var job = function (item) {
              item.s = Math.round((item.r + item.g + item.b) / 3);
              return item;
            };
            p.map(job).then(function (arrayProcessed) {
              onWorkDone(arrayProcessed);
            });
          } else {
            pixels.forEach(function (item) {
                item.s = Math.round((item.r + item.g + item.b) / 3);
              }
            );
            onWorkDone(pixels);
          }

        }
      };

      var addListeners = function () {

        pixelSocketService.bindArray($scope.totalNodes);

        pixelSocketService.onSnapshot(function (imageName) {
          $scope.imageName = imageName;
          $scope.loadSnapshot();
        });

        pixelSocketService.onPixelBatchUpdate(function (pixels) {
          if (Array.isArray(pixels) && pixels.length > 0) {
            $scope.pixelsExternalProcessed += pixels.length;
            canvasViewService.pixelBatchUpdate('#preview', pixels.map(function (pixel) {
              pixel.r = pixel.s;
              pixel.g = pixel.s;
              pixel.b = pixel.s;
              pixel.a = 255;
              return pixel;
            }));
          } else {
            $log.warn('onPixelBatchUpdate() empty array received.');
          }
        });

        pixelSocketService.onPixelBufferResponse(function (pixels) {

          if (Array.isArray(pixels) && pixels.length > 0) {
            process(pixels);
          } else {
            $log.warn('onPixelBufferResponse() empty array received for processing.');
            setTimeout($scope.loadPixelBuffer, 1000);
          }
        });

        pixelSocketServiceListening = true;

      };

      $scope.joinNetwork = function () {
        if ($scope.stopRequestingBuffer === false) {
          pixelSocketService.joinNetwork('grey');
          pixelSocketService.requestPixelBuffer();
        }
      };
      $scope.leaveNetwork = function () {
        if ($scope.stopRequestingBuffer === false) {
          pixelSocketService.leaveNetwork('grey');
        }
      };
      $scope.loadPixelBuffer = function () {
        if ($scope.stopRequestingBuffer === false) {
          pixelSocketService.requestPixelBuffer();
        }
      };

      function compressGrey(pixels) {
        var min = pixels.map(function (pixel) {
          return {_id: pixel._id, x: pixel.x, y: pixel.y, s: pixel.s};
        });
        return min;
      }

      $scope.putPixels = function (pixels) {
        pixelSocketService.putPixels(compressGrey(pixels));
      };

      $scope.$on('$destroy', function () {
        $log.warn('$destroy main');
        $scope.stopRequestingBuffer = true;
        $scope.joined = false;
        pixelSocketService.unsync();
      });

      $scope.loadSnapshot = function () {
        $scope.stopRequestingBuffer = true;

        $scope.pixelsReceived = 0;
        $scope.pixelsExternalProcessed = 0;

        canvasViewService.clearImage('#snapshot');
        canvasViewService.loadImage('#snapshot', 'api/pixels/snapshot', function () {
          // $scope.lastError = '';

          if (!pixelSocketServiceListening) {
            addListeners();
          }
          if ($scope.joined === true) {
            $scope.stopRequestingBuffer = false;
            setTimeout($scope.loadPixelBuffer, 2000);
          }
          canvasViewService.clearImage('#preview');
          canvasViewService.loadImage('#preview', 'api/pixels/preview');

        });

      };

      $scope.updatePixels = function (pixels) {
        $http.put('/api/pixels/', pixels);
      };

      $scope.toggleNetwork = function () {
        if ($scope.joined === false) {
          $scope.joined = true;
          $scope.stopRequestingBuffer = false;
          $('#toggleButton').removeClass('btn-success');
          $('#toggleButton').addClass('btn-danger');
          $('#toggleButton').text('Quit');
          $scope.joinNetwork();
        } else {
          $scope.stopRequestingBuffer = true;
          $scope.joined = false;

          $scope.leaveNetwork();
          $('#toggleButton').removeClass('btn-danger');
          $('#toggleButton').addClass('btn-success');

          $('#toggleButton').text('Join');
        }
      };


    });

}());
