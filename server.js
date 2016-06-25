'use strict';


// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

exports.run = run;

function run(cluster) {
  require('./server/app').run(cluster);
}

run();
