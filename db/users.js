
var pg = require('pg');

var conString = "postgres://postgres:IO_luz3rn@192.168.30.22:5432/smrl?ssl=true";

var client = new pg.Client(conString);
client.connect();

exports.findById = function(id, cb) {
  process.nextTick(function() {
	  client.query('SELECT * from cocpit.users where cocpit.users.id = ' + id + ' and cocpit.users.write_enabled', 
		function (error, result) { 
			if (error) {
				cb(new Error('User ' + id + ' does not exist'));
			} else {
				if (result.rows.length > 0) {
					return cb(null, 
						{ id: result.rows[0].id, username: result.rows[0].login, password: result.rows[0].password, displayName: result.rows[0].name, emails: [ { value: result.rows[0].email } ] }
					);
				} else {
					cb(new Error('User ' + id + ' does not exist'));
				}
			}
		});
  });
}

exports.findByUsername = function(username, cb) {
  process.nextTick(function() {
	  client.query('SELECT * from cocpit.users where cocpit.users.login = \'' + username + '\' and cocpit.users.write_enabled', 
		function (error, result) { 
			if (error) {
				return cb(null, null);
			} else {
				if (result.rows.length > 0) {
					return cb(null, 
						{ id: result.rows[0].id, username: result.rows[0].login, password: result.rows[0].password, displayName: result.rows[0].name, emails: [ { value: result.rows[0].email } ] }
					);
				} else {
					return cb(null, null);
				}
			}
			return cb(null, null);
		});
  });
}
