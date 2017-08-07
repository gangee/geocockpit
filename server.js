var express = require('express');
var passport = require('passport');
var Strategy = require('passport-local').Strategy;
var db = require('./db');
var bcrypt = require('bcryptjs');

passport.use(new Strategy(
  function(username, password, cb) {
    db.users.findByUsername(username, function(err, user) {
		
      if (err) { return cb(err); }
      if (!user) { return cb(null, false); }
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
app.get('/',
  function(req, res) {
    res.render('home', { user: req.user });
  });

app.get('/login',
  function(req, res){
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

  
var pg = require('pg');
var conString = "postgres://postgres:IO_luz3rn@192.168.30.22:5432/smrl?ssl=true";
var client = new pg.Client(conString);
client.connect(); 

app.get('/design_spl/:spl_id',
  require('connect-ensure-login').ensureLoggedIn(),
  function(req, res){
	  client.query('SELECT ( select axians_splittergroup_label_code() || spl_number as doc_label from splice_enclosure where id = ' + req.params.spl_id + ') as spl_group,'+
					'(SELECT array_to_json ( ARRAY_AGG (row_to_json(ROW))) FROM ( SELECT "public".splitter.doc_label, "public".splitter."id", "public".splitter.fiber_input_num, "public".splitter.cluster_id, axians_cable_label_code () || "public".cable.doc_sequence_num AS input_cable_doc_label, "public".cable_node_connection_markup.cable_id AS input_cable_id FROM "public".splitter LEFT JOIN "public".cable_node_connection_markup ON "public".splitter.cable_node_connection_id = "public".cable_node_connection_markup."id" LEFT JOIN "public".cable ON "public".cable_node_connection_markup.cable_id = "public".cable."id" WHERE "public".splitter.spl_id =  ' + req.params.spl_id + ' order by doc_label) AS ROW ' +
					') as splitter,(SELECT array_to_json ( ARRAY_AGG (row_to_json(ROW))) FROM ( SELECT DISTINCT axians_cable_label_code () || lpad( "public".cable.doc_sequence_num :: TEXT, 3, \'0\' ) AS doc_label, "public".cable_node_connection_markup.cable_id, "public".cable.fiber_network_type FROM "public".splitter_cable_node_connection INNER JOIN "public".cable_node_connection_markup ON "public".splitter_cable_node_connection.cable_node_connection_id = "public".cable_node_connection_markup."id" INNER JOIN "public".cable ON "public".cable_node_connection_markup.cable_id = "public".cable."id" INNER JOIN "public".splitter ON "public".splitter_cable_node_connection.splitter_id = "public".splitter."id" WHERE "public".splitter.spl_id = ' + req.params.spl_id + ' order by doc_label ) AS ROW ) as cable', 
			function(err1, base_result) {
		  if (err1) {
			  console.log(err1);
		  }
		  console.log('SELECT ( select axians_splittergroup_label_code() || spl_number as doc_label from splice_enclosure where id = ' + req.params.spl_id + ') as spl_group,'+
					'(SELECT array_to_json ( ARRAY_AGG (row_to_json(ROW))) FROM ( SELECT "public".splitter.doc_label, "public".splitter."id", "public".splitter.fiber_input_num, "public".splitter.cluster_id, axians_cable_label_code () || "public".cable.doc_sequence_num AS input_cable_doc_label, "public".cable_node_connection_markup.cable_id AS input_cable_id FROM "public".splitter LEFT JOIN "public".cable_node_connection_markup ON "public".splitter.cable_node_connection_id = "public".cable_node_connection_markup."id" LEFT JOIN "public".cable ON "public".cable_node_connection_markup.cable_id = "public".cable."id" WHERE "public".splitter.spl_id =  ' + req.params.spl_id + ' order by doc_label) AS ROW ' +
					') as splitter,(SELECT array_to_json ( ARRAY_AGG (row_to_json(ROW))) FROM ( SELECT DISTINCT axians_cable_label_code () || lpad( "public".cable.doc_sequence_num :: TEXT, 3, \'0\' ) AS doc_label, "public".cable_node_connection_markup.cable_id, "public".cable.fiber_network_type FROM "public".splitter_cable_node_connection INNER JOIN "public".cable_node_connection_markup ON "public".splitter_cable_node_connection.cable_node_connection_id = "public".cable_node_connection_markup."id" INNER JOIN "public".cable ON "public".cable_node_connection_markup.cable_id = "public".cable."id" INNER JOIN "public".splitter ON "public".splitter_cable_node_connection.splitter_id = "public".splitter."id" WHERE "public".splitter.spl_id = ' + req.params.spl_id + ' order by doc_label ) AS ROW ) as cable');
		  var table_base = {group: base_result.rows[0].spl_group, splitter: base_result.rows[0].splitter, cable: base_result.rows[0].cable};
		  client.query('SELECT cable_doc_label, splitter_doc_label, splitter_cable_node_connection.splitter_id, cable_id, fiber_from, fiber_to, splitter_cable_node_connection."comment" FROM ( WITH con_cab AS ( SELECT DISTINCT axians_cable_label_code () || lpad( "public".cable.doc_sequence_num :: TEXT, 3, \'0\' ) AS cable_doc_label, "public".cable_node_connection_markup. ID AS cable_node_connection_id, "public".cable. ID AS cable_id, "public".cable.fiber_network_type FROM "public".splitter_cable_node_connection INNER JOIN "public".cable_node_connection_markup ON "public".splitter_cable_node_connection.cable_node_connection_id = "public".cable_node_connection_markup."id" INNER JOIN "public".cable ON "public".cable_node_connection_markup.cable_id = "public".cable."id" INNER JOIN "public".splitter ON "public".splitter_cable_node_connection.splitter_id = "public".splitter."id" WHERE "public".splitter.spl_id = ' + req.params.spl_id + ' ), spr AS ( SELECT "public".splitter.doc_label AS splitter_doc_label, "public".splitter."id" AS splitter_id, axians_cable_label_code () || "public".cable.doc_sequence_num AS input_cable_doc_label, "public".cable_node_connection_markup.cable_id AS input_cable_id FROM "public".splitter LEFT JOIN "public".cable_node_connection_markup ON "public".splitter.cable_node_connection_id = "public".cable_node_connection_markup."id" LEFT JOIN "public".cable ON "public".cable_node_connection_markup.cable_id = "public".cable."id" WHERE "public".splitter.spl_id = ' + req.params.spl_id + ' ) SELECT * FROM spr, con_cab ) AS t_data LEFT JOIN splitter_cable_node_connection ON t_data.cable_node_connection_id = splitter_cable_node_connection.cable_node_connection_id AND t_data.splitter_id = splitter_cable_node_connection.splitter_id ORDER BY cable_doc_label, splitter_doc_label',
			function(err2, data_result) {
				if (table_base.splitter.length) {
						res.render('designspl', { user: req.user, base_data: table_base, table_data: data_result });
				} else {
					
				}
		  });
	  });
    
  });

app.listen(3000);
