(function () {
  'use strict';

  angular.module('gridApp')
    .controller('MlNNCtrl', function ($scope, nnViewService) {

      $scope.infoMsg = '';
      $scope.pickNumber = 0;
      $scope.inputLayerSize = 900; // 30x30 region 900 pixeles
      $scope.hiddenLayerSize = 25;
      $scope.numLabels = 10; // 0.1.2.3.4.5.6.7.8.9

      var region = 0;

      var net = new brain.NeuralNetwork();
      var runNetwork;

      $scope.loadNumbers = function () {
        nnViewService.initView(function () {
          $scope.loadNumber();
          setTimeout($scope.randomSolve, 500);
        });
      };
      $scope.loadNumber = function () {
        region = region < 100 ? region + 1 : 1;
        nnViewService.loadRegion(region);
        // setTimeout($scope.loadNumber, 500);
      };
      $scope.randomSolve = function () {
        if (runNetwork) {
          var selection = Math.floor(Math.random() * 100 + 1);
          var data = nnViewService.getRegionData(selection);
          var normalized = utils.normalize(data);
          var solution = runNetwork(normalized);
          var solutionJson = JSON.stringify(solution, null, 2);
          console.log('Region ' + selection + ' output:' + solutionJson);
          $scope.infoMsg += '\n region ' + selection + ' output:' + solutionJson;
        }
        setTimeout($scope.randomSolve, 500);
      };

      $scope.configureNetwork = function (json) {
        $('#trainButton').prop('disabled', false);
        $scope.infoMsg += '\n' + JSON.stringify(json.info, null, 2);
        console.log(JSON.stringify(json.info, null, 2));
        net = new brain.NeuralNetwork().fromJSON(json.net);
        runNetwork = net.toFunction();
        runNetwork.name = 'runNetwork';
      };

      var trainer = {
          imagedata: [],
          data: [], numbers: [],

          pickSwatch: function (number) {
            var result = {
              input: utils.normalize(this.imagedata),
              output: utils.createObject(number, number)
            };
            this.data.push(result);
            this.numbers.push(number);

            $scope.loadNumber();
          },
          trainNetwork: function () {
            var p = new Parallel(this.data, {evalPath: 'assets/scripts/eval.js'});
            p.require('brain-0.6.3.js');
            p.spawn(function (data) {
              var net = new brain.NeuralNetwork({
                hiddenLayers: [25],
                learningRate: 0.6
              });
              var info = net.train(data, {
                iterations: 400,
                log: true,
                logPeriod: 10
              });
              return {info: info, net: net.toJSON()};
            }).then(function (json) {
              $scope.configureNetwork(json);
            });
          }
        }
        ;

      var utils = {
        normalize: function (imagedata) {
          var array = [];
          for (var key in imagedata) {
            array.push(imagedata[key]);
          }
          var reduced = _.map(array, function (item) {
            return item / 255;
          });
          return reduced;
        },
        createObject: function (attr, val) {
          var a = {};
          a[attr] = val;
          return a;
        },
        listToMatrix: function (list, elementsPerSubArray) {
          var matrix = [], i, k;

          for (i = 0, k = -1; i < list.length; i++) {
            if (i % elementsPerSubArray === 0) {
              k++;
              matrix[k] = [];
            }

            matrix[k].push(list[i] / 255);
          }

          return matrix;
        }
      };

      $scope.nextNumber = function () {
        trainer.imagedata = nnViewService.getRegionData(region);
        trainer.pickSwatch($scope.pickNumber);
        $('#input-pick-control').select();
      };

      $scope.trainNetwork = function () {
        trainer.trainNetwork();
        $('#trainButton').prop('disabled', true);
      };

    });
}());
