

var path = require('path');
var fs = require('fs');
var mime = require('./mime').mime;
var express = require('express');
var router = express.Router();

var app = process.app;

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
router.post('/upload', function(req, res){

});

module.exports = router;