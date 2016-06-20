'use strict';

angular.module('gridApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('ml-nn', {
        url: '/ml/nn',
        templateUrl: 'app/ml/nn/nn.html',
        controller: 'MlNNController'
      });
  });

