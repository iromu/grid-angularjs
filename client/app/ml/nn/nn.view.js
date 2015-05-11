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


          $('#drawCanvas').sketch({
            defaultSize: 20,
            defaultColor: '#FF0000'
          });

          //$('#drawCanvas').drawTouch();
          //$('#drawCanvas').drawPointer();
          //$('#drawCanvas').drawMouse();
        },
        loadRegionForTraining: function (index) {
          var region = canvasViewService.getRegion('#numbersCanvas', index, 20);
          canvasViewService.setImageData('#trainingCanvas', region.imageData);
          canvasViewService.drawSelection('#numbersCanvasOverlay', region.selection);
          return region.imageData;
        },
        loadRegionForPrediction: function (index, draw) {
          var region = canvasViewService.getRegion('#numbersCanvas', index, 20);
          canvasViewService.setImageData('#predictionCanvas', region.imageData);
          if (draw) {
            canvasViewService.drawSelection('#numbersCanvasOverlay', region.selection, 'cyan');
          }
          return region.imageData;
        },
        loadDrawForPrediction: function () {
          canvasViewService.clearImage('#drawCanvasInput');

          var id = '#drawCanvas';
          var canvas = $(id)[0];
          var url = canvas.toDataURL();
          var newImg = document.createElement('img');
          newImg.src = url;

          var scale = $('#drawCanvasInput')[0];
          var ctx = scale.getContext('2d');

          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, 20, 20);
          // Draw image to canvas
          ctx.drawImage(newImg, 0, 0, 20, 20);
          return ctx.getImageData(0, 0, 20, 20);
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
        },
        onClearDraw: function () {
          canvasViewService.clearImage('#drawCanvas');
          canvasViewService.clearImage('#drawCanvasInput');
        }
      };

    });
}());
