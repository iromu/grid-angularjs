/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');

var _ = require('lodash');


var connectedUsers = [];

// When the user disconnects.. perform this
function onDisconnect(socket) {
  _.remove(connectedUsers, function (current) {
    return socket.id === current.id;
  });
}

// When the user connects.. perform this
function onConnect(socket, socketio) {
  connectedUsers.push(socket);
  // When the client emits 'info', this listens and executes
  socket.on('info', function (data) {
    console.info('[%s] INFO %s', socket.address, JSON.stringify(data, null, 2));
  });
  //connectedUsers[USER_NAME_HERE] = socket;
  // Insert sockets below
  require('../api/pixel/pixel.socket').register(socket, socketio);
}

function joinRoom(socket, roomName, fn) {
  socket.join(roomName);
  socket.broadcast.to(roomName).emit('serverMessage', 'a user enters');
  socket.emit('message', 'You enter in room ' + roomName);
}

function leaveRoom(socket, roomName, fn) {
  socket.leave(roomName);
  socket.broadcast.to(roomName).emit('serverMessage', 'a user leaves');
  socket.emit('message', 'You leave room ' + roomName);
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

    socket.on('joinRoom', function (roomName, fn) {
      joinRoom(socket, roomName, fn);
    });
    socket.on('leaveRoom', function (roomName, fn) {
      leaveRoom(socket, roomName, fn);
    });

    // Call onDisconnect.
    socket.on('disconnect', function () {
      onDisconnect(socket);
      console.info('[%s] DISCONNECTED', socket.id);
    });

    console.info('[%s] CONNECTED', socket.id);
    // Call onConnect.
    onConnect(socket, socketio);
  });
};
