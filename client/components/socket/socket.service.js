/* global io */
'use strict';

angular.module('gridApp')
  .factory('socket', function (socketFactory) {

    // socket.io now auto-configures its connection when we ommit a connection url
    var ioSocket = io('', {
      // Send auth token on connection, you will need to DI the Auth service above
      // 'query': 'token=' + Auth.getToken()
      path: '/socket.io-client'
    });

    var socket = socketFactory({
      ioSocket: ioSocket
    });

    return {
      socket: socket,

      /**
       * Register listeners to sync an array with updates on a model
       *
       * Takes the array we want to sync, the model name that socket updates are sent from,
       * and an optional callback function after new items are updated.
       *
       * @param {String} modelName
       * @param {Array} array
       * @param {Function} cb
       */
      syncUpdates: function (modelName, array, cb) {
        cb = cb || angular.noop;

        /**
         * Syncs item creation/updates on 'model:save'
         */
        socket.on(modelName + ':save', function (item) {
          var oldItem = _.find(array, {_id: item._id});
          var index = array.indexOf(oldItem);
          var event = 'created';

          // replace oldItem if it exists
          // otherwise just add item to the collection
          if (oldItem) {
            array.splice(index, 1, item);
            event = 'updated';
          } else {
            array.push(item);
          }

          cb(event, item, array);
        });

        socket.on(modelName + ':update', function (item) {
          var oldItem = _.find(array, {_id: item._id});
          var index = array.indexOf(oldItem);
          var event = 'update';

          // replace oldItem if it exists
          // otherwise just add item to the collection
          if (oldItem) {
            array.splice(index, 1, item);
            event = 'updated';
          } else {
            array.push(item);
          }

          cb(event, item, array);
        });

        /**
         * Syncs removed items on 'model:remove'
         */
        socket.on(modelName + ':remove', function (item) {
          var event = 'deleted';
          _.remove(array, {_id: item._id});
          cb(event, item, array);
        });

      },

      /**
       * Removes listeners for a models updates on the socket
       *
       * @param modelName
       */
      unsyncUpdates: function (modelName) {
        socket.removeAllListeners(modelName + ':save');
        socket.removeAllListeners(modelName + ':update');
        socket.removeAllListeners(modelName + ':remove');
        socket.removeAllListeners('snapshot');
        socket.removeAllListeners('pixel:updateBatch');
      },
      info: function () {
        socket.emit('info');
      },
      onSnapshot: function (cb) {
        cb = cb || angular.noop;
        socket.on('snapshot', function () {
          cb();
        });
      },
      onPixelBatchUpdate: function (cb) {
        cb = cb || angular.noop;
        socket.on('pixel:batch:update', function (items) {
          cb(items);
        });
      },
      onPixelBufferResponse: function (cb) {
        cb = cb || angular.noop;
        socket.on('pixel:buffer:response', function (items) {
          cb(items);
        });
      },
      putPixels: function (pixels) {
        socket.emit('pixel:put', pixels);
      },
      requestPixelBuffer: function () {
        socket.emit('pixel:buffer:request');
      }
    };
  });
