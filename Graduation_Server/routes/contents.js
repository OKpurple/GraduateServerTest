var express = require('express');
var app = express();
var fs = require('fs')
var bodyParser = require('body-parser');
var mysql = require('mysql');
var db = require('../config/db.js');
var multer = require('multer');
var router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }))
var utils = require('../public/javascripts/utils.js')
var conn = mysql.createConnection(db);

var _storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'files/images')
  },
  filename: function (req, file, cb) {
    cb(null, req.params.id +"-"+ file.originalname +"-"+ req.params.create_at);
  }
})

var upload = multer({storage : _storage}).single('contents_image');



router.get('/',(req,res)=>{
  var sql = 'SELECT * FROM contents';
    conn.query(sql,(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.json(rows);
      }
    })
})

//user_id = id인 값의 모든 글 보기
router.get('/:id', function(req, res) {
  var sql = 'SELECT * FROM contents WHERE user_id = ? ORDER BY create_at DESC';
    conn.query(sql ,[req.params.id],(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.json(rows);
      }
    })
  })

  //user_id = id 글 쓰기
  router.post('/:id', function(req,res){

    var user_id = req.params.id;
    var content_text = req.body.content_text;
    var share_range = req.body.share_range;
    var location_range = req.body.location_range;
    var create_at = utils.getTimeStamp();

    console.log(content_text);
    req.params.create_at = create_at;

    //upload
    var sql = 'INSERT INTO contents(user_id,content_text,create_at,share_range,location_range)'
    + 'VALUES (?, ?, ?, ?,?)';


    conn.query(sql,[user_id, content_text,create_at, share_range, location_range],(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.status(200).send('success');
      }
    });
  });

  //글 수정
  router.put('/:contents_id',(req,res)=>{
    var userId = req.body.user_id;
    var contents_id = req.params.contents_id;
    var contents_text = req.body.contents_text;
    var share_range = req.body.share_range;
    var location_range = req.body.location_range;
    var update_date = utils.getTimeStamp();
    req.params.create_at = update_date;
    var sql = 'UPDATE contents SET contents_text = ?, share_range = ?, location_range = ?, update_date = ?'
    + 'WHERE contents_id = ?';

    conn.query(sql,[contents_text, share_range, location_range, update_date, contents_id],(err,row)=>{
      if(err){
        console.log(err);
      }else{
        res.status(200).send('success');
      }
    })
  })


  router.delete('/:contents_id',(req,res)=>{
    var contents_id = req.params.contents_id;

    var sql = 'DELETE FROM contents WHERE contents_id = ';
    conn.query(sql,[contents_id],(err, row)=>{
      if(err){
        console.log(err);
      }else{
        res.status(200).send('success');
      };
    })

  })








  // get 반경 200미터 유저 검색
  router.get('/around/:id', (req, res) => {
      var userId = req.params.id
      var latitude = req.query.lat;
      var longitude = req.query.lng;



      var sql2 = "(SELECT user_id, ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) )* " +
          " cos( radians( lng ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) )" +
          " AS distance FROM user_posi WHERE user_id != ?" +
          " HAVING distance < 0.2 ORDER BY distance) as around_user";

      var sql1 = 'select * from contents as c inner join' + sql2 + 'on c.user_id = around_user.user_id ORDER BY c.create_at DESC'
      conn.query(sql, [latitude, longitude, latitude, userId], (err, rows) => {
              if (err) {
                    console.log(err);
              } else {
                    res.json(utils.toResp(utils.SUCCESS, rows));
              }
          })
  })


  router.post('/upload/:id',(req,res)=>{


    res.status(200).send("success");
  })

  router.get('/upload/:id',(req,res)=>{
    var file = fs.createReadStream('./files/contents_image-1491885854216');
    console.log("access");
    file.pipe(res);

  })


module.exports = router;
