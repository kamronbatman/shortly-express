var db = require('../config');
var Promise = require('bluebird');
var Link = require('./link');
var util = require('../../lib/utility');

var User = db.Model.extend({
  tableName: 'users',
  hasTimestamps: true,
  link: function() {
    return this.hasMany(Link);
  }
}, {
  fetchUser: function(username){
    return new this({ username: username}).fetch({ require: true });
  },

  fetchUserByGitHub: function(githubid){
    return new this({githubid: githubid}).fetch({ require: true });
  },

  serializeUser: function(user, done) {
    done(null, user.get('username'));
  },

  deserializeUser: function(username, done) {
    User.fetchUser(username)
    .then(function(user) {
      done(null, user ? user : false);
    })
    .catch(function(error){
      done(error);
    });
  },

  localAuthentication: function(username, password, done) {
    var foundUser;

    User.fetchUser(username)
    .then(function (user) {
      if (!user) { return done(null, false); }
      foundUser = user;
      return util.comparePassword(password || '0', user.get('password_hash'));
    })
    .then(function(valid){
      done(null, valid ? foundUser : false);
    })
    .catch(function(error){
      done(error);
    });
  },

  githubAuthentication: function(req, accessToken, refreshToken, profile, done) {
    console.log('accessToken', accessToken);
    console.log('profile', profile);

    User.fetchUserByGitHub(profile.id)
    .then(function(user){
      if (!req.user || req.user.username === user.username) {
        return done(null, user);
      } else { return done(null, false); }
    })
    .catch(function(error){
      if (req.user) {
        req.user.set('githubid', profile.id).save();
        return done(null, req.user);
      }
      return done(null, false);
    });
  }
});

module.exports = User;