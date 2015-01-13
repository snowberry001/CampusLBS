
var connection = require('./DB.js');

function Photo(photo){
	this.photo_id = photo.photo_id;
	this.tour_id = photo.tour_id;
	this.photo_desc = photo.photo_desc;
	this.location = photo.location;
	this.date = photo.date;
}

function Photo(photo_id, tour_id, photo_desc, location, date){
	this.photo_id = photo_id;
	this.tour_id = tour_id;
	this.photo_desc = photo_desc;
	this.location = location;
	this.date = date;
}

var photo = {
	photo_id: this.photo_id,
	tour_id: this.tour_id,
	photo_desc: this.photo_desc,
	location: this.location,
	date: this.date
};

/* Photo分享记录保存 */
Photo.save = function (photo, callback){
	connection.query('INSERT INTO photos SET ?', photo, function(err, result){
		if(err){			
			return callback(err, null);
		} else {
			return callback(null, result);
		}
	});	
	//connection.destroy();	
};



// Photo查询方法 query
Photo.query = function(options, callback){
	var sql = 'SELECT * FROM photos ';
	if(options){
		sql += 'WHERE ';
	}
	options = options || {};
	for (var name in options) {
		sql += name + '=' + options[name] + ' AND ';
	}
	sql = sql.substring(0, sql.length - 5);

	var query =  connection.query(sql);
	console.log(query.sql);
	connection.query(sql, function(err, rows){
		if (err)
		{
			return callback(err, null);
		} else {
			return callback(null, rows);
		}
	});
	//connection.destroy();
};

module.exports = Photo;