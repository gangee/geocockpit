
var pg = require('pg');
var config = require('./config');

var client = new pg.Client(config.db_tiles_connstring);
client.connect();

exports.getTotalStat = function () {
	return {total_printed: 0.05, total_sell: 0.3, total_prepared: 0.1};
}

exports.getTileStat = function (id) {
	return {name: 'K11', creator:'Geonformation Stadt Luzern', create_date: '2017-07-27'};
}
