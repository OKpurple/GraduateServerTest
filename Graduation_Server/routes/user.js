var express = require('express');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/db.js');
var conn = mysql.createConnection(db);

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
