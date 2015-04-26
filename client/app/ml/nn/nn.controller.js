'use strict';

angular.module('gridApp')
  .controller('MlNNCtrl', function ($scope, canvasViewService) {
    var region = 1;

    var net = new brain.NeuralNetwork();
    net.train([{input: {r: 0.03, g: 0.7, b: 0.5}, output: {one: 1}},
      {input: {r: 0.16, g: 0.09, b: 0.2}, output: {two: 1}},
      {input: {r: 0.5, g: 0.5, b: 1.0}, output: {two: 1}}]);

    $scope.output = net.run({r: 1, g: 0.4, b: 0});


    $scope.loadNumbers = function () {
      canvasViewService.loadImage('#numbersCanvas', 'assets/images/numbers-bw.png', function () {
        canvasViewService.clearImage('#numberCanvas');
        $scope.loadNumber();
      });
    };
    $scope.loadNumber = function () {
      var imageData = canvasViewService.getRegion('#numbersCanvas', region++, 30);
      canvasViewService.setImageData('#numberCanvas', imageData);
      setTimeout($scope.loadNumber, 100);
    };


    $scope.trainer = {
      pixels: [],
      data: [],

      pickSwatch: function (number) {
        var result = {
          input: utils.normalize(this.pixels),
          output: {number: number}
        };
        this.data.push(result);

        $scope.loadNumber();
      }
    };

    var utils = {
      normalize: function (color) {
        return {r: color.r / 255, g: color.g / 255, b: color.b / 255};
      }
    };

  });
