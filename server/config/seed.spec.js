'use strict';

var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');

var should = require('should');
var seed = require('./seed');
var User = require('../api/user/user.model');
var Pixel = require('../api/pixel/pixel.model');

describe('After seeding', function () {
  this.timeout(5000);

  before(function (done) {
    seed.init().then(function () {
      done();
    });
  });


  it('should have 2 users', function (done) {
    var query = User.find({});
    query.exec().constructor.should.equal(require('bluebird'));
    query.then(function (users) {
      users.should.have.length(2);
      done();
    })
  });


  it('should have full pixel population', function (done) {
    Pixel.find({
      room: 'raw',
      image: 'lena.png'
    }, function (err, pixels) {
      pixels.should.have.length(10000);
      done();
    });
  });

});
