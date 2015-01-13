

var path = require('path');
var fs = require('fs');
var express = require('express');
var router = express.Router();
var formidable = require('formidable'); 

var mime = require('./mime').mime;
var Photo = require('../models/Photo');

/* 根据照片id获取照片 */
router.get('/:filename', function(req, res){
	
    // 参数校验
	var filename = req.params.filename;
    var result = filename.split('.');
    if (result.length != 2) {
        res.status(404).end();
        return;         
    }
  	var photo_id = Number(result[0]);
    var photo_type = result[1];
	var content_type = mime[photo_type];
    if (isNaN(photo_id) || !content_type) {
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

// 上传照片
router.post('/share', function(req, res){

    // 处理数据库记录插入
    var photo_id = req.body.photo_id;
    var tour_id = req.body.tour_id;
    var photo_desc = req.body.photo_desc;
    var location = req.body.location;
    var date = req.body.date; 

    var photo = new Photo(photo_id, tour_id, photo_desc, location, date);
    Photo.save(photo, function(err, result) {
        if (err) {
            console.log(err);
            res.send({err: err});
            //res.status(500).end();
        } else {
            var insertId = result.insertId;
            var options = {tour_id: 222,photo_id: 111};
            Photo.query(options, function(err, rows) {
                if (err) {
                    res.send({err: err});
                } else {
                    res.send({rows: rows});
                }
            });
            //res.send({result: result});
        }
    });
    
});

/* 处理数据库记录插入 */
var createShareRecord = function(fields, res){

    var photo_id = fields['photo_id'];
    var tour_id = fields['tour_id'];
    var photo_desc = fields['photo_desc'];
    var location = fields['location'];
    var date = fields['date']; 

    var photo = new Photo(photo_id, tour_id, photo_desc, location, date);
    Photo.save(photo, function(err, result) {
        if (err) {
            console.log(err);
            res.send({err: err});
            //res.status(500).end();
        } else {
            var insertId = result.insertId;
            var options = {tour_id: 222,photo_id: 111};
            Photo.query(options, function(err, rows) {
                if (err) {
                    res.send({err: err});
                } else {
                    res.send({rows: rows});
                }
            });
        }
    });
    
};

/* 图片重命名 */
var renamePhoto = function(fields, photo) {
    var tour_id = fields.tour_id;
    var photo_id = fields.photo_id;
    var ext = photo.name.split('.')[1];
    var current_folder = path.join('upload' ,tour_id + '');

    if(!fs.existsSync(current_folder)){
        fs.mkdirSync(current_folder);
    }

    fs.renameSync(photo.path, current_folder + '/' + photo_id + '.' + ext);    
};

/* 图片分享 */
router.post('/upload', function(req, res){

    // 保证临时文件夹存在
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
        renamePhoto(fields, files.file1);
        // 数据库插入分享记录
        createShareRecord(fields, res);
    });

    form.on('err', function(err){
        console.log(err);
        res.status(500).end();
    });

    form.parse(req);
});

module.exports = router;