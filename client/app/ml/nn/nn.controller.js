(function () {
  'use strict';

  angular.module('gridApp')
    .controller('MlNNCtrl', function ($scope, $interval, $timeout, nnView, trainerService) {

      $scope.infoMsg = '';
      $scope.number = {pick: 0, prediction: 0, sample: 0};
      $scope.inputLayerSize = 400; // 20x20 $scope.region 400 pixeles
      $scope.hiddenLayerSize = 25;
      $scope.numLabels = 10; // 0.1.2.3.4.5.6.7.8.9
      $scope.autoTrain = false;
      $scope.autoPredict = true;

      $scope.region = 0;

      var net = new brain.NeuralNetwork();
      var runNetwork;

      $scope.trainingImageData = null;

      var loadNextNumberInterval = null;

      var autoTrainPrediction = [3, 0, 7, 4, 0, 9, 7, 2, 3, 2, 1, 0, 9, 7, 7, 0, 7, 5, 6, 8, 2, 0, 0, 7, 1, 7, 9, 8, 7,
        4, 1, 8, 8, 0, 4, 9, 5, 5, 5, 3, 4, 7, 9, 4, 1, 6, 2, 9, 8, 6, 8, 8, 6, 0, 8, 0, 3, 0, 0, 7, 8, 0, 5, 8, 4, 5,
        2, 7, 0, 7, 7, 6, 4, 0, 1, 1, 7, 1, 0, 9, 3, 6, 8, 6, 9, 6, 9, 2, 0, 1, 9, 9, 9, 3, 1, 5, 6, 6, 5, 9];

      var init = function () {
        nnView.initView(function () {

          trainerService.setDelegate($scope);

          if ($scope.autoPredict) {
            $timeout($scope.randomSolve, 2000);
          }
          if ($scope.autoTrain) {
            console.log('Auto Train on init. Add samples');
            nnView.onTrainNetwork();
            loadNextNumberInterval = $interval($scope.loadNextNumber, 1000);
          }
        });
      };
      init();

      $scope.loadNextNumber = function () {
        $scope.region += 1;

        if ($scope.region > 100) {
          if ($scope.autoTrain) {
            if (angular.isDefined(loadNextNumberInterval)) {
              $interval.cancel(loadNextNumberInterval);
              loadNextNumberInterval = undefined;
            }

            console.log('Added ' + trainerService.samples() + ' training samples');
            console.log('Auto Training Network');
            trainerService.trainNetwork($scope.configureNetwork);
          }
          $scope.autoTrain = false;
          $scope.region = 1;
        } else {
          $scope.trainingImageData = nnView.loadRegionForTraining($scope.region);

          if ($scope.autoTrain) {
            $scope.number.pick = autoTrainPrediction[$scope.region - 1];
            trainerService.addSampleImageData($scope.number.pick, $scope.trainingImageData);

          }
        }
      };

      $scope.randomSolve = function () {
        if (runNetwork) {
          var selection = Math.floor(Math.random() * 100 + 1);
          var imageData = nnView.loadRegionForPrediction(selection);
          var normalized = trainerService.normalize(imageData);
          var solution = runNetwork(normalized);
          var solutionJson = JSON.stringify(solution, null, 2);
          $scope.number.prediction = trainerService.getMaxLabel(solution);
          $scope.number.sample = autoTrainPrediction[selection - 1];

          console.log('region ' + selection + ' prediction: ' + $scope.number.prediction + ' output:' + solutionJson);
          $scope.$apply();
        }
        $timeout($scope.randomSolve, 2000);
      };

      $scope.configureNetwork = function (json) {
        console.log('Loading network');
        nnView.onConfigureNetwork();
        console.log(JSON.stringify(json.info, null, 2));
        net = new brain.NeuralNetwork().fromJSON(json.net);
        runNetwork = net.toFunction();
        runNetwork.name = 'runNetwork';
      };

      $scope.nextNumber = function () {
        trainerService.addSampleImageData($scope.number.pick, $scope.trainingImageData.data);
        nnView.onNextNumber();
        $scope.loadNextNumber();
      };

      $scope.trainNetwork = function () {
        trainerService.trainNetwork();
        nnView.onTrainNetwork();
      };

      $scope.autoTrainNetwork = function () {
        $scope.autoTrain = true;
        $scope.region = 0;
        nnView.onTrainNetwork();
        loadNextNumberInterval = $interval($scope.loadNextNumber, 1000);
      };

      $scope.$on('$destroy', function () {
        if (angular.isDefined(loadNextNumberInterval)) {
          $interval.cancel(loadNextNumberInterval);
          loadNextNumberInterval = undefined;
        }
      });

    });
}());
