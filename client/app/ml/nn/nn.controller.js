'use strict';

angular.module('gridApp')
  .controller('MlNNCtrl', function ($scope, canvasViewService) {

    $scope.pickNumber = 0;

    var region = 1;

    var net = new brain.NeuralNetwork();
    var runNetwork;

    $scope.loadNumbers = function () {
      canvasViewService.loadImage('#numbersCanvas', 'assets/images/numbers-bw.png', function () {
        canvasViewService.clearImage('#numberCanvas');
        $scope.loadNumber();
        setTimeout($scope.randomSolve, 500);
      });
    };
    $scope.loadNumber = function () {
      region = region < 100 ? region : 1;
      var imageData = canvasViewService.getRegion('#numbersCanvas', region++, 30);
      canvasViewService.setImageData('#numberCanvas', imageData);
      // setTimeout($scope.loadNumber, 500);
    };
    $scope.randomSolve = function () {
      if (runNetwork) {
        var selection = Math.floor(Math.random() * 100 + 1);
        var data = canvasViewService.getRegion('#numbersCanvas', selection, 30).data;
        var normalized = utils.normalize(data);
        var solution = runNetwork(normalized);
        var solutionJson = JSON.stringify(solution, null, 2);
        $scope.output += '\n region ' + selection + ' output:' + solutionJson;
      }
      setTimeout($scope.randomSolve, 500);
    };


    var trainer = {
      imagedata: [],
      data: [], numbers: [],

      pickSwatch: function (number) {
        var result = {
          input: utils.normalize(this.imagedata),
          output: {number: number}
        };
        this.data.push(result);
        this.numbers.push(number);

        $scope.loadNumber();
      },
      trainNetwork: function () {
        var p = new Parallel(this.data, {evalPath: 'assets/scripts/eval.js'});
        p.require('brain-0.6.3.js');
        p.spawn(function (data) {
          var net = new brain.NeuralNetwork();
          net.train(data, {
            iterations: 9000,
            log: true,
            logPeriod: 10
          });
          return net.toJSON();
        }).then(function (json) {
          $('#trainButton').prop('disabled', false);
          net = new brain.NeuralNetwork().fromJSON(json);
          runNetwork = net.toFunction();
          runNetwork.name = 'runNetwork';
        });
      }
    };

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
      trainer.imagedata = canvasViewService.getRegion('#numbersCanvas', region - 1, 30).data;
      trainer.pickSwatch($scope.pickNumber);
      $('#input-pick-control').select();
    };

    $scope.trainNetwork = function () {
      trainer.trainNetwork();
      $('#trainButton').prop('disabled', true);
    };

  });
