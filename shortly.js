var express = require('express');
var Promise = require('bluebird');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var path = require('path');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var SessionStore = require('express-sql-session')(session);

var options = {
    client: 'sqlite3',
    connection: {
        host: '127.0.0.1',
        user: 'root',
        password: 'password',
        database: 'shortlydb',
        charset: 'utf8',
        filename: path.join(__dirname, './db/shortly.sqlite')
    }
};

var sessionStore = new SessionStore(options)

var app = express();

app.use(session({
  secret: 'MKS20-shortly-express',
  resave: false,
  saveUninitialized: true,
  store: sessionStore
}));

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));


app.get('/', util.checkUser,
function(req, res) {
  res.render('index');
});

app.get('/create', util.checkUser,
  function(req, res) {
    res.render('index');
});

app.get('/links',
  function(req, res) {
    Links.reset().fetch().then(function(links) {
      res.status(200).send(links.models);
    });
});

app.post('/links',
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.sendStatus(404);
  }

  console.log('Valid Url!', uri);

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.status(200).send(found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.sendStatus(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.status(200).send(newLink);
        });
      });
    }
  });
});

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', util.checkUser, function(req, res){
  res.redirect('/');
});

app.get('/signup', function(req, res) {
  res.render('signup');
});

app.post('/signup', function(req, res, next){
  if (req.body.username && req.body.password) {
    util.genHash(req.body.password).then( function(hash){
      new User({username: req.body.username, password_hash: hash})
      .save().then( function(user){
        Users.add(user);
        next();
      }).catch( function(error){
        res.redirect('./signup');
      });
    })
  } else {
    res.redirect('/signup');
  }
}, util.checkUser, function(req, res){
  res.redirect('/');
});

app.post('/logout', function(req, res){
  console.log('Logging you out!');
  req.session.destroy();
  res.redirect('/login');
})

/************************************************************/
// Handle the wildcard route last - if all other routes fail
// assume the route is a short code and try and handle it here.
// If the short-code doesn't exist, send the user to '/'
/************************************************************/

app.get('/*', function(req, res) {
  new Link({ code: req.params[0] }).fetch().then(function(link) {
    if (!link) {
      res.redirect('/');
    } else {
      var click = new Click({
        link_id: link.get('id')
      });

      click.save().then(function() {
        db.knex('urls')
          .where('code', '=', link.get('code'))
          .update({
            visits: link.get('visits') + 1,
          }).then(function() {
            return res.redirect(link.get('url'));
          });
      });
    }
  });
});

console.log('Shortly is listening on 4568');
app.listen(4568);
