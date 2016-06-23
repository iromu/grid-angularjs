/* global process:true */

'use strict';

//add timestamps in front of log messages
require('console-stamp')(console, '[HH:MM:ss.l]');


var path = require('path'),
  cluster = require('cluster'),
  sticky = require('sticky-session'),
  config = require('./config/environment'),
  app = require('./app'),
  logging = require('./logging');

// if process.env.NODE_ENV has not been set, default to development
var NODE_ENV = process.env.NODE_ENV || 'development';

exports.run = run;


function spawnWorker(logger) {
  // create servers
  var server = app.createServer(logger);

  // start listening
  var port = config.port;
  if (!sticky.listen(server, port)) {
    logger.info('Worker Sticky server started on port' + port);
  }
}

function createCluster(logger) {


  // Set up cluster and start servers
  if (cluster.isMaster) {
    var numCpus = require('os').cpus().length;

    logger.info('Starting master, pid ' + process.pid + ', spawning ' + numCpus + ' workers');

    // start listening
    var port = config.port;

    var server = app.createServer(logger);
    if (!sticky.listen(server, port)) {
      logger.info('Master Sticky server started on port' + port);
    }


    // fork workers
    for (var i = 0; i < numCpus; i++) {
      cluster.fork();
    }

    cluster.on('listening', function (worker) {
      logger.info('Worker ' + worker.id + ' started');
    });

    // if a worker dies, respawn
    cluster.on('death', function (worker) {
      logger.warn('Worker ' + worker.id + ' died, restarting...');
      cluster.fork();
    });

  }
  // Worker processes
  else {
    spawnWorker(logger);
  }
}

function run(cluster) {
  // Set up logging
  var logger = logging.createLogger({
    // log directory
    dir: "CONSOLE",
    // for valid log levels, see
    // [bunyan docs](https://github.com/trentm/node-bunyan#levels)
    level: "debug"
  });

  // In production environment, create a cluster
  if (NODE_ENV === 'production' || Boolean(config.cluster) || cluster) {
    createCluster(logger);
  }
  else {
    spawnWorker(logger);
  }

}
