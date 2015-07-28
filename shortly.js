var express = require('express');
var util = require('./lib/utility');
var partials = require('express-partials');
var bodyParser = require('body-parser');
var session = require('express-session');
var bcrypt = require('bcrypt');

var db = require('./app/config');
var Users = require('./app/collections/users');
var User = require('./app/models/user');
var Links = require('./app/collections/links');
var Link = require('./app/models/link');
var Click = require('./app/models/click');

var app = express();

app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(partials());
// Parse JSON (uniform resource locators)
app.use(bodyParser.json());
// Parse forms (signup/login)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

app.use(session({secret: 'jkdslahvlas;fhvualvchakhjvhasuvbaskdfvhasufbcLCXhbv', cookie: { maxAge: 60000 }}));

var isLoggedIn = function(req, res, next){
  // if req.sessionID is in database
  // Check to see if it matches
  Users.query({where:{sessionID: req.sessionID}}).fetch().then(function(model){
    if(model.length > 0){
      // Your Authenticated!
      next();
    } else {
      res.redirect('/login');
    }
    
  });
};

//app.get('/', function(req, res, next){return isLoggedIn(req, res, next);},
app.get('/', isLoggedIn,
function(req, res) {
  res.render('index');
});

app.get('/create', isLoggedIn,
function(req, res) {
  res.render('index');
});

app.get('/links', isLoggedIn,
function(req, res) {
  Links.reset().fetch().then(function(links) {
    res.send(200, links.models);
  });
});

app.post('/links', isLoggedIn,
function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }

  new Link({ url: uri }).fetch().then(function(found) {
    if (found) {
      res.send(200, found.attributes);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.log('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save().then(function(newLink) {
          Links.add(newLink);
          res.send(200, newLink);
        });
      });
    }
  });
});

/************************************************************/
// Write your authentication routes here
/************************************************************/

app.get('/login', function(req, res){
  res.render('login');
});

app.post('/login', function(req, res){
  // Handle Login
  // get user by username from the database
  Users.query().where({username: req.body.username}).fetch().then(function(model){
    if(model.length > 0){
      // The username exists
      console.log(model);

      // has the model.password
      bcrypt.compare(req.body.password, model.get('password'), function(err, res) {
        if(res){
          model.set('sessionID', req.sessionID);
          model.save();
          res.redirect('/');
        } else {
          res.redirect('/login');
        }
      });
    } else {
      res.redirect('/login');
    }
    
  });
  // hash the password and compare
    // if there's a corresponding data entry
      // redirect to /
  // else leave at login page
});

app.get('/signup', function(req, res){
  res.render('signup');
});

app.post('/signup', function(req, res){
  // Modify the Data
  var user = new User({
    username:req.body.username, 
    password:req.body.password,
    sessionID:req.sessionID
  });
  user.save().then(function(){
    res.redirect('/');
  });
});

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
