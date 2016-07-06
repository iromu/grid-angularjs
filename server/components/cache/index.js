(function () {
  'use strict';

  var logger;
  var cacheClient;
  var cacheClientBuilder = function (param) {
    var client = param.client;
    var prefix = param.prefix;

    return {
      get: function (key) {
        return client.getAsync(prefix + key);
      },
      set: function (key, data, ttl) {
        if (ttl && ttl > 0) {
          return client.setexAsync(prefix + key, ttl, data);
        } else {
          return client.setAsync(prefix + key, data);
        }
      },
      addAllSet: function (key, array, locking) {
        var multi = client.multi();
        for (var i = 0; i < array.length; i++) {
          if (locking) {
            multi.sadd(prefix + key + ':data', array[i]);
            multi.sadd(prefix + key + ':lock', array[i]);
          }
          else {
            multi.sadd(prefix + key, array[i]);
          }
        }
        return multi.execAsync();
      },
      members: function (key, locking) {
        if (locking) {
          return client.smembersAsync(prefix + key + ':data');
        }
        else {
          return client.smembersAsync(prefix + key);
        }
      },
      addSet: function (key, member) {
        return client.saddAsync(prefix + key, member);
      },
      pop: function (key) {
        return client.spopAsync(prefix + key);
      },
      hset: function (key, data) {
        return client.hset(prefix + key, data);
      },
      purge: function () {
        return new Promise(function (resolve, reject) {
          logger.debug('Purge all keys ' + prefix + '*');
          client.keys(prefix + '*', function (err, keys) {
            if (keys && keys.length < 1) return reject();

            client.del(keys, function (err, count) {
              count = count || 0;
              resolve(count);
            });
          });
        });
      }
    }
  };
  var getCacheClient = function () {
    if (cacheClient === undefined) {
      cacheClient = cacheClientBuilder({
        client: getRedisClient(),
        prefix: config.get('redis.prefix')
      });
    }
    return cacheClient;
  };


  function Cache(logger_) {

    logger = logger_;

    return {
      persistSet: function (key, value) {
        if (value instanceof Array) {
          return getCacheClient().addAllSet(key, value, true);
        } else {
          return getCacheClient().set(key, value);
        }
      },
      retrieveSet: function (key) {
        return getCacheClient().members(key, true);
      },
      getCacheClient: function () {
        return getCacheClient();
      },
      acquireLock: function (key) {
        return getCacheClient().pop(key + ':lock');
      },
      freeLock: function (key, member) {
        return getCacheClient().addSet(key + ':lock', member);
      },
      setLogger: function setLogger(logger_) {
        logger = logger_;
      }
    };
  }

  module.exports = Cache;

}());
