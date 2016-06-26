'use strict'

var Lock = {
  get: function (lock) {
    var lockKey = 'lock:' + lock;
    var globalSymbols = Object.getOwnPropertySymbols(global);
    var hasLock = (globalSymbols.indexOf(lockKey) > -1);
    if (!hasLock) {
      global[lockKey] = {updating: false, reloading: false};
    }
    return global[lockKey];
  }
};

module.exports = Lock;
