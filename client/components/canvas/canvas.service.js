'use strict';

angular.module('gridApp')
  .factory('canvasViewService', function () {

    var calcWindowSlice = function (region, width, height, size) {
      var maxRegionW = Math.floor(width / size);
      var maxRegionH = Math.floor(height / size);
      var maxRegion = maxRegionW * maxRegionH;

      var col = (region - 1) % maxRegionW + 1;
      var row = Math.floor((region - 1) / maxRegionH) + 1;

      var selectX = (col - 1) * size - 1;
      selectX = selectX < 0 ? 0 : selectX;
      selectX = selectX - 1 >= width ? 0 : selectX;

      var selectY = (row - 1) * size - 1;
      selectY = selectY < 0 ? 0 : selectY;

      if (selectX - 1 >= width) {
        selectY = 29;
      }

      var selection = {region: region, size: size, col: col, row: row, x: selectX, y: selectY};
      return selection;
    };

    var setPixel = function (imageData, x, y, r, g, b, a) {
      var index = (x + y * imageData.width) * 4;
      imageData.data[index] = r;
      imageData.data[index + 1] = g;
      imageData.data[index + 2] = b;
      imageData.data[index + 3] = a;
    };

    var pixelBatchUpdate = function (id, pixels) {
      var element = getCanvas(id);
      var c = element.getContext('2d');
      var imageData = c.createImageData(1, 1);

      pixels.forEach(function (item) {
        if (!item.a) {
          item.a = 255;
        }
        setPixel(imageData, 0, 0, item.r, item.g, item.b, item.a);
        c.putImageData(imageData, item.x, item.y);
      });

    };

    var clearImage = function (id) {
      var canvas = getCanvas(id);
      var c = canvas.getContext('2d');
      c.clearRect(0, 0, canvas.width, canvas.height);
    };

    var loadImage = function (id, url, cb) {
      cb = cb || angular.noop;
      var canvas = getCanvas(id);
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

    var getCanvas = function (id) {
      return $(id)[0];
    };

    var getRegion = function (id, region, size) {
      var element = getCanvas(id);

      var w = element.width;
      var h = element.height;

      var selection = calcWindowSlice(region, w, h, size);

      var c = element.getContext('2d');
      var imageData = c.getImageData(selection.x, selection.y, selection.size, selection.size);

      return {imageData: imageData, selection: selection};
    };

    var setImageData = function (id, imageData) {
      var element = getCanvas(id);
      var c = element.getContext('2d');
      return c.putImageData(imageData, 0, 0);
    };

    // Public API here
    return {
      getRegion: function (id, region, size) {
        return getRegion(id, region, size);
      },
      drawSelection: function (id, selection, style) {
        var element = getCanvas(id);
        var c = element.getContext('2d');
        c.clearRect(0, 0, element.width, element.height);
        c.beginPath();
        c.rect(selection.x, selection.y, selection.size, selection.size);
        c.strokeStyle = style || 'lime';
        c.stroke();
      },
      pixelBatchUpdate: function (id, pixels) {
        pixelBatchUpdate(id, pixels);
      },
      drawProcessed: function (c, imageData, items) {
        items.forEach(function (item) {
          if (!item.a) {
            item.a = 255;
          }
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
      },
      calcWindowSlice: function (region, width, height, size) {
        return calcWindowSlice(region, width, height, size);
      },
      getContext: function (id) {
        var element = getCanvas(id);
        return element.getContext('2d');
      }
    };
  });
