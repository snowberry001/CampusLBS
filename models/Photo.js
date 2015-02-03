
var mongodb = require('./DB');

function Photo(photo){
	this.photo_new_url = photo.photo_new_url;
	this.photo_origin_url = photo.photo_origin_url;
	this.photo_desc = photo.photo_desc;
	this.location = photo.location;
	this.location_text = photo.location_text;
	this.create_date = photo.create_date;
	this.scan_num = photo.scan_num;
	this.update_date = photo.update_date;
}

function Photo(photo_new_url, photo_origin_url, photo_desc, latitude, longitude, location_text, create_date){
	this.photo_new_url = photo_new_url;
	this.photo_origin_url = photo_origin_url;
	this.photo_desc = photo_desc;
	this.location = {type: 'Point', coordinates: [longitude, latitude]};
	this.location_text = location_text;
	this.create_date = create_date;
	this.scan_num = 0;
	this.update_date = create_date;
}

/* Photo分享记录保存 */
Photo.save = function (photo, callback){
	
	mongodb.open(function(err, db){
		if (err)
		{
			return callback(err, null);
		}
		db.collection('photos', function(err, collection){
			if (err)
			{
				mongodb.close();
				return callback(err, null);
			}
			collection.ensureIndex('location');
			collection.insert(photo, {safe: true}, function(err, photos){
				mongodb.close();
				return callback(err, photos);
			});
		});
	});
};



// Photo查询方法 query
Photo.query = function(options, callback){

	mongodb.open(function(err, db){
		if (err)
		{
			return callback(err, null);
		}
		db.collection('photos', function(err, collection){
			if (err)
			{
				mongodb.close();
				return callback(err, null);
			}
			var query = options.query || {};
			var limit_num = options.limit_num || 100;
			collection.ensureIndex({'location':'2d'});
			collection.ensureIndex({'location':'2dsphere'});
			collection.find(query).limit(limit_num).toArray(function(err, docs){
				mongodb.close();
				return callback(err, docs);
			});
		});
	});
};


// Photo查询方法 query
Photo.queryWithDistance = function(options, callback){

	mongodb.open(function(err, db){
		if (err)
		{
			return callback(err, null);
		}


		/*默认搜索范围为附近5000m*/
    	var maxDistance = options.maxDistance || 5000;

    	var longitude = options.longitude;
    	var latitude = options.latitude;

    	var num = options.num || 20;

    	/*GeoJson格式查询单位为米
      	如果单位为弧度：km除以6371
    	*/
    	var selector = {geoNear:  "photos",                   
                    near: [longitude, latitude],
                    spherical: true, 
                    distanceMultiplier: 6371000,
                    maxDistance: maxDistance / 6371000,
                    num: num
        };
        var query = options.query || {};

	    console.log(selector);
		
		db.ensureIndex({'location':'2d'});
		db.ensureIndex({'location':'2dsphere'});
		db.command(selector, query, function(err, result){
			if (err)
			{
				mongodb.close();
				return callback(err, null);
			}
			mongodb.close();
			return callback(err, result.results);
		});
	});
};

module.exports = Photo;