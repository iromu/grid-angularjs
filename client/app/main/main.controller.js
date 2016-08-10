'use strict';

angular.module('gridApp')
  .controller('MainController', function ($scope, $log, $http, $filter, pixelSocketService, canvasViewService) {
    var vm = this;

    vm.startAll = function () {
      $scope.$broadcast('startAll');
    };

  });
