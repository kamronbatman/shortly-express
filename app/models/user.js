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

  checkUser: function(req, res, next) {
    var username = req.body.username || (req.session && req.session.user);
    var password = req.body.password;

    User.fetchUser(username)
    .then(function(user){
      username = user.get('username'); //Prevents injection
      return util.comparePassword(password || '0', user.get('password_hash'))
    })
    .then(function(valid){
      if (valid || req.session.user === username){
        req.session.regenerate(function(){
          req.session.user = username;
          next();
        });
      } else {
        res.redirect('/login');
      }
    })
    .catch(function(error){
      console.log('Error!', error);
      res.redirect('/login');
    })
  }
});

module.exports = User;