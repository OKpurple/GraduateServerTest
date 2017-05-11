var express = require('express');
var utils = require('../utils.js');
var jwt = require('jsonwebtoken');
var router = express.Router();

const TOKEN_KEY = "jwhtoken"

router.get('/send',(req,res)=>{
  var req_user_id = req.authorizationId;
  utils.dbConnect(res).then((conn)=>{
    utils.query(conn,res,
      `SELECT ur.res_user_id, u.user_name, u.profile
       FROM uesr_relations uro
       LEFT OUTER JOIN user_info u
       ON ur.req_user_id = u.user_id
       WHERE ur.req_user_id = ? AND ur.relation_status = 0`,[req_user_id])
    .then((result)=>{
      conn.release();
      if(result.length === 0){
        res.json({
          meta : {
            code : 202,
            message : "none"
          }
        })
      }else{
        conn.release();
      res.json({
        meta:{
          code : 201,
          message : "success"
        },
        data : result
      });
      }
    })
  })
})

router.post('/send',(req,res)=>{
  var req_user_id = req.authorizationId;
  var res_user_id = req.opponent_id;

  utils.dbConnect(res).then((conn)=>{
    utils.query(conn,res,`SELECT * FROM user_info WHERE user_id = ?`,[res_user_id])
    .then((selectRes)=>{
      if(selectRes.length === 0){
        conn.release();
        res.json(utils.toRes(utils.INVALID_REQUEST,{
          message : "없는 회원"
        }))
      }else{
        utils.query(conn,res,`SELECT * FROM user_relations WHERE req_user_id =?, res_user_id =?`,[req_user_id,res_user_id])
        .then((selRes)=>{
          if(selRes.length === 0){
            utils.query(conn,res,`INSERT INTO user_relations(req_user_id, res_user_id,relation_status) VALUES(?,?,0)`,[req_user_id,res_user_id])
            .then((fRes)=>{
              conn.release();
              utils.json(utils.SUCCESS);
            })
          }else{
            conn.release();
            utils.json(utils.toRes(utils.INVALID_REQUEST,{
              message : "이미 친구"
            }))
          }
        })
      }
    })
  })
})

router.post('/receive',(req,res)=>{
  var res_user_id = req.authorizationId;
  var req_user_id = req.opponent_id;

  utils.dbConnect(res).then((conn)=>{
    utils.query(conn,res,'UPDATE user_relations SET relation_status = 1 WHERE req_user_id = ?, res_user_id =?',[req_user_id,res_user_id])
    .then((result)=>{
      conn.release();
      res.json(utils.SUCCESS);
    })
  })
})

router.get('/receive',(req,res)=>{
  var res_user_id = req.authorizationId;
  utils.dbConnect(res).then((conn)=>{
    utils.query(conn,res,
      `SELECT ur.req_user_id, u.user_name, u.profile
       FROM uesr_relations uro
       LEFT OUTER JOIN user_info u
       ON ur.req_user_id = u.user_id
       WHERE ur.res_user_id = ? AND ur.relation_status = 0`,[res_user_id])
    .then((result)=>{
      conn.release();
      if(result.length === 0){
        res.json({
          meta : {
            code : 202,
            message : "none"
          }
        })
      }else{
        conn.release();
      res.json({
        meta:{
          code : 201,
          message : "success"
        },
        data : result
      });
      }
    })
  })
})

//친구 목록
router.get('/friends',(req,res)=>{
  var user_id = req.authorizationId;
//user_status 가 1이면 친구
  utils.dbConnect(res).then((conn)=>{
    utils.query(conn,res,
    `SELECT u.user_id,u.user_name, u.profile_dir, u.public_range from user_info u,
      (SELECT IF(ur.res_user_id = ?, ur.req_user_id, ur.res_user_id) as friend
       FROM user_relations ur
       WHERE relation_status = 1 AND ur.res_user_id = ? OR ur.req_user_id = ?) my
     WHERE my.friend = u.user_id`,[user_id,user_id,user_id]).then((result)=>{
       conn.release();
       res.json(utils.toRes(utils.SUCCESS,{
         data:result
       }))
     })
  })
})

router.delete('/',(req,res)=>{
  var user_id = req.authorizationId;
  var opponent_id = req.opponent_id;

  utils.dbConnect(res).then((conn)=>{
    utils.query(conn,res,`DELETE FROM user_relations WHERE (req_user_id = ? AND res_user_id = ?) OR (req_user_id = ? AND res_user_id=?)`,[user_id, opponent_id,opponent_id,user_id])
    .then((result)=>{
      conn.release();
      db.json(utils.toRes(utils.SUCCESS,{
        delete : result
      }))
    })
  })
})

router.put('/friend',(req,res)=>{
  var user_id = req.authorizationId;
  var opponent_id = req.opponent_id;

  utils.dbConnect(res).then((conn)=>{
    utils.query(conn,res,'UPDATE user_relations SET relation_status = 2 WHERE (req_user_id = ? AND res_user_id =?) OR (req_user_id = ? AND res_user_id=?)',[user_id,opponent_id,opponent_id,user_id])
    .then((result)=>{
      conn.release();
      res.json(utils.SUCCESS);
    })
  })
})




module.exports = router;
