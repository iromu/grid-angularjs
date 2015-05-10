(function () {
  'use strict';

  angular.module('gridApp')
    .factory('nnView', function (canvasViewService) {

      // Public API here
      return {
        initView: function (cb) {
          canvasViewService.loadImage('#numbersCanvas', 'assets/images/numbers-bw.png', function () {
            canvasViewService.clearImage('#trainingCanvas');
            cb();
          });
        },
        loadRegionForTraining: function (index) {
          var region = canvasViewService.getRegion('#numbersCanvas', index, 20);
          canvasViewService.setImageData('#trainingCanvas', region.imageData);
          canvasViewService.drawSelection('#numbersCanvasOverlay', region.selection);
          return region.imageData;
        },
        loadRegionForPrediction: function (index) {
          var region = canvasViewService.getRegion('#numbersCanvas', index, 20);
          canvasViewService.setImageData('#predictionCanvas', region.imageData);
          canvasViewService.drawSelection('#numbersCanvasOverlay', region.selection, 'cyan');
          return region.imageData;
        },
        getRegionData: function (region) {
          return canvasViewService.getRegion('#numbersCanvas', region, 20).imageData.data;
        },
        onNextNumber: function () {
          $('#input-pick-control').focus();
          $('#input-pick-control').select();
        },
        onTrainNetwork: function () {
          $('#trainButton').prop('disabled', true);
          $('#autoTrainButton').prop('disabled', true);
        },
        onConfigureNetwork: function () {
          $('#trainButton').prop('disabled', false);
          $('#autoTrainButton').prop('disabled', false);
        }
      };

    });
}());
