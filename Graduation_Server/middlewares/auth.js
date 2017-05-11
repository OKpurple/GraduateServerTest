var jwt = require('jsonwebtoken');
let TOKEN_KEY = 'jwhtoken';
var utils = require('../utils');
var authMiddleware = (req,res,next) => {
  var token = req.headers.authorization;

  //로그인 시
  if ( req.path === '/login'){
      return next();
  }
  //회원 가입시
  if ( req.path === '/regist'){
      return next();
  }

  if ( req.path === '/contents'){
      return next();
  }

  if(!token){
    return res.status(403).json({
           success: false,
           message: 'not logged in'
       })
  }

  const onError = (error) => {
      return res.status(403).json({
            code : 403,
            success: false,
            message: error.message
        })
    }

    utils.dbConnect(res).then((connection)=>{

      utils.query(connection,res,`SELECT * FROM Invalid_token WHERE Invalid_token = ?`,[token])
      .then((selectResult)=>{
	connection.release()
        if(selectResult.length === 0){
          new Promise((resolve,reject)=>{
            jwt.verify(token, TOKEN_KEY,(err,decoded)=>{
              if(err){
                reject(err);
              }else{
                resolve(decoded);
              }
          });
        }).then((decoded)=>{
          console.log(decoded.user_id);
          req.authorizationId = decoded.user_id
          //.headers.authorization = token;
          next();
        }).catch(onError);
      }else{
        return res.status(400).json({
          meta:{
            message : "파기된 토큰"
          }
        })
      }
    })
  })

};





module.exports = authMiddleware;
