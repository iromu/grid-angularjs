(function () {
  'use strict';

  var config = require('../../config/environment');
  var redis = require('redis');
  var redisConf = require("redis-url").parse(config.redis.uri);
  var mongooseRedisCache = require("mongoose-redis-cache");
  var logger = require('../../logging').getLogger();


  module.exports.redisClient = undefined;
  module.exports.redisClientBufffers = undefined;

  var newClient = function (options) {
    logger.info('[' + options.label + '] Redis connecting ' + redisConf.hostname + ':' + redisConf.port);

    var redisClient = redis.createClient(redisConf.port, redisConf.hostname, options); //creates a new client
    if (redisConf.password) {
      logger.info('[' + options.label + '] redis auth: ' + redisConf.password);
      redisClient.auth(redisConf.password, function (err) {
        if (err) throw err;
      });
    }

    redisClient.on('connect', function () {
      logger.info('[' + options.label + '] new redis client connected');
    });

    redisClient.on('error', function (err) {
      logger.error('[' + options.label + '] redis error ' + err);
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

  module.exports.setLogger = function (l) {
    logger = l;
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

}());
