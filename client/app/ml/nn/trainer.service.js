(function () {
  'use strict';

  angular.module('gridApp')
    .factory('trainerService', function () {
      var delegate;

      var utils = {
        normalize: function (imageData) {
          var reduced = [];
          var pos = 0;
          for (var y = 0; y < imageData.height; y++) {
            for (var x = 0; x < imageData.width; x++) {
              var red = imageData.data[pos];
              var green = imageData.data[pos + 1];
              var blue = imageData.data[pos + 2];
              var average = (red + green + blue) / 3;
              reduced.push(average / 255);
              pos += 4;
            }
          }

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

      var trainer = {
        data: [], numbers: [],

        putSample: function (number, imagedata) {
          var result = {
            input: utils.normalize(imagedata),
            output: utils.createObject(number, number)
          };
          this.data.push(result);
          this.numbers.push(number);
          delegate.loadNextNumber();
        },
        trainNetwork: function (cb) {
          var p = new Parallel(this.data, {evalPath: 'assets/scripts/eval.js'});
          p.require('brain-0.6.3.js');
          p.spawn(function (data) {
            var net = new brain.NeuralNetwork({
              hiddenLayers: [25],
              learningRate: 0.6
            });
            var info = net.train(data, {
              iterations: 400, //400
              log: true,
              logPeriod: 10
            });
            return {info: info, net: net.toJSON()};
          }).then(function (json) {
            cb(json);
          });
        }
      };

      // Public API here
      return {
        setDelegate: function (d) {
          delegate = d;
        },
        trainNetwork: function (cb) {
          if (trainer.data.length > 0) {
            trainer.trainNetwork(cb);
          }
        },
        normalize: function (imageData) {
          return utils.normalize(imageData);
        },
        addSampleImageData: function (number, imageData) {
          trainer.putSample(number, imageData);
        },
        samples: function () {
          return trainer.data.length;
        },
        getMaxLabel: function (solution) {
          var maxValue = 0;
          var maxLabel;
          var array = _(solution).toArray();

          for (var i = 0; i < array.size(); i++) {
            if (parseFloat(array.at(i)) > maxValue) {
              maxValue = array.at(i);
              maxLabel = i;
            }
          }
          return maxLabel;
        }
      };

    });
}());
