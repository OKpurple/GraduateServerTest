var express = require('express');
var bodyParser = require('body-parser');
var mysql = require('mysql');
var db = require('../config/db.js');
var conn = mysql.createConnection(db);
var router = express.Router();

var utils = require('../utils.js')

// get 반경 200미터 유저 검색
router.get('/around/:id', (req, res) => {
    var userId = req.params.id
    var latitude = req.query.lat;
    var longitude = req.query.lng;
    var sql = "SELECT user_id, ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) )* " +
        " cos( radians( lng ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) )" +
        " AS distance FROM user_posi WHERE user_id != ?" +
        " HAVING distance < 0.2 ORDER BY distance";
    conn.query(sql, [latitude, longitude, latitude, userId], (err, rows) => {
            if (err) {
                  console.log(err);
            } else {
                  res.json(utils.toResp(utils.SUCCESS, rows));
            }
        })
})

// post 유저의 위치 업데이트
router.post('/users/:id/location', function(req, res) {
    var userId = req.params.id;
    var latitude = req.body.lat;
    var longitude = req.body.lng;
    var sql = "UPDATE user_posi SET lat = ? , lng = ? WHERE user_id = ? "
    conn.query(sql, [latitude, longitude, userId], function(err, rows) {
            if (err) {
                console.log(err);
            } else {
                res.json(utils.SUCCESS)
            }
      })
})

module.exports = router
