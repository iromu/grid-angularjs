/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');

var _ = require('lodash');


var connectedUsers = [];

// When the user disconnects.. perform this
function onDisconnect(socket, io) {

  socket.broadcast.emit('socket:disconnect', socket.id);
  //socket.broadcast.emit('socket:info', getConnectedUserIds());
  _.remove(connectedUsers, function (current) {
    return socket.id === current.id;
  });
}

// When the user connects.. perform this
var getConnectedUserIds = function () {
  var ids = connectedUsers.map(function (connectedUser) {
    return connectedUser.id;
  });
  return ids;
};
function onConnect(socket, socketio) {
  connectedUsers.push(socket);

  socket.broadcast.emit('socket:connect', socket.id);
  //socket.broadcast.emit('socket:info', getConnectedUserIds());
  // When the client emits 'info', this listens and executes
  socket.on('socket:info', function (data) {
    console.info('[%s] INFO %s', socket.id, JSON.stringify(data, null, 2));
    socket.emit('socket:info', getConnectedUserIds());
  });
  //connectedUsers[USER_NAME_HERE] = socket;
  // Insert sockets below
  require('../api/nn/nn.socket').register(socket);
  require('../api/pixel/pixel.socket').register(socket, socketio);
}

function joinRoom(socket, roomName, fn) {
  socket.join(roomName);
  socket.broadcast.to(roomName).emit('serverMessage', 'a user enters');
  socket.emit('message', 'You enter in room ' + roomName);
  console.info('[%s] joinRoom %s', socket.id, JSON.stringify(roomName, null, 2));

}

function leaveRoom(socket, roomName, fn) {
  socket.leave(roomName);
  socket.broadcast.to(roomName).emit('serverMessage', 'a user leaves');
  socket.emit('message', 'You leave room ' + roomName);

  console.info('[%s] leaveRoom %s', socket.id, JSON.stringify(roomName, null, 2));
}

module.exports = function (socketio) {
  // socket.io (v1.x.x) is powered by debug.
  // In order to see all the debug output, set DEBUG (in server/config/local.env.js) to including the desired scope.
  //
  // ex: DEBUG: "http*,socket.io:socket"

  // We can authenticate socket.io users and access their token through socket.handshake.decoded_token
  //
  // 1. You will need to send the token in `client/components/socket/socket.service.js`
  //
  // 2. Require authentication here:
  // socketio.use(require('socketio-jwt').authorize({
  //   secret: config.secrets.session,
  //   handshake: true
  // }));

  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
    socket.handshake.address.address + ':' + socket.handshake.address.port :
      process.env.DOMAIN;

    socket.connectedAt = new Date();

    socket.on('joinNetwork', function (roomName, fn) {
      joinRoom(socket, roomName, fn);
    });
    socket.on('joinRoom', function (roomName, fn) {
      joinRoom(socket, roomName, fn);
    });
    socket.on('leaveNetwork', function (roomName, fn) {
      leaveRoom(socket, roomName, fn);
    });
    socket.on('leaveRoom', function (roomName, fn) {
      leaveRoom(socket, roomName, fn);
    });

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket, socketio);
      console.info('[%s] DISCONNECTED', socket.id);
    });

    console.info('[%s] CONNECTED', socket.id);
    // Call onConnect.
    onConnect(socket, socketio);
  });
};
