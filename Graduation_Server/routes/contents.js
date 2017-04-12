var express = require('express');
var fs = require('fs')

var mysql = require('mysql');
var db = require('../config/db.js');
var conn = mysql.createConnection(db);

var multer = require('multer');
var router = express.Router();
var utils = require('../public/javascripts/utils.js')

var _storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'files/images')
  },
  filename: function (req, file, cb) {
    cb(null, req.params.id +"-"+req.params.create_at+".png");
  }
});


router.post('/like',(req,res)=>{
  var user_id = req.body.user_id;
  var contents_id = req.body.content_id;
  var is_like = req.is_like;
 var sql; 

 if(is_like == 0){
  sql = 'INSERT INTO content_like(user_id,content_id,is_like) VALUES(?,?,?)';
  conn.query(sql,[user_id,content_id,is_like],(err,rows)=>{
  if(err){
  console.log(err)  
}else{
res.status(200).send('success');
}
})
  }else{
  sql = 'DELETE content_like where content_id = ?, user_id = ?';
  conn.query(sql,[content_id, user_id],(err,rows)=>{
  if(err){
	console.log(err);
}else{
res.status(200).send('delete');
}

})  

}

})

router.get('/all',(req,res)=>{

  var user_id=req.body.user_id;
  var sql = 'SELECT c.*, u.user_name'
  +' FROM user_info u,contents c'
  +' WHERE u.user_id=c.user_id'

    conn.query(sql,(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.json(rows);
      }
    })
})

router.get('/',(req,res)=>{

  var user_id=req.body.user_id;
console.log(user_id); 
 var sql = 'SELECT c.*, u.user_name,cl.is_like'
  +' FROM user_info u,contents c'
  +' LEFT OUTER JOIN content_like cl'
  +' ON cl.content_id = c.content_id && cl.user_id = ?'
  +' WHERE u.user_id=c.user_id'

    conn.query(sql,[user_id],(err,rows)=>{
      if(err){
        console.log(err);
      }else{
        res.json(rows);
      }
    })
})

//user_id = id인 값의 모든 글 보기
router.get('/:id', function(req, res) {



  var sql = 'SELECT c.*, u.user_name FROM contents c, user_info u WHERE c.user_id = ?'
  +' &&  c.user_id = u.user_id ORDER BY c.create_at DESC';
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
    var create_at = utils.getTimeStamp();
    var upload = multer({storage : _storage}).single('contents_image');

    req.params.create_at = create_at;

    upload(req,res,(err)=>{
      var user_id = req.params.id;
      var content_text = req.body.content_text;
      var share_range = req.body.share_range;
      var location_range = req.body.location_range;
      var image_dir = '/image/'+user_id + "-" + create_at + ".png";

      var has_image = req.body.has_image;
      //upload
      if(has_image == 1){
      var sql = 'INSERT INTO contents(user_id,content_text,create_at,share_range,location_range,image_dir)'
      + 'VALUES (?, ?, ?, ?,?,?)';


      conn.query(sql,[user_id, content_text,create_at, share_range, location_range,image_dir],(err,rows)=>{
        if(err){
          console.log(err);
        }else{
          res.status(200).send('success');
        }
      });
    }else{
      var sql = 'INSERT INTO contents(user_id,content_text,create_at,share_range,location_range)'
      + 'VALUES (?, ?, ?, ?,?)';
      conn.query(sql,[user_id, content_text,create_at, share_range, location_range],(err,rows)=>{
        if(err){
          console.log(err);
        }else{
          res.status(200).send('success');
        }
      });

    }
    })
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
          });
  });




  // router.get('/upload/:id',(req,res)=>{
  //   var file = fs.createReadStream('./files/images');
  //   console.log("access");
  //   file.pipe(res);
  //
  // })

module.exports = router;
