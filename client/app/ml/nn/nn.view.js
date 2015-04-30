(function () {
  'use strict';

  angular.module('gridApp')
    .factory('nnViewService', function (canvasViewService) {

      // Public API here
      return {
        initView: function (cb) {
          canvasViewService.loadImage('#numbersCanvas', 'assets/images/numbers-bw.png', function () {
            canvasViewService.clearImage('#numberCanvas');
            cb();
          });
        },
        loadRegion: function (region) {
          var imageData = canvasViewService.getRegion('#numbersCanvas', region, 30);
          canvasViewService.setImageData('#numberCanvas', imageData);
        },
        getRegionData: function (region) {
        return  canvasViewService.getRegion('#numbersCanvas', region, 30).data;
        }
      };

    });
}());
