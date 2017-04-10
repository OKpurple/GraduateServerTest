var express = require('express');
var bodyParser = require('body-parser');
var currentTimeStamp = require('currentTimeStamp')
var mysql = require('mysql');
var db = require('../config/db.js');
var router = express.Router();
//var path = process.cwd();
var conn = mysql.createConnection(db);



router.get('/',(req,res)=>{
  var sql = 'SELECT * FROM contents';
    conn.query(sql,(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.json(rows);
      }
    });
});

router.get('/:id', function(req, res) {
  var sql = 'SELECT * FROM contents WHERE user_id = ? ORDER BY create_at DESC';
    conn.query(sql ,[req.params.id],(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.json(rows);
      }
    });
  });

  router.post('/:id'), function(req,res){

    var userId = req.params.id;
    var contents_text = req.body.text;
    var share_range = req.body.share_range;
    var location_range = req.body.location_range;

    var sql = 'INSERT INTO contents(user_id,contents_text,share_range,location_range)'
    + 'VALUES (?, ?, ?, ?)';

    conn.query(sql,[userId, context_text, share_range, location_range],(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.status(200).send('success');
      }
    });
  });

  router.put('/:contents_id'){
    var userId = req.body.user_id;
    var contents_id = req.params.contents_id;
    var contents_text = req.body.text;
    var share_range = req.body.share_range;
    var location_range = req.body.location_range;
    var update_date = currentTimeStamp.getTimeStamp();

    var sql = 'UPDATE contents SET contents_text = ?, share_range = ?, location_range = ?, update_date = ?'
    + 'WHERE contents_id = ?';

    conn.query(sql,[contents_text, share_range, location_range, update_date, contents_id],(err,row)=>{
      if(err){
        console.log(err);
      }else{
        res.status(200).send('success');
      }
    });
  }


  router.delete('/:contents_id'){
    var contents_id = req.params.contents_id;

    var sql = 'DELETE FROM contents WHERE contents_id = ';
    conn.query(sql,[contents_id],(err, row)=>{
      if(err){
        console.log(err);
      }else{
        res.status(200).send('success');
      };
    });

  }



module.exports = router;
