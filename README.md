# grid angular.js

[![Build Status][travis-image]][travis-url]
[![Heroku][heroku-image]][heroku-url]

[travis-image]: https://travis-ci.org/iromu/grid-angularjs.svg?branch=develop
[travis-url]: https://travis-ci.org/iromu/grid-angularjs
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
