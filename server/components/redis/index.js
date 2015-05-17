(function () {
  'use strict';

  var config = require('../../config/environment');
  var redis = require('redis');
  var redisConf = require("redis-url").parse(config.redis.uri);

  var mongooseRedisCache = require("mongoose-redis-cache");

  console.log('redis connecting ' + redisConf.hostname + ':' + redisConf.port);

  module.exports.redisClient = undefined;
  module.exports.getRedisClient = function () {
    if (this.redisClient !== undefined) {
      return this.redisClient;
    }
    this.redisClient = newClient();
    return this.redisClient;
  };

  module.exports.createClient = function (options) {
    return newClient(options);
  };

  module.exports.mongooseRedisCache = function (mongoose) {
    if (redisConf.password) {
      mongooseRedisCache(mongoose, {
        host: redisConf.hostname,
        port: redisConf.port,
        pass: redisConf.password
      });
    } else {
      mongooseRedisCache(mongoose, {
        host: redisConf.hostname,
        port: redisConf.port
      });
    }
  };

  var newClient = function (options) {
    var redisClient = redis.createClient(redisConf.port, redisConf.hostname, options); //creates a new client
    if (redisConf.password) {
      console.log('redis auth: ' + redisConf.password);
      redisClient.auth(redisConf.password, function (err) {
        if (err) throw err;
      });
    }

    redisClient.on('connect', function () {
      console.log('redis connected');
    });

    redisClient.on('error', function () {
      console.log('redis error');
    });

    return redisClient;
  };
}());
