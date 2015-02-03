

var path = require('path');
var fs = require('fs');
var express = require('express');
var router = express.Router();
var formidable = require('formidable'); 
var UUID = require('uuid-js');

var mime = require('./mime').mime;
var Photo = require('../models/Photo');



/*
* 推荐附近图片
* 返回更多详细信息
* result中dis以m为单位
*/
router.get('/find', function(req, res){
    var location = req.query.accurateLocation;
    var locArr = location.split(',');
    var latitude = Number(locArr[0]);
    var longitude = Number(locArr[1]);

    var options = {};
    options.longitude = longitude;
    options.latitude = latitude;
    
    Photo.queryWithDistance(options, function(err, result) {
        if (err) {
            console.log(err);
            res.send({err: err});
        } else {
            console.log(result);
            res.send(result);
        }
    });
});



/* 处理数据库记录插入 */
var insertAndPushSharePhoto = function(fields, res){

    var photo_new_url = fields['photo_new_url'];
    var photo_origin_url = fields['photo_origin_url'];
    var photo_desc = fields['photo_desc'];
    var create_date = fields['create_date']; 
    var locArr = fields['accurate_location'].split(',');
    var latitude = Number(locArr[0]);
    var longitude = Number(locArr[1]);
    var location_text = fields["location_text"];

    var photo = new Photo(photo_new_url, photo_origin_url, photo_desc, latitude, longitude, location_text, create_date);
    Photo.save(photo, function(err, result) {
        if (err) {
            console.log(err);
            res.send({err: err});
        } else {
            console.log(result[0].photo_new_url);

            var options = {latitude: latitude, longitude: longitude};
            Photo.queryWithDistance(options, function(err, photos){
                if (err) {
                    console.log(err);
                    res.send({err: err});
                } else {
                    console.log(photos);
                    res.send(photos);
                }
            });
        }
    });
    
};

/* 图片重命名 */
var renamePhoto = function(photo) {

    var new_photo_name = UUID.create().toString() + '.png';
    //var ext = photo.name.split('.')[1];
    fs.renameSync(photo.path, 'upload/' + new_photo_name);    
    return new_photo_name;
};

/* 图片分享 */
router.post('/upload', function(req, res){

    // 保证图片文件夹存在
    var upload_folder = path.join(process.app.get('rootDir'), 'upload');
    if(!fs.existsSync(upload_folder)){
        fs.mkdirSync(upload_folder);
    }

    // 处理图片上传
    var form = new formidable.IncomingForm();
    form.encoding = 'utf-8';
    form.uploadDir = 'upload';
    form.keepExtensions = true;
    form.maxFieldsSize = 5*1024*1024;

    var fields = {}, files = {};

    form.on('field', function(name, value){
        if (form.type == 'multipart') {
            if (name in fields) { 
                if (util.isArray(fields[name]) === false) {
                    fields[name] = [fields[name]];
                }
                fields[name].push(value);
                return;
            }
        }
        fields[name] = value;
    });

    form.on('file', function(name, file){
        files[name] = file;
    });

    form.on('end', function(){
        console.log(files);
        console.log(fields);
        // 图片重命名
        var photo_new_name = renamePhoto(files.shareImage);
        fields["photo_new_url"] = photo_new_name;
        
        /* 1、数据库插入分享记录 
         * 2、推送附近图片
        */
        insertAndPushSharePhoto(fields, res);
    });

    form.on('err', function(err){
        console.log(err);
        res.status(500).end();
    });

    form.parse(req);
});


/*
* 推荐附近图片
* 不返回dis，只返回document
*/
router.post('/recommend1', function(req, res){
	var location = req.body.accurateLocation;
	var locArr = location.split(',');
	var latitude = Number(locArr[0]);
	var longitude = Number(locArr[1]);

    var dis = Number(req.body.maxDistance) || 1000;

    /*GeoJson格式查询单位为米
      如果单位为弧度：km除以6371
    */
    var query = {'location': {$geoNear:                     
                   {$geometry:
                        { type: "Point" ,
                          coordinates : [longitude, latitude] } } ,
                   $maxDistance : dis}
                };
    console.log(query);
    var options = {};
    options.query = query;
    options.limit_num = 2;
	Photo.query(options, function(err, result) {
        if (err) {
            console.log(err);
            res.send({err: err});
        } else {
            console.log(result);
			res.send({result: result});
        }
    });
});


/*
* 推荐附近图片
* 返回更多详细信息
* result中dis以m为单位
*/
router.post('/recommend', function(req, res){
    var location = req.body.accurateLocation;
    var locArr = location.split(',');
    var latitude = Number(locArr[0]);
    var longitude = Number(locArr[1]);
    var maxDistance = Number(req.body.maxDistance);

    var options = {};
    options.longitude = longitude;
    options.latitude = latitude;
    options.maxDistance = maxDistance;
    
    Photo.queryWithDistance(options, function(err, result) {
        if (err) {
            console.log(err);
            res.send({err: err});
        } else {
            console.log(result);
            res.send({result: result});
        }
    });
});

/* 根据照片id获取照片 */
router.get('/name/:filename', function(req, res){
    
    // 参数校验
    var filename = req.params.filename;
    var result = filename.split('.');
    if (result.length != 2) {
        res.status(404).end();
        return;         
    }
    var photo_id = result[0];
    var photo_type = result[1];
    var content_type = mime[photo_type];
    if (!content_type) {
        res.status(404).end();
        return;
    }

    var filePath = path.join(process.app.get('rootDir'), 'upload', filename);

    fs.exists(filePath, function (exists) {
        if(exists){
            res.set({'Content-Type': content_type});
            res.sendFile(filePath);    
        }else {
            res.status(404).end();
            return;
        }       
    });

});

module.exports = router;