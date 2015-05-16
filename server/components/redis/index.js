(function () {
  'use strict';

  var config = require('../../config/environment');
  var redis = require('redis');
  var redisConf = require("redis-url").parse(config.redis.uri);

  console.log('redis connecting ' + redisConf.hostname + ':' + redisConf.port);
  var redisClient = redis.createClient(redisConf.port, redisConf.hostname); //creates a new client
  if (redisConf.password) {
    console.log('redis auth: ' + redisConf.password);
    redisClient.auth(redisConf.password, function (err) {
      if (err) throw err;
    });
  }

  redisClient.on('connect', function () {
    console.log('redis connected');
    redisClient.publish('instances', 'start');
    redisClient.set('framework', 'AngularJS');
    redisClient.on('message', function (channel, message) {
      if ((channel === 'instances') && (message === 'start'))
        console.log('New instance started!');
    });
    //redisClient.subscribe('instances');
  });

  module.exports = redisClient;

}());
