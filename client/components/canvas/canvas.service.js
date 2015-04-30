'use strict';

angular.module('gridApp')
  .factory('canvasViewService', function () {

    var setPixel = function (imageData, x, y, r, g, b, a) {
      var index = (x + y * imageData.width) * 4;
      imageData.data[index] = r;
      imageData.data[index + 1] = g;
      imageData.data[index + 2] = b;
      imageData.data[index + 3] = a;
    };

    var pixelBatchUpdate = function (id, pixels) {
      var element = $(id)[0];
      var c = element.getContext('2d');
      var imageData = c.createImageData(1, 1);

      pixels.forEach(function (item) {
        setPixel(imageData, 0, 0, item.r, item.g, item.b, item.a);
        c.putImageData(imageData, item.x, item.y);
      });

    };

    var clearImage = function (id) {
      var canvas = $(id)[0];
      var c = canvas.getContext('2d');
      c.clearRect(0, 0, canvas.width, canvas.height);
    };

    var loadImage = function (id, url, cb) {
      cb = cb || angular.noop;
      var canvas = $(id)[0];
      var c = canvas.getContext('2d');

      c.clearRect(0, 0, canvas.width, canvas.height);
      c.fillText('Loading...', 20, 50);

      var drawing = new Image();
      drawing.src = url;
      drawing.onload = function () {
        c.drawImage(drawing, 0, 0);
        cb();
      };
    };

    var getRegion = function (id, region, size) {

      var w = $(id)[0].width;
      var row = Math.floor(region / 10)+1;
      var col = region % 10;
      //console.log(region + ' ' + col + ',' + row);
      var selectX = (col - 1) * size - 1; //1,0 2,29, 3,59
      selectX = selectX < 0 ? 0 : selectX;
      selectX = selectX - 1 >= w ? 0 : selectX;

      //12 - 2,2

      var selectY = 0;

      if (selectX - 1 >= w) {
        selectY = 29;
      }

      var element = $(id)[0];
      var c = element.getContext('2d');
      return c.getImageData(selectX, selectY, 30, 30);
    };

    var setImageData = function (id, imageData) {
      var element = $(id)[0];
      var c = element.getContext('2d');
      return c.putImageData(imageData, 0, 0);
    };

    // Public API here
    return {
      getRegion: function (id, region, size) {
        return getRegion(id, region, size);
      },
      pixelBatchUpdate: function (id, pixels) {
        pixelBatchUpdate(id, pixels);
      },
      drawProcessed: function (c, imageData, items) {
        items.forEach(function (item) {
          setPixel(imageData, 0, 0, 255, item.g, item.b, item.a);
          c.putImageData(imageData, item.x, item.y);
        });
      },
      loadImage: function (id, url, cb) {
        loadImage(id, url, cb);
      },
      clearImage: function (id) {
        clearImage(id);
      },
      setImageData: function (id, imageData) {
        setImageData(id, imageData);
      }
    };
  });
