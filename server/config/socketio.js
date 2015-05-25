/**
 * Socket.io configuration
 */

'use strict';

var config = require('./environment');
var os = require("os");
var _ = require('lodash');

var redisAdapter = require('socket.io-redis');
var redisClient = require('../components/redis').createClient;
var connectedUsers = [];

// When the user disconnects.. perform this
function onDisconnect(socket, io) {

  console.info('[%s@%s#%s] Socket disconnected', socket.id, os.hostname(), config.uid);
  socket.broadcast.emit('server:message', 'Socket disconnected ' + socket.id + ' to ' + os.hostname() + '#' + config.uid);
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

  console.info('[%s@%s#%s] Socket connected', socket.id, os.hostname(), config.uid);
  connectedUsers.push(socket);
  socket.emit('server:message', 'Welcome ' + socket.id + ' to ' + os.hostname() + '#' + config.uid);
  socket.broadcast.emit('socket:connect', socket.id);
  socket.broadcast.emit('server:message', 'Socket connected ' + socket.id + ' to ' + os.hostname() + '#' + config.uid);
  //socket.broadcast.emit('socket:info', getConnectedUserIds());
  // When the client emits 'info', this listens and executes
  socket.on('socket:info', function (data) {
    console.info('[%s] INFO REQ %s', socket.id, JSON.stringify(data, null, 2));
    console.info('[%s] INFO RES %s', socket.id, JSON.stringify(getConnectedUserIds(), null, 2));
    socket.emit('socket:info', getConnectedUserIds());
  });
  //connectedUsers[USER_NAME_HERE] = socket;
  // Insert sockets below
  require('../api/nn/nn.socket').register(socket);
  require('../api/pixel/pixel.socket').register(socket, socketio);
}

function joinRoom(socket, roomName) {
  socket.join(roomName);
  socket.broadcast.to(roomName).emit('server:message', 'a client enters');
  socket.emit('server:message', 'You entered in room ' + roomName);
  socket.emit('room:joined', roomName);

  console.info('[%s@%s#%s] joined room %s', socket.id, os.hostname(), config.uid, JSON.stringify(roomName, null, 2));
}

function leaveRoom(socket, roomName) {
  socket.leave(roomName);
  socket.broadcast.to(roomName).emit('server:message', 'a user leaves');
  socket.emit('server:message', 'You leave room ' + roomName);

  console.info('[%s@%s#%s] leaveRoom %s', socket.id, os.hostname(), config.uid, JSON.stringify(roomName, null, 2));
}

module.exports = function (socketio) {
  socketio.adapter(redisAdapter({pubClient: redisClient(), subClient: redisClient({detect_buffers: true})}));
  socketio.on('connection', function (socket) {
    socket.address = socket.handshake.address !== null ?
    socket.handshake.address.address + ':' + socket.handshake.address.port :
      process.env.DOMAIN;

    socket.connectedAt = new Date();

    socket.on('room:join', function (roomName) {
      joinRoom(socket, roomName);
    });
    socket.on('room:leave', function (roomName) {
      leaveRoom(socket, roomName);
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
