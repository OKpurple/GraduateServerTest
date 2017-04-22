var express = require('express');
var fs = require('fs')

var mysql = require('mysql');
var db = require('../config/db.js');
var conn = mysql.createConnection(db);

var multer = require('multer');
var router = express.Router();
var utils = require('../public/javascripts/utils.js')

var _storage = multer.diskStorage({
    destination: function(req, file, cb) {cb(null, 'files/images')},
    filename: function(req, file, cb) {cb(null, req.params.id + "-" + req.params.create_at + ".png");}
});


// get 반경 200미터 유저들의 게시물 30개 검색
router.get('/around', (req, res) => {
    var user_id = req.query.id
    var latitude = req.query.lat;
    var longitude = req.query.lng;
    //페이지 카운트

    var sql1 = "UPDATE user_posi SET lat = ? , lng = ? WHERE user_id = ?;"
    var sql2 = 'SELECT c.*, u.user_name, u.profile_dir, ifnull(cl.is_like,0) is_like ' +
        'FROM user_info u,' +
        '(SELECT user_id FROM user_posi WHERE user_id != ? AND ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) )< 1) up,' +
        'contents c ' +
        'LEFT OUTER JOIN content_like cl ' +
        'ON cl.user_id = ? && cl.content_id = c.content_id ' +
        'WHERE c.user_id = up.user_id AND c.user_id = u.user_id ' +
        'ORDER BY c.create_at DESC, c.content_id DESC LIMIT 0, 30';
    var sql = sql1+sql2;

    conn.query(sql, [latitude, longitude, user_id, user_id, latitude, longitude, latitude, user_id], (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200).json(rows[1]);
        }
    });
});




var upload = multer({storage: _storage}).single('contents_image');
//user_id = id 글 쓰기
router.post('/:id', function(req, res) {
    var create_at = utils.getTimeStamp();
    var crdate = utils.getTimeDate();
    var crtime = utils.getTimeTime();
    var cr = crdate + crtime;
    
    req.params.create_at = cr;

    upload(req, res, (err) => {
        var user_id = req.params.id;
        var content_text = req.body.content_text;
        var share_range = req.body.share_range;
        var location_range = req.body.location_range;

        var has_image = req.body.has_image;
        var image_dir = '0';
    	var lng = req.body.lng;
	var lat = req.body.lat;

        if (has_image == 1) {
            image_dir = 'http://13.124.115.238:8080/image/' + user_id + "-" + cr + ".png";
        }
	var sql1 = 'UPDATE user_posi SET lat=?,lng=? WHERE user_id =?;'

        var sql2 = 'INSERT INTO contents(user_id,content_text,create_at,share_range,location_range,image_dir) ' +
            'VALUES (?, ?, ?, ?, ?, ?)';
	var sql = sql1+sql2;
	
        conn.query(sql, [lat,lng,user_id,user_id, content_text, create_at, share_range, location_range, image_dir], (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                res.status(200).send(rows);
            }
        });
    });
});


//글 수정
router.put('/:contents_id', (req, res) => {
    var userId = req.body.user_id;
    var contents_id = req.params.contents_id;
    var contents_text = req.body.contents_text;
    var share_range = req.body.share_range;
    var location_range = req.body.location_range;
    var update_date = utils.getTimeStamp();
    req.params.create_at = update_date;
    var sql = 'UPDATE contents SET contents_text = ?, share_range = ?, location_range = ?, update_date = ?' +
        'WHERE contents_id = ?';

    conn.query(sql, [contents_text, share_range, location_range, update_date, contents_id], (err, row) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200).send('success');
        }
    })
})


router.delete('/:contents_id', (req, res) => {
    var contents_id = req.params.contents_id;

    var sql = 'DELETE FROM contents WHERE contents_id = ';
    conn.query(sql, [contents_id], (err, row) => {
        if (err) {
            console.log(err);
        } else {
            res.status(200).send('success');
        };
    })
})




//좋아요 버튼
router.post('/like', (req, res) => {
    var user_id = req.body.user_id;
    var contents_id = req.body.content_id;
    var is_like = req.is_like;
    var sql;

    if (is_like == 0) {
        sql = 'INSERT INTO content_like(user_id,content_id,is_like) VALUES(?,?,?)';
        conn.query(sql, [user_id, content_id, is_like], (err, rows) => {
            if (err) {
                console.log(err)
            } else {
                res.status(200).send('success');
            }
        })
    } else {
        sql = 'DELETE content_like where content_id = ?, user_id = ?';
        conn.query(sql, [content_id, user_id], (err, rows) => {
            if (err) {
                console.log(err);
            } else {
                res.status(200).send('delete');
            }
        })
    }
})



router.get('/all', (req, res) => {

    var user_id = req.query.user_id;
    var sql = 'SELECT c.*, u.user_name' +
        ' FROM user_info u,contents c' +
        ' WHERE u.user_id=c.user_id'

    conn.query(sql, (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.json(rows);
        }
    })
})

router.get('/', (req, res) => {

    var user_id = req.query.user_id;
    console.log(user_id);
    var sql = 'SELECT c.*, u.user_name, ifnull(cl.is_like,0) as is_like, u.profile_dir' +
        ' FROM user_info u,contents c' +
        ' LEFT OUTER JOIN content_like cl' +
        ' ON cl.content_id = c.content_id && cl.user_id = ?' +
        ' WHERE u.user_id=c.user_id'

    conn.query(sql, [user_id], (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.json(rows);
        }
    })
})

//user_id = id인 값의 모든 글 보기
router.get('/id', function(req, res) {
    var sql = 'SELECT c.*, u.user_name FROM contents c, user_info u WHERE c.user_id = ?' +
        ' &&  c.user_id = u.user_id ORDER BY c.create_at DESC';
    conn.query(sql, [req.params.id], (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.json(rows);
        }
    })
})









router.get('/never', function(req, res) {

    var user_id = req.query.id;
    var latitude = req.query.lat;
    var longitude = req.query.lng;

    console.log('user id = ' + user_id);
    console.log('lat = ' + latitude + ', lng = ' + longitude);
    var sql = 'SELECT user_id ' +
        'FROM user_posi ' +
        'WHERE user_id != ? ' +
        'AND ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) )< 0.5;'
    //  +      'ORDER BY distance';

    conn.query(sql, [user_id, latitude, longitude, latitude], (err, rows) => {
        if (err) {
            console.log(err);
        } else {
            res.json(rows);
        }
    })
})









module.exports = router;
