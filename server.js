var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');
var bcrypt = require('bcryptjs');

var config = require('./db/config');
var pg = require('pg');
var client = new pg.Client(config.db_tiles_connstring);

passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {		
      if (err) { console.log('denied! - error'); return cb(err); }
      if (!user) { console.log('denied! - name'); return cb(null, false); }
      if (!bcrypt.compareSync(password, user.password)) { 
			console.log('denied!'); return cb(null, false); 
		}
      return cb(null, user);
    });
  }));


passport.serializeUser(function(user, cb) {
  cb(null, user.id);
});

passport.deserializeUser(function(id, cb) {
  db.users.findById(id, function (err, user) {
    if (err) { return cb(err); }
    cb(null, user);
  });
});

// Create a new Express application.
var app = express();

// Configure view engine to render EJS templates.
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');

// Use application-level middleware for common functionality, including
// logging, parsing, and session handling.
app.use(require('morgan')('combined'));
app.use(require('cookie-parser')());
app.use(require('body-parser').urlencoded({ extended: true }));
app.use(require('express-session')({ secret: 'keyboard cat', resave: false, saveUninitialized: false }));

// Initialize Passport and restore authentication state, if any, from the
// session.
app.use(passport.initialize());
app.use(passport.session());

// Define routes.
app.use('/js', express.static('public/js'));
app.use('/img', express.static('public/img'));
app.get('/',
  function(req, res) {
	  if (!req.user) {
		res.render('info', { user: req.user });
	  } else {
		  res.render('index', { user: req.user, total_data: db.data_smrl.getTotalStat() });
	  }
  });

app.get('/login',
  function(req, res) {
    res.render('login');
  });
  
app.post('/login', 
  passport.authenticate('local', { successReturnToOrRedirect: '/', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });
  
app.get('/logout',
  function(req, res){
    req.logout();
    res.redirect('/');
  });

  
client.connect(); 

app.get('/design_spl/:spl_id',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
	  client.query('SELECT 1 ', 
			function(err1, base_result) {
		  if (err1) {
			  console.log(err1);
		  }
		  var table_base = {group: base_result.rows[0].spl_group, splitter: base_result.rows[0].splitter, cable: base_result.rows[0].cable};
		  client.query('SELECT 1',
			function(err2, data_result) {
				if (table_base.splitter.length) {
						res.render('designspl', { user: req.user, base_data: table_base, table_data: data_result });
				} else {
					
				}
		  });
	  });
    
  });

app.listen(3000);
