(function () {
  angular
    .module('gridApp')
    .directive('imageBox', imageBox);

  function imageBox() {

    function linkFunc(scope, el, attr, ctrl) {
      scope.vm.preview = el.find('canvas')[0];
      scope.vm.overlay = el.find('canvas')[1];
      ctrl.init();
    }

    var directive = {
      templateUrl: 'app/main/image-box.html',
      restrict: 'EA',
      scope: {
        room: '='
      },
      replace: true,
      link: linkFunc,
      controller: ImageBoxController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

  }

  ImageBoxController.$inject = ['$scope', '$log', '$http', '$timeout', 'pixelSocketService', 'canvasViewService'];

  function ImageBoxController($scope, $log, $http, $timeout, pixelSocketService, canvasViewService) {
    var vm = this;

    //vm.pixelBuffer = [];
    vm.pixelsReceived = 0;
    vm.maxWorkers = 2;
    vm.pixelsExternalProcessed = 0;
    vm.serverResponse = '';
    vm.lastError = '';
    vm.imageName = '';
    vm.totalNodes = [];

    vm.joined = false;
    vm.stopRequestingBuffer = true;

    vm.pixelSocketServiceListening = false;


    var process = function (pixels) {

      $log.debug('process');

      if (Array.isArray(pixels) && pixels.length > 0) {
        $log.debug('process Array');

        var job = function (pixel) {
          if (vm.room === 'grey') {
            pixel.s = Math.round((pixel.r + pixel.g + pixel.b) / 3);
            pixel.r = pixel.s;
            pixel.g = pixel.s;
            pixel.b = pixel.s;
          } else if (vm.room === 'invert') {
            pixel.s = null;
            pixel.r = 255 - pixel.r;
            pixel.g = 255 - pixel.g;
            pixel.b = 255 - pixel.b;
          }
          return pixel;
        };

        var onWorkDone = function (pixels) {
          if (vm.room === 'grey') {
            vm.putPixels(vm.room, compressGrey(pixels));
          } else {
            vm.putPixels(vm.room, pixels);
          }

          canvasViewService.pixelBatchUpdate(vm.preview, _.map(pixels, function (pixel) {
            pixel.g = pixel.g + 10;
            return pixel;
          }));

          var selection = {
            size: 100,
            width: 10,
            height: 10,
            x: _.min(pixels, function (o) {
              return o.x;
            }),
            y: _.min(pixels, function (o) {
              return o.y;
            })
          };


        };

        vm.pixelsReceived += pixels.length;
        onWorkDone(_.map(pixels, job));
      }
    };

    var addListeners = function () {

      pixelSocketService.bindArray(vm.totalNodes);

      pixelSocketService.onSnapshot(function (imageName) {
        vm.imageName = imageName;
        vm.loadPreview();
      });

      pixelSocketService.onPixelBatchUpdate(function (data) {
        var pixels = data.pixels;
        if (Array.isArray(pixels) && pixels.length > 0) {
          vm.pixelsExternalProcessed += pixels.length;
          vm.pixelsExternalProcessedPercent = vm.pixelsExternalProcessed / 100;
          //canvasViewService.drawSelection(vm.overlay, data.selection, 'cyan');
          canvasViewService.pixelBatchUpdate(vm.preview, pixels);
        } else {
          $log.warn('onPixelBatchUpdate() empty array received.');
        }
      });

      pixelSocketService.onPixelBufferResponse(vm.room, function (data) {
        var pixels = data.pixels;
        if (Array.isArray(pixels) && pixels.length > 0) {
          canvasViewService.drawSelection(vm.overlay, data.selection, '#CCFFCC');
          process(pixels);
        } else {
          $log.warn('onPixelBufferResponse() empty array received for processing.');
          setTimeout(vm.loadPixelBuffer, 1000);
        }
      });

      pixelSocketService.onPutPixelsEnd(vm.room, function (data) {
        vm.loadPixelBuffer();
      });

      pixelSocketService.onJoinNetwork(vm.room, function (room) {
        vm.loadPixelBuffer();
      });

      vm.pixelSocketServiceListening = true;

    };

    vm.joinNetwork = function () {
      if (vm.stopRequestingBuffer === false) {
        pixelSocketService.joinNetwork(vm.room);
      }
    };
    vm.leaveNetwork = function () {
      if (vm.stopRequestingBuffer === false) {
        pixelSocketService.leaveNetwork(vm.room);
      }
    };
    vm.loadPixelBuffer = function () {
      if (vm.stopRequestingBuffer === false) {
        pixelSocketService.requestPixelBuffer(vm.room);
      }
    };

    function compressGrey(pixels) {
      return pixels.map(function (pixel) {
        return {_id: pixel._id, x: pixel.x, y: pixel.y, s: pixel.s};
      });
    }

    vm.putPixels = function (room, pixels) {
      pixelSocketService.putPixels({room: room, pixels: pixels});
    };

    $scope.$on('$destroy', function () {
      $log.warn('$destroy main');
      vm.stopRequestingBuffer = true;
      vm.joined = false;
      pixelSocketService.unsync();
    });

    vm.loadPreview = function () {

      $log.warn('loadPreview before loading preview room: ' + vm.room);
      vm.stopRequestingBuffer = true;

      vm.pixelsReceived = 0;
      vm.pixelsExternalProcessed = 0;
      vm.pixelsExternalProcessedPercent = 0;

      canvasViewService.clearImage(vm.preview);
      canvasViewService.clearImage(vm.overlay);

      canvasViewService.loadImage(vm.preview, 'api/pixels/preview/' + vm.room, function () {

        if (!vm.pixelSocketServiceListening) {
          addListeners();
        }
        if (vm.joined === true) {
          $log.warn('loadPixelBuffer after loading snapshot');
          vm.stopRequestingBuffer = false;
          $timeout(vm.loadPixelBuffer, 2000);
        }

      });

    };

    vm.updatePixels = function (pixels) {
      $http.put('/api/pixels/', pixels);
    };

    vm.toggleNetwork = function () {
      if (vm.joined === false) {
        vm.joined = true;
        vm.stopRequestingBuffer = false;
        vm.toggleButtonClass = 'btn-danger';
        vm.toggleButtonText = 'Quit';
        vm.joinNetwork();
      } else {
        vm.stopRequestingBuffer = true;
        vm.joined = false;

        vm.leaveNetwork();
        vm.toggleButtonClass = 'btn-success';

        vm.toggleButtonText = 'Join';
      }
    };

    vm.init = function () {
      vm.toggleButtonText = 'Join';
      vm.loadPreview();
    };
  }
}());
