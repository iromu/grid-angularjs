'use strict';

var should = require('should');
var mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
var User = require('./user.model');

var user = new User({
  provider: 'local',
  name: 'Fake User',
  email: 'test@test.com',
  password: 'password'
});

describe('User Model', function () {
  before(function (done) {
    // Clear users before testing
    User.remove().exec().then(function () {
      done();
    });
  });

  afterEach(function (done) {
    User.remove().exec().then(function () {
      done();
    });
  });

  it('should begin with no users', function (done) {
    User.find({}, function (err, users) {
      users.should.have.length(0);
      done();
    });
  });

  it('should fail when saving a duplicate user', function (done) {
    user.save().then(function (doc) {

      should.exist(doc);
      should.equal(doc.email, user.email);

      var userDup = new User(user);
      should.equal(userDup.email, user.email);

      userDup.save().then(function (doc) {
        should.not.exist(doc);
        done();

      }).catch(function (err) {
        should.exist(err);
        done();
      });

    }).catch(function (err) {
      should.not.exist(err);
      done();
    });
  });

  it('should fail when saving without an email', function (done) {
    user.email = '';
    user.save().catch(function (err) {
      should.exist(err);
      done();
    });
  });

  it("should authenticate user if password is valid", function () {
    return user.authenticate('password').should.be.true;
  });

  it("should not authenticate user if password is invalid", function () {
    return user.authenticate('blah').should.not.be.true;
  });
});
