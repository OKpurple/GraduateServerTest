var db = require('./db.js');
var formidable = require('formidable');
var fs = require('fs');



module.exports.SUCCESS =  {
            meta: {
                      code: 0,
                      message: "success"
            }
};

module.exports.INVALID_REQUEST =  {
            meta: {
                      code: -10,
                      message: "잘못된 요청입니다."
            }
};


module.exports.toRes = function(meta,data){
    return Object.assign(
      {},
      meta,
      data
    )
}

//쿼리부분
module.exports.query = (connection, res, queryString, queryValueArr = null) => {
    return new Promise((resolved, rejected) => {
        connection.query(queryString, queryValueArr, (err, result) => {
            if (err) {
                console.log(err);
                connection.release();
                return connection.rollback(() => {
                    res.status(500).json({
                                                meta: {
                                                    code: -11,
                                                    message: "데이터베이스 오류"
                                                }
                                            });
                });
            } else {
                resolved(result);
            }
        });
    });
};

//커넥션하는 부분 connection줌
module.exports.dbConnect = (res)=>{
    return new Promise((resolved, rejected) => {
        db.getConnection((connectionErr, connection) => {
            if (connectionErr) {
                console.log(connectionErr);
                connection.release();
                return res.status(500).json(DB_ERROR);
            } else {
                resolved(connection);
            }
        });
    });
};



module.exports.getTimeStamp = function(){
  var d = new Date();

  var s =
    leadingZeros(d.getFullYear(), 4) + '-' +
    leadingZeros(d.getMonth() + 1, 2) + '-' +
    leadingZeros(d.getDate(), 2) + ' ' +

    leadingZeros(d.getHours(), 2) + ':' +
    leadingZeros(d.getMinutes(), 2) + ':' +
    leadingZeros(d.getSeconds(), 2);

  return s;
}

module.exports.getTimeTime= function(){
  var d = new Date();

  var s =
    leadingZeros(d.getHours(), 2) + ':' +
    leadingZeros(d.getMinutes(), 2) + ':' +
    leadingZeros(d.getSeconds(), 2);

  return s;
}
module.exports.getTimeDate = function(){
  var d = new Date();

  var s =
    leadingZeros(d.getFullYear(), 4) + '-' +
    leadingZeros(d.getMonth() + 1, 2) + '-' +
    leadingZeros(d.getDate(), 2);

  return s;
}


function leadingZeros(n, digits) {
  var zero = '';
  n = n.toString();

  if (n.length < digits) {
    for (i = 0; i < digits - n.length; i++)
      zero += '0';
  }
  return zero + n;
}

var LOGIN_ID_REGEXP = /^(?=.*[a-zA-Z])(?=.*[0-9])[a-zA-Z0-9]{6,16}$/;
var EMAIL_REGEXP = /^[0-9a-zA-Z]([\-.\w]*[0-9a-zA-Z\-_+])*@([0-9a-zA-Z][\-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,20}$/;
var PASSWORD_REGEXP = /^[A-Za-z0-9]{6,16}$/;

var randomString = (length) => {
var chars = "23456789ABCDEFGHJKLMNPQRSTUVWXTZabcdefghkmnopqrstuvwxyz";
  var randomstring = '';
  for (var i=0; i<length; i++) {
      var rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum,rnum+1);
  }
  return randomstring;
}
