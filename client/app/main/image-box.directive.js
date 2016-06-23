(function () {
  angular
    .module('gridApp')
    .directive('imageBox', imageBox);

  function imageBox() {
    var directive = {
      templateUrl: 'app/main/image-box.html',
      restrict: 'EA',
      scope: {
        max: '='
      },
      replace: true,
      controller: ImageBoxController,
      controllerAs: 'vm',
      bindToController: true
    };
    return directive;

  }

  ImageBoxController.$inject = ['$scope', '$log', '$http',
    'pixelSocketService', 'canvasViewService'];

  function ImageBoxController($scope, $log, $http, pixelSocketService, canvasViewService) {
    var vm = this;

    vm.min = 3;

    console.log('CTRL: $scope.vm.min = %s', $scope.vm.min);
    console.log('CTRL: $scope.vm.max = %s', $scope.vm.max);
    console.log('CTRL: vm.min = %s', vm.min);
    console.log('CTRL: vm.max = %s', vm.max);

    //vm.pixelBuffer = [];
    vm.pixelsReceived = 0;
    vm.maxWorkers = 0;
    vm.pixelsExternalProcessed = 0;
    vm.serverResponse = '';
    vm.lastError = '';
    vm.imageName = '';
    vm.totalNodes = [];

    vm.joined = false;
    vm.stopRequestingBuffer = true;

    var pixelSocketServiceListening = false;


    var process = function (pixels) {
      if (Array.isArray(pixels) && pixels.length > 0) {
        var onWorkDone = function (pixels) {
          vm.putPixels(pixels);
          canvasViewService.pixelBatchUpdate('#snapshot', pixels.map(function (pixel) {
            pixel.r = 255;
            pixel.a = 100;
            return pixel;
          }));
          canvasViewService.pixelBatchUpdate('#preview', pixels.map(function (pixel) {
            pixel.r = pixel.s;
            pixel.g = pixel.s + 50;
            pixel.b = pixel.s;
            return pixel;
          }));
          setTimeout(vm.loadPixelBuffer, 500);
        };

        vm.pixelsReceived += pixels.length;
        if (vm.maxWorkers > 0) {
          var p = new Parallel(pixels, {maxWorkers: vm.maxWorkers});
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

      pixelSocketService.bindArray(vm.totalNodes);

      pixelSocketService.onSnapshot(function (imageName) {
        vm.imageName = imageName;
        vm.loadSnapshot();
      });

      pixelSocketService.onPixelBatchUpdate(function (pixels) {
        if (Array.isArray(pixels) && pixels.length > 0) {
          vm.pixelsExternalProcessed += pixels.length;
          vm.pixelsExternalProcessedPercent = vm.pixelsExternalProcessed / 100;
          canvasViewService.pixelBatchUpdate('#preview', pixels.map(function (pixel) {
            pixel.r = pixel.s;
            pixel.g = pixel.s;
            pixel.b = pixel.s;
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
          setTimeout(vm.loadPixelBuffer, 1000);
        }
      });

      pixelSocketServiceListening = true;

    };

    vm.joinNetwork = function () {
      if (vm.stopRequestingBuffer === false) {
        pixelSocketService.joinNetwork('grey');
        pixelSocketService.requestPixelBuffer();
      }
    };
    vm.leaveNetwork = function () {
      if (vm.stopRequestingBuffer === false) {
        pixelSocketService.leaveNetwork('grey');
      }
    };
    vm.loadPixelBuffer = function () {
      if (vm.stopRequestingBuffer === false) {
        pixelSocketService.requestPixelBuffer();
      }
    };

    function compressGrey(pixels) {
      var min = pixels.map(function (pixel) {
        return {_id: pixel._id, x: pixel.x, y: pixel.y, s: pixel.s};
      });
      return min;
    }

    vm.putPixels = function (pixels) {
      pixelSocketService.putPixels(compressGrey(pixels));
    };

    $scope.$on('$destroy', function () {
      $log.warn('$destroy main');
      vm.stopRequestingBuffer = true;
      vm.joined = false;
      pixelSocketService.unsync();
    });

    vm.loadSnapshot = function () {
      vm.stopRequestingBuffer = true;

      vm.pixelsReceived = 0;
      vm.pixelsExternalProcessed = 0;
      vm.pixelsExternalProcessedPercent = 0;

      canvasViewService.clearImage('#snapshot');
      canvasViewService.loadImage('#snapshot', 'api/pixels/snapshot', function () {
        // vm.lastError = '';

        if (!pixelSocketServiceListening) {
          addListeners();
        }
        if (vm.joined === true) {
          vm.stopRequestingBuffer = false;
          setTimeout(vm.loadPixelBuffer, 2000);
        }
        canvasViewService.clearImage('#preview');
        canvasViewService.loadImage('#preview', 'api/pixels/preview');

      });

    };

    vm.updatePixels = function (pixels) {
      $http.put('/api/pixels/', pixels);
    };

    vm.toggleNetwork = function () {
      if (vm.joined === false) {
        vm.joined = true;
        vm.stopRequestingBuffer = false;
        $('#toggleButton').removeClass('btn-success');
        $('#toggleButton').addClass('btn-danger');
        $('#toggleButton').text('Quit');
        vm.joinNetwork();
      } else {
        vm.stopRequestingBuffer = true;
        vm.joined = false;

        vm.leaveNetwork();
        $('#toggleButton').removeClass('btn-danger');
        $('#toggleButton').addClass('btn-success');

        $('#toggleButton').text('Join');
      }
    };

  };
}());
