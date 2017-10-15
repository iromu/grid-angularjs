(function () {
  'use strict';

  var config = require('../../config/environment');
  var redis = require('redis');
  var redisConf = require('redis-url').parse(config.redis.uri);
  // var mongooseRedisCache = require('mongoose-redis-cache');
  // var console = require('../../logging').getconsole();
  require('redis-streams')(redis);

  var Promise = require('bluebird');

  Promise.promisifyAll(redis.RedisClient.prototype);
  Promise.promisifyAll(redis.Multi.prototype);

  module.exports.redisClient = undefined;
  module.exports.redisClientBufffers = undefined;

  var newClient = function (options) {
    console.log('[' + options.label + '] Redis connecting ' + redisConf.hostname + ':' + redisConf.port);

    var redisClient = redis.createClient(redisConf.port, redisConf.hostname, options); //creates a new client
    if (redisConf.password) {
      console.info('[' + options.label + '] redis auth: ' + redisConf.password);
      redisClient.auth(redisConf.password, function (err) {
        if (err) throw err;
      });
    }

    redisClient.on('connect', function () {
      console.info('[' + options.label + '] new redis client connected');
    });

    redisClient.on('error', function (err) {
      console.error('[' + options.label + '] redis error ' + err);
    });

    return redisClient;
  };

  module.exports.getRedisClient = function (options) {
    if (options.return_buffers) {
      if (this.redisClientBufffers !== undefined) {
        return this.redisClientBufffers;
      } else {
        this.redisClientBufffers = newClient(options);
        return this.redisClientBufffers;
      }
    } else {
      if (this.redisClient !== undefined) {
        return this.redisClient;
      } else {
        this.redisClient = newClient(options);
        return this.redisClient;
      }
    }
  };

  module.exports.createClient = function (options) {
    return newClient(options);
  };

}());
