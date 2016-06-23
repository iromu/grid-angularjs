/* global process:true, __dirname:true */

'use strict';

var fs = require('fs'),
  path = require('path'),
  bunyan = require('bunyan');


exports.createLogger = createLogger;


/*
 * configure and start logging
 * @param {Object} settings The configuration object for defining dir: log
 * directory, level: loglevel
 * @return the created logger instance
 */
function createLogger(settings) {

  var pkg = require(path.join(__dirname, '../package')),
    appName = pkg.name,
    appVersion = pkg.version,
    logDir = settings.dir || path.join(__dirname, 'logs'),
    logFile = path.join(logDir, appName + '-log.json'),
    logErrorFile = path.join(logDir, appName + '-errors.json'),
    logLevel = settings.level || 'debug';

  var log;
  if (logDir !== 'CONSOLE') {

    // Create log directory if it doesnt exist
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

    // Log to console and log file
    log = bunyan.createLogger({
      name: appName,
      streams: [
        {
          stream: process.stdout,
          level: 'debug'
        },
        {
          path: logFile,
          level: logLevel,
          type: 'rotating-file',
          period: '1d'
        },
        {
          path: logErrorFile,
          level: 'error'
        }
      ],
      serializers: bunyan.stdSerializers
    });
  } else {
    var PrettyStream = require('bunyan-prettystream');
    var bunyanToConsole = new PrettyStream();
    bunyanToConsole.pipe(process.stdout);
    log = bunyan.createLogger({
      name: appName,
      streams: [{
        level: 'debug',
        type: 'raw',
        stream: bunyanToConsole
      }]
    });
  }

  log.info('Starting ' + appName + ', version ' + appVersion);
  log.info('Environment set to ' + process.env.NODE_ENV);
  log.debug('Logging setup completed.');

  return log;
}
