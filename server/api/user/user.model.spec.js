'use strict';

var should = require('should');
var app = require('../../app');
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
    user.save(function (err, doc, num) {
      should.exist(doc);
      should.equal(doc.email, user.email);
      should.equal(num, 1);
      var userDup = new User(user);
      should.equal(userDup.email, user.email);
      userDup.save(function (err, doc, num) {
        should.equal(num, 1);
        should.exist(doc);
        done();
      });
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
