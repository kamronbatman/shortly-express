var request = require('request');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));
var session = require('express-session');

var User = require('../app/models/user');
var Session = require('../app/models/sessions');

exports.getUrlTitle = function(url, cb) {
  request(url, function(err, res, html) {
    if (err) {
      console.log('Error reading url heading: ', err);
      return cb(err);
    } else {
      var tag = /<title>(.*)<\/title>/;
      var match = html.match(tag);
      var title = match ? match[1] : url;
      return cb(err, title);
    }
  });
};

var rValidUrl = /^(?!mailto:)(?:(?:https?|ftp):\/\/)?(?:\S+(?::\S*)?@)?(?:(?:(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[0-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]+-?)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))|localhost)(?::\d{2,5})?(?:\/[^\s]*)?$/i;

exports.isValidUrl = function(url) {
  return url.match(rValidUrl);
};

/************************************************************/
// Add additional utility functions below
/************************************************************/

//Returns a promise
exports.genHash = function(password) {
  return bcrypt.hashASync(password, 10);
}

//Returns a promise
exports.comparePassword = function(password, hash) {
  return bcrypt.compareAsync(password, hash);
}

exports.checkUser = function(req, res, next) {
  //Check sessions
  new Session({ sessionid: req.sessionid})
  .fetch().tap(function(exists){
    if (exists) {
      next();
    } else {
      User.isLoggedIn(req.username, req.password)
      .then(function(valid){
        if (valid) {
          new Session({ sessionid: req.sessionid })
          .save().then(function(session){
            next();
          });
        }
      })
    }
  })
  .catch(function(error){
    res.redirect('/login?error=true');
  });
};






