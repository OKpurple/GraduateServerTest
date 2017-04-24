var express = require('express');
var utils = require('../utils.js');
var bcrypt =require('bcrypt');
var jwt = require('jsonwebtoken');
var router = express.Router();
var mysql = require('mysql');
var db = require('../config/db.js');
var conn = mysql.createConnection(db);
var fs = require('fs');
var multer = require('multer');
var authMiddleware = require('../middlewares/auth.js');
const TOKEN_KEY = "jwhtoken"


var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'files/profile')
    },
    filename: function(req, file, cb) {
        cb(null, req.body.user_id + '-' + 'profile.png')
    }
})





//회원 등록
router.post('/',(req,res)=>{
      var login_id = req.body.login_id;
      var login_pw = req.body.login_pw;
      let reEnterPassword = req.body.reEnterpw;
      var user_name = req.body.user_name;
      var public_range = req.body.public_range;

      let salt = bcrypt.genSaltSync(10);
      let passwordHash = bcrypt.hashSync(login_pw,salt);

      if (   login_pw=== undefined ||
           login_id === undefined ) {
        return res.status(400).json(utils.INVALID_REQUEST);
      }

      if(login_pw !== reEnterPassword){
        return res.status(400).json(

                {
                    meta: {
                        code: -26,
                        message: "비밀번호와 비밀번호 확인이 일치하지 않습니다."
                    }
                }

        );
    }

      utils.dbConnect(res).then((connection)=>{
        //id 중복검사
        utils.query(connection,res,
          'SELECT login_id from user_info WHERE login_id = ? ',[login_id]).then(result=>{
            if(result.length>0){
              connection.release();
              return res.status(400).json(utils.toRes(
                {
                  mata:{
                    code : -29,
                    message : "이미 존재하는 아이디"
                  }
                }
              ))
            }
            utils.query(connection,res,
            'INSERT INTO user_info(login_id, login_pw, user_name,public_range) VALUES (?,?,?,?)',
            [
              login_id,
              passwordHash,
              user_name,
              public_range
            ]
          ).then((registResult)=>{
            res.send(utils.toRes(utils.SUCCESS,
              {
              inserted : registResult
              }
          ));
            connection.release();
          })
          })
      })
})

//로그인
router.post('/login',(req,res)=>{
  var login_id = req.body.login_id;
  var login_pw = req.body.login_pw;
  console.log(login_id);

  utils.dbConnect(res).then((connection)=>{
    utils.query(connection,res,
    'SELECT login_id,login_pw,user_id from user_info WHERE login_id = ?',[login_id]).then((result)=>{
      if(result.length === 0){
          return res.status(400).json(
            {
              meta : {
                code:-31,
                message:"없는 id"
              }
            }
        )
      }
      else{
        let passwordResult = bcrypt.compareSync(login_pw, result[0].login_pw);
        if(passwordResult){
          let payload = { user_id : result[0].user_id }
          let token = jwt.sign(payload,TOKEN_KEY,{
                        algorithm : 'HS256', //"HS256", "HS384", "HS512", "RS256", "RS384", "RS512" default SHA256
                        expiresIn : '720H'// 5 days
                    });
          return res.status(200).json(utils.toRes(utils.SUCCESS,
          {
              token : token
          }
        ));
        }else{
        //비밀번호 불일치
          return res.status(400).json(
            {
              meta:{
                code:-32,
                message:"비밀번호 불일치"
              }
            }
          )
        }
      }
    })
  })
})



//내 정보
router.get('/:user_id',(req,res)=>{

  let user_id = req.authorizationId;
  console.log(user_id);

  utils.dbConnect(res).then((connection)=>{
    utils.query(connection,res,
    'SELECT * from user_info WHERE user_id = ?',[user_id]).then((result)=>{
      if(result.length === 0 ){
        res.status(400).json(utils.toRes(utils.INVALID_REQUEST,
          {
            message : "없는 ID"
          }
      ))}
      else{
        res.status(200).json(utils.toRes(utils.SUCCESS,
          {
            data : result
          }
      ));
    };
    })
  })
})


//프로필 업데이트
var upload = multer({
    storage: storage
}).single('userprofile');
router.post('/profile', (req, res) => {
    upload(req, res, (err) => {
        var user_id = req.body.user_id;
        var image_dir = 'http://13.124.115.238:8080/profile/' + user_id + "-" + 'profile.png';
        var sql = 'UPDATE user_info' +
            'SET profile_dir = ?'
        conn.query(sql, [image_dir], (err, rows) => {
            if (err) {
                res.json(utils.toRes(utils.INVALID_REQUEST));
            } else {
                res.json(utils.toRes(utils.SUCCESS))
            }
        })
    })
})






// post 유저의 위치 업데이트
router.post('/position', function(req, res) {

    var user_id = req.authorizationId
    var latitude = req.body.lat;
    var longitude = req.body.lng;

    utils.dbConnect(res).then((connection)=>{
      utils.query(connection,res,`SELECT * from user_posi WHERE user_id = ?`,[user_id])
      .then((selectRes)=>{
        if(selectRes.length === 0){
          utils.query(connection,res,`INSERT INTO user_posi(lat,lng, user_id) VALUES (?,?,?)`,
          [latitude,longitude,user_id]).then((insertRes)=>{
            return res.json({
                message : "insert",
                data : insertRes
            })
          });
        }else{
          utils.query(connection,res,`UPDATE user_posi SET lat = ? , lng = ? WHERE user_id = ?`,
            [latitude,longitude,user_id]).then((result)=>{
                return res.json(utils.toRes(utils.SUCCESS,{
                message : "update",
                data : result
              })
            );
              connection.release();

            })
        }
      })
    })
  })

  //모든유저
  router.get('/', (req,res) =>{
    utils.dbConnect(res).then((connection)=>{
      utils.query(connection,res,
        `SELECT * FROM user_info ui
         LEFT OUTER JOIN user_posi up
         ON ui.user_id = up.user_id`)
         .then((result)=>{
           connection.release();
           res.status(200).json(utils.toRes(utils.SUCCESS,
             {
              usersCount : result.length,
              users : result
            }
           ));
         });
    })
  });







module.exports = router;
