(function () {
  'use strict';

  angular.module('gridApp')
    .factory('pixelWorkerService', function ($q, pixelSocketService, $log, $timeout) {
      var workers = {};


      function loadPixelBuffer(room) {
        pixelSocketService.requestPixelBuffer(room);
      }

      function compressGrey(pixels) {
        return pixels.map(function (pixel) {
          return {_id: pixel._id, x: pixel.x, y: pixel.y, s: pixel.s};
        });
      }

      return {
        startWork: function (postData) {
          var room = postData.room;
          workers[room] = {
            loop: postData.loop,
            defer: $q.defer(),
            room: room
          }
          ;

          workers[room].defer = $q.defer();
          var defer = workers[room].defer;

          this.addListeners(room);
          pixelSocketService.joinNetwork(room);

          function workerFunction() {
            var self = this;
            self.onmessage = function (event) {

              var pixels = event.data.pixels;
              room = event.data.room;


              if (Array.isArray(pixels) && pixels.length > 0) {

                if (room === 'reduce') {
                  var color = pixels.reduce(function (previousValue, currentValue) {
                    return {
                      r: previousValue.r + currentValue.r,
                      g: previousValue.g + currentValue.g,
                      b: previousValue.b + currentValue.b
                    };
                  });

                  color.r = Math.round(color.r / pixels.length);
                  color.g = Math.round(color.g / pixels.length);
                  color.b = Math.round(color.b / pixels.length);

                  self.postMessage(pixels.map(function (pixel) {
                    return {_id: pixel._id, x: pixel.x, y: pixel.y, r: color.r, g: color.g, b: color.b, s: null};
                  }));
                } else {
                  self.postMessage(pixels.map(function (pixel) {
                    if (room === 'grey') {
                      pixel.s = Math.round((pixel.r + pixel.g + pixel.b) / 3);
                      pixel.r = pixel.s;
                      pixel.g = pixel.s;
                      pixel.b = pixel.s;
                    } else if (room === 'invert') {
                      pixel.s = null;
                      pixel.r = 255 - pixel.r;
                      pixel.g = 255 - pixel.g;
                      pixel.b = 255 - pixel.b;
                    }
                    return pixel;
                  }));
                }
              }
            };
          }

          // end worker function

          var dataObj = '(' + workerFunction + ')();'; // here is the trick to convert the above fucntion to string
          var blob = new Blob([dataObj.replace('"use strict";', '')]); // firefox adds user strict to any function which was blocking might block worker execution so knock it off

          var blobURL = (window.URL ? URL : webkitURL).createObjectURL(blob, {
            type: 'application/javascript; charset=utf-8'
          });


          workers[room].worker = new Worker(blobURL);
          var worker = workers[room].worker;

          worker.onmessage = function (e) {
            var pixels = e.data;
            defer.notify({room: room, pixels: pixels});

            if (room === 'grey') {
              pixelSocketService.putPixels({room: room, pixels: compressGrey(pixels)});
            } else {
              pixelSocketService.putPixels({room: room, pixels: pixels});
            }

            //loadPixelBuffer(room);

          };


          return defer.promise;
        },
        stopWork: function (room) {
          if (workers[room]) {
            $log.warn('stopWork() ' + room);
            pixelSocketService.leaveNetwork(room);
            var worker = workers[room].worker;
            if (worker) {
              worker.terminate();
            }
            var defer = workers[room].defer;
            defer.reject();
          }
        },
        addListeners: function (room) {
          var worker = workers[room].worker;
          var defer = workers[room].defer;
          workers[room].listening = true;

          pixelSocketService.onPixelBufferReload(room, function (data) {
            if (room) {
              if (workers[room].loop) {
                defer.notify({room: room, image: data.image, done: true});
                $timeout(function () {
                  loadPixelBuffer(room);
                }, 1000);
              } else {
                defer.resolve({room: room, image: data.image, done: true});
              }
            }
          });

          pixelSocketService.onPixelBatchUpdate(room, function (data) {
            var pixels = data.pixels;
            if (Array.isArray(pixels) && pixels.length > 0) {
              defer.notify({room: room, pixels: pixels});
            } else {
              $log.warn('onPixelBatchUpdate() empty array received.');
            }
          });

          pixelSocketService.onPixelBufferResponse(room, function (data) {
            var worker = workers[room].worker;
            var pixels = data.pixels;
            if (Array.isArray(pixels) && pixels.length > 0) {

              worker.postMessage(data); // Send data to our worker.

            } else {
              $log.warn('onPixelBufferResponse() empty array received for processing.');
              $timeout(loadPixelBuffer, 100);
            }
          });

          pixelSocketService.onPutPixelsEnd(room, function (data) {
            loadPixelBuffer(room);
          });

          pixelSocketService.onJoinNetwork(room, function (room) {

            loadPixelBuffer(room);
          });


        }
      };
    });
}());
