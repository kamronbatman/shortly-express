var request = require('request');
var Promise = require('bluebird');
var bcrypt = Promise.promisifyAll(require('bcrypt-nodejs'));

var User = require('../app/models/user');

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
  return bcrypt.genSaltAsync(10).then(function(result) {
    return bcrypt.hashAsync(password, result, null);
  });
}

//Returns a promise
exports.comparePassword = function(password, hash) {
  return bcrypt.compareAsync(password, hash);
};

exports.checkUser = function(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    var username = req.body.username;
    User.isLoggedIn(username, req.body.password)
    .then(function(valid){
      if (valid) {
        req.session.regenerate(function(){
          req.session.user = username;
          next();
        });
      } else {
        res.redirect('/login');
      }
    })
    .catch(function(error){
      res.redirect('/login');
    })
  }
};






