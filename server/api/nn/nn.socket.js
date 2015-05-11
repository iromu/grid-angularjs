/**
 * Broadcast updates to client when the model changes
 */

'use strict';

var Nn = require('./nn.model');

exports.register = function (socket) {
  Nn.schema.post('save', function (doc) {
    onSave(socket, doc);
  });
  Nn.schema.post('remove', function (doc) {
    onRemove(socket, doc);
  });
}

function onSave(socket, doc, cb) {
  socket.emit('nn:save', doc);
}

function onRemove(socket, doc, cb) {
  socket.emit('nn:remove', doc);
}
