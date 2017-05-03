var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
var utils = require('../utils')
const TOKEN_KEY = "jwhtoken"



router.get('/',(req,res)=>{
  let authorization = req.headers.authorization;


  utils.dbConnect(res).then((conn)=>{
    let decoded = jwt.verify(authorization,TOKEN_KEY);
    utils.query(conn,res,`INSERT INTO Invalid_token(Invalid_token,expired_to) VALUES(?,FROM_UNIXTIME(?))`,[authorization,decoded.exp])
    .then((insertResult)=>{
      let payLoad = { user_id : decoded.user_id };
                let token = jwt.sign(payLoad, TOKEN_KEY,{
                    algorithm : 'HS256', //"HS256", "HS384", "HS512", "RS256", "RS384", "RS512" default SHA256
                    expiresIn : '720H' // 5 days
                });
                conn.release();
                return res.json(
                    utils.toRes(
                        utils.SUCCESS,
                        {
                            token : token
                        }
                    )
                );
    }).catch((err)=>{
	console.log(err);
})
  })
})




module.exports = router;
