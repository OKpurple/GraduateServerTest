var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/db.js');
var conn = mysql.createConnection(db);
var fs = require('fs');
var multer = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'files/profile')
  },
  filename: function (req, file, cb) {
    cb(null, req.body.user_id+ '-' + 'profile.png')
  }
})


router.get('/',(req,res)=>{
  var sql = "SELECT * FROM user_info"
  conn.query(sql,(err,rows)=>{
    if(err){
      console.log(err);
    }else{
      res.json(rows);
    }
  })
})

var upload = multer({storage:storage}).single('userprofile');
router.post('/profile',(req,res)=>{
  upload(req,res,(err)=>{
    var user_id = req.body.user_id;
    var image_dir = '127.0.0.1:8080/profile/' + user_id + "-"+'profile.png';
    var sql = "UPDATE user_info SET profile_dir=?"
    conn.query(sql,[image_dir],(err,rows)=>{
      if(err){
        res.status(400).send(err);
      }else{
        res.status(200).send('success');
      }
    })
  })
})

router.post('/',(req,res)=>{
  var login_id = req.body.login_id;
  var login_pw = req.body.login_pw;
  var user_name = req.body.user_name;
  var public_range = req.body.public_range;

  var sql = 'INSERT INTO user_info(login_id, login_pw, user_name,public_range)'
  +'VALUES(?,?,?,?)';

  conn.query(sql,[login_id, login_pw, user_name, public_range],(err,rows)=>{
    if(err){
      console.log(err);
    }else{
      res.status(200).send('success');
    }
  })

})


module.exports = router;
