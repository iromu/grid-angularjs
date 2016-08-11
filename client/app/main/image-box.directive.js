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
        room: '=',
        description: '='
      },
      replace: false,
      link: linkFunc,
      controller: ImageBoxController,
      controllerAs: 'vm',
      bindToController: true
    };

    return directive;

  }

  ImageBoxController.$inject = ['$scope', '$log', '$http', '$timeout', 'pixelSocketService', 'canvasViewService', 'pixelWorkerService'];

  function ImageBoxController($scope, $log, $http, $timeout, pixelSocketService, canvasViewService, pixelWorkerService) {
    var vm = this;

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


    vm.joinNetwork = function () {

      function notifyUpdate(response) {
        if (response.done) {
          if (!vm.reloading) {
            vm.reloading = true;
            vm.loadPreview();
            //vm.toggleNetwork();
          }
        } else {
          var pixels = response.pixels;
          vm.pixelsExternalProcessed += pixels.length;
          vm.pixelsExternalProcessedPercent = vm.pixelsExternalProcessed / 100;
          canvasViewService.pixelBatchUpdate(vm.preview, _.map(pixels, function (pixel) {
            pixel.g = pixel.g + 10;
            return pixel;
          }));
        }

      }

      function onWorkDone(response) {
        $log.info('Done worker RESPONSE: ' + response);
        if (!vm.reloading) {
          vm.reloading = true;
          vm.loadPreview();
          //vm.toggleNetwork();
        }
      }

      function onError(error) {
        $log.error('pixelWorkerService() ERROR : ' + error);
      }

      pixelWorkerService.startWork({room: vm.room, loop: true}).then(onWorkDone, onError, notifyUpdate);

    };

    vm.leaveNetwork = function () {
      pixelWorkerService.stopWork(vm.room);
    };


    vm.putPixels = function (room, pixels) {
      pixelSocketService.putPixels({room: room, pixels: pixels});
    };

    $scope.$on('$destroy', function () {
      $log.warn('$destroy main');
      vm.stopRequestingBuffer = true;
      vm.joined = false;
      pixelSocketService.unsync();
    });

    vm.loadPreview = function (cb) {

      canvasViewService.clearImage(vm.preview);
      canvasViewService.loadImage(vm.preview, 'api/pixels/preview/' + vm.room, function () {
        vm.reloading = false;
        vm.pixelsExternalProcessed = 0;
        vm.pixelsExternalProcessedPercent = 0;
        cb();
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

      $scope.$on('startAll', function (event, data) {
        vm.toggleNetwork();
      });
    };
  }
}());
