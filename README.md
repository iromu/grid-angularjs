# grid angular.js

[![Build Status][travis-image]][travis-url]
[![Coverage Status][coveralls-image]][coveralls-url]
[![Dependency Status][dep-image]][dep-url]
[![Dev Dependency Status][dev-dep-image]][dev-dep-url]
[![Heroku][heroku-image]][heroku-url]

[travis-image]: https://travis-ci.org/iromu/grid-angularjs.svg?branch=develop
[travis-url]: https://travis-ci.org/iromu/grid-angularjs

[coveralls-image]: https://coveralls.io/repos/iromu/grid-angularjs/badge.svg?branch=develop
[coveralls-url]: https://coveralls.io/r/iromu/grid-angularjs?branch=develop

[dep-image]: https://david-dm.org/iromu/grid-angularjs.svg
[dep-url]: https://david-dm.org/iromu/grid-angularjs#info=dependencies&view=table

[dev-dep-image]: https://david-dm.org/iromu/grid-angularjs/dev-status.svg
[dev-dep-url]: https://david-dm.org/iromu/grid-angularjs#info=devDependencies&view=table

[heroku-image]: https://heroku-badge.herokuapp.com/?app=grid-angularjs
[heroku-url]: https://grid-angularjs.herokuapp.com


## Running

### Prepare enviroment
  
#### OSX
  
  Install XQuartz, then...

    $ brew install cairo
    
   Set env
   
    $ export PKG_CONFIG_PATH=/opt/X11/lib/pkgconfig
    
#### Linux

    $ sudo apt-get install libcairo2-dev libjpeg8-dev libpango1.0-dev libgif-dev build-essential g++

  
  
### Install
  
      $ npm install -g bower grunt-cli
    
      $ npm install
    
      $ bower install
  
### Run embedded server

You need a running local mongodb instance. (For OSX, 'brew install mongodb')

    $ grunt serve
  
### Open location in browser

    http://localhost:9000
