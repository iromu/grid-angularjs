/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var pixel = require('./pixel.model.js');
var controller = require('./pixel.controller.js');

exports.register = function (socket) {

  pixel.schema.post('update', function (doc) {
    onUpdate(socket, doc);
  });
}

function onUpdate(socket, doc) {
  socket.emit('pixel:update', doc);
}

