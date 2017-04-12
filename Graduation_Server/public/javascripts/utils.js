var AWS = require('aws-sdk');
var formidable = require('formidable');
var fs = require('fs')
AWS.config.region = 'ap-northeast-2';
var s3 = new AWS.S3();

//module.exports.putImageToS3 = function()


// module.exports.addContentToS3 = function(bucket,filePath){
//
//     fs.readFile(filePath, function(err,data){
//               if ( err ) {
//                   console.log(err);
//               }else {
//                 var param = {
//                     'Bucket' : bucket,
//                     'Key' : filePath,
//                     'ACL' : 'public-read',
//                     'Body' : data,
//                     'ContentType' : 'image/png'
//                 }
//                 s3.upload(param , function(err,data){
//                        if (err){
//                          console.log(err);
//                       }else{
//                         console.log(data);
//                   }
//               })
//           }
//     })
// }


module.exports.SUCCESS =  {
            meta: {
                      code: 0,
                      message: "success"
            }
};

module.exports .INVALID_REQUEST =  {
            meta: {
                      code: -10,
                      message: "잘못된 요청입니다."
            }
};

module.exports.toResp = function(meta,data){
          meta.data = data;
          return meta;
}

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
