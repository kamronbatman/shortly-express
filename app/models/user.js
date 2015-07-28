var db = require('../config');
var Promise = require('bluebird');
var Link = require('./link');
var Session = require('./sessions');
var util = require('../../lib/utility');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  link: function() {
    return this.hasMany(Link);
  }
}, {
  //Only checks, username/password
  //Returns a promise
  isLoggedIn: Promise.method(function(username, password) {
    return new this({ username: username }).fetch({ require: true })
    .tap(function(user) {
      return util.comparePassword(password, user.get('password_hash'));
    });
  })
});

module.exports = User;