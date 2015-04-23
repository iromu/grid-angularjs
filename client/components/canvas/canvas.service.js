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

    // Public API here
    return {
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
      }
    };
  });
