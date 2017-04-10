var AWS = require('aws-sdk');
var fs = require('fs')
var awsConfig = require('./config/aws_config.json')

let config = new AWS.Config({
    accessKeyId : awsConfig.accessKeyId ,
    secretAccessKey : awsConfig.secretAccessKey,
    region : awsConfig.region
})

var s3 = new AWS.S3(config);

module.exports.addContentToS3 = function(bucket,filePath){

    fs.readFile(filePath, function(err,data){
              if ( err ) {
                  console.log(err);
              }else {
                var param = {
                    'Bucket' : bucket,
                    'Key' : filePath,
                    'ACL' : 'public-read',
                    'Body' : data,
                    'ContentType' : 'image/png'
                }
                s3.upload(param , function(err,data){
                       if (err){
                         console.log(err);
                      }else{
                        console.log(data);
                  }
              })
          }
    })
}


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
