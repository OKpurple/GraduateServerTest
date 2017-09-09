/*jshint esversion: 6 */
var express = require('express');
var fs = require('fs')
var multer = require('multer');
var router = express.Router();
var utils = require('../utils.js')

var _storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'files/images')
    },
    filename: function(req, file, cb) {
        cb(null, req.authorizationId + "-" + req.params.create_at + ".png");
    }
});
const TOKEN_KEY = "jwhtoken"

//모든 글 보기//안씀
router.get('/test', (req, res) => {
    utils.dbConnect(res).then((connection) => {
        utils.query(connection, res,
            `SELECT * FROM contents`).then((result) => {
            if (result.length === 0) {
                connection.release()
                res.status(200).json({
                    meta: {
                        code: 200,
                        message: "글이 없음"
                    }
                })
            } else {
                connection.release()
                res.status(200).json(utils.toRes(utils.SUCCESS, {
                    data: result
                }))
            }
        })
    })
})

//친구글보기
router.get('/friend', (req, res) => {
    var user_id = req.authorizationId
    var latitude = req.query.lat;
    var longitude = req.query.lng;
    var search_time = utils.getTimeStamp();
    console.log("contents/friend 친구글 보기");

    //위치 업데이트
    utils.dbConnect(res).then((connection) => {
        //페이징을 위한 검색시간
        //트리거 사용 페이징타임 인서트
        utils.query(connection, res, `UPDATE pagenation SET search_time = ? WHERE user_id = ?`, [search_time, user_id]).then((resp) => {
            utils.query(connection, res,
                    'UPDATE user_posi SET lat = ? , lng = ? WHERE user_id = ?', [latitude, longitude, user_id])
                .then((updateresult) => {
                    utils.query(connection, res,
                            `SELECT c.*, u.user_name, u.profile_dir,u.login_id, ifnull(cl.is_like,0) AS is_like
                          FROM (SELECT IF(ur.res_user_id = ?, ur.req_user_id, ur.res_user_id) as friend
                             FROM user_relations ur
                             WHERE relation_status = 1 AND (ur.res_user_id = ? OR ur.req_user_id = ?)) myf, user_info u, pagenation pn,contents c
                          LEFT OUTER JOIN content_like cl
                          ON cl.user_id = ? && cl.content_id = c.content_id
                          WHERE (c.user_id = myf.friend  AND u.user_id = c.user_id AND c.user_id != ? AND pn.user_id = ? AND c.create_at < pn.search_time ) ORDER BY c.create_at DESC, c.content_id DESC LIMIT 0, 29`
                          , [user_id, user_id, user_id, user_id,user_id, user_id])
                        .then(aroundResult => {
                            if (aroundResult.length === 0) {
                                connection.release();
                                res.status(201).json({
                                    meta: {
                                        code: 201,
                                        message: "친구중에 글 올린 사람이 없음"
                                    }
                                })
                            } else {
                                connection.release()
                                res.status(200).json(utils.toRes(utils.SUCCESS, {
                                    nextpage: "http://13.124.115.238:8080/contents/friend/page/30",
                                    data: aroundResult
                                }))

                            }

                        })
                })
        })
    })

})


//페이지 네이션
router.get('/around/page/:pagecnt', (req, res) => {
console.log("contents/around/page/:pagecnt  페이지네이션")
    var user_id = req.authorizationId
    var startPage = parseInt(req.params.pagecnt);
    var endPage = startPage + 29;
    var latitude = req.query.lat;
    var longitude = req.query.lng;
    var nextpageRUL = "http://13.124.115.238:8080/contents/around/page/" + (endPage + 1);
    console.log(nextpageRUL);

    utils.dbConnect(res).then((connection) => {
        utils.query(connection, res,
                'UPDATE user_posi SET lat = ? , lng = ? WHERE user_id = ?', [latitude, longitude, user_id])
            .then((updateresult) => {
                utils.query(connection, res,
                        `SELECT c.*, u.user_name, u.profile_dir,u.login_id, ifnull(cl.is_like,0) AS is_like
                    FROM (SELECT user_id FROM user_posi WHERE user_id != ? AND ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) )< 1) up,
                    user_info u, pagenation pn,contents c
                    LEFT OUTER JOIN content_like cl
                    ON cl.user_id = ? && cl.content_id = c.content_id
                    WHERE c.user_id = up.user_id AND c.user_id = u.user_id AND c.user_id != ? AND pn.user_id = ? AND c.create_at < pn.search_time
                    ORDER BY c.create_at DESC, c.content_id DESC LIMIT ?, ?`, [user_id, latitude, longitude, latitude, user_id, user_id,user_id ,startPage, endPage])
                    .then(aroundResult => {
                        if (aroundResult.length === 0) {
                            connection.release();
                            res.status(201).json({
                                meta: {
                                    code: 201,
                                    message: "더이상 글이 없습니다."
                                }
                            })
                        } else {
                            connection.release()
                            res.status(200).json(utils.toRes(utils.SUCCESS, {
                                nextpage: nextpageRUL,
                                data: aroundResult
                            }))

                        }

                    })
            })
    })


});





//user_id = id인 값의 모든 글 보기
router.get('/:userId/info', function(req, res) {
    var my_id = req.authorizationId;
    var user_id = req.params.userId;
    console.log("contents/:userId/info " + user_id + " 의 글보기");


    var friend_status;
    utils.dbConnect(res).then((connection) => {
        utils.query(connection, res, `
          SELECT * FROM user_relations ur
          WHERE ur.req_user_id = ? AND ur.res_user_id = ? AND relation_status = 1
          UNION
          SELECT * FROM user_relations ur
          WHERE ur.req_user_id = ? AND ur.res_user_id = ? AND relation_status = 1`, [my_id, user_id,user_id,my_id]).then((relationRes) => {
            if (relationRes.length === 0) {
                friend_status = 0; //친구아님
            }else{
              friend_status = 2; //친구임
            }
            utils.query(connection, res, `
              SELECT * FROM user_relations WHERE req_user_id = ? AND res_user_id = ? AND relation_status = 0
              `, [my_id,user_id]).then((resss) => {


              if(resss.length !== 0){
                friend_status = 1; // 친구 요청 보냈음
              }


                utils.query(connection, res,
                        `SELECT c.content_id,c.*, u.user_name,u.login_id,u.profile_dir, ifnull(cl.is_like,0) AS is_like
                         FROM (contents c, user_info u)
                         LEFT OUTER JOIN content_like cl
                         ON cl.user_id = ? && cl.content_id = c.content_id
                         WHERE c.user_id = ? && c.user_id = u.user_id
                         ORDER BY c.create_at DESC`, [user_id, user_id])
                    .then((result) => {
                      connection.release()
                        if (result.length === 0) {

                            res.status(200).json({
                                meta: {
                                    code: 200,
                                    message: "쓴 글이 없습니다"

                                },
                        				friend_status : friend_status
                            })
                        } else {
                            res.status(200).json(utils.toRes(utils.SUCCESS, {
                                myContentsCount: result.length,
                                myContents: result,
                                friend_status : friend_status
                            }))
                        }
                    })
            })
        })
    })
})



// get 반경 200미터 유저들의 게시물 30개 검색
router.get('/around', (req, res) => {
    var user_id = req.authorizationId
    var latitude = req.query.lat;
    var longitude = req.query.lng;
    var search_time = utils.getTimeStamp();
  console.log("contents/around 주변글보기 user_id = " +user_id + ", "+ longitude + ", "+latitude);

    //위치 업데이트
    utils.dbConnect(res).then((connection) => {
        //페이징을 위한 검색시간
        //트리거 사용 페이징타임 인서트
        utils.query(connection, res, `UPDATE pagenation SET search_time = ? WHERE user_id = ?`, [search_time, user_id]).then((resp) => {
            utils.query(connection, res,
                    'UPDATE user_posi SET lat = ? , lng = ? WHERE user_id = ?', [latitude, longitude, user_id])
                .then((updateresult) => {
                    utils.query(connection, res,
                            `SELECT c.*, u.user_name,u.login_id, u.profile_dir, ifnull(cl.is_like,0) AS is_like
                            FROM (SELECT user_id FROM user_posi WHERE ( 6371 * acos( cos( radians(?) ) * cos( radians( lat ) ) * cos( radians( lng ) - radians(?) ) + sin( radians(?) ) * sin( radians( lat ) ) ) )< 1) up,
                            user_info u, pagenation pn,contents c
                            LEFT OUTER JOIN content_like cl
                            ON cl.user_id = ? && cl.content_id = c.content_id
                            WHERE c.user_id = up.user_id AND c.user_id = u.user_id AND pn.user_id = ? AND c.create_at < pn.search_time
                            ORDER BY c.create_at DESC, c.content_id DESC LIMIT 0, 29`, [latitude, longitude, latitude, user_id,user_id])
                        .then(aroundResult => {
                            connection.release();
                            if (aroundResult.length === 0) {

                                res.status(201).json({
                                    meta: {
                                        code: 201,
                                        message: "주변에 글 올린 사람이 없음"
                                    }
                                })
                            } else {

                                res.status(200).json(utils.toRes(utils.SUCCESS, {
                                    nextpage: "http://13.124.115.238:8080/contents/around/page/30",
                                    data: aroundResult
                                }))

                            }

                        })
                })
        })
    })
});




//user_id = id 글 쓰기
var upload = multer({
    storage: _storage
}).single('content_image');
router.post('/', function(req, res) {
    var user_id = req.authorizationId;
    var create_at = utils.getTimeStamp();
    var crdate = utils.getTimeDate();
    var crtime = utils.getTimeTime();
    var trimCreateAt = crdate + crtime;
    req.params.create_at = trimCreateAt;

    console.log("contents/ 글쓰기 post");
    // 동기식으로 업로드 후 쿼리 실행하는방법?
    upload(req, res, (err) => {
        var content_text = req.body.content_text;
        var share_range = req.body.share_range;
        var location_range = req.body.location_range;
        var has_image = req.body.has_image;
        var image_dir = '0';
        var lng = req.body.lng;
        var lat = req.body.lat;

        console.log(user_id, content_text, share_range, location_range, has_image, image_dir, lng, lat);

        if (has_image == 1) {
            image_dir = 'http://13.124.115.238:8080/image/' + user_id + "-" + trimCreateAt + ".png";
        }

        utils.dbConnect(res).then((connection) => {
            utils.query(connection, res,
                    `UPDATE user_posi SET lat=?,lng=? WHERE user_id =?`, [lat, lng, user_id])
                .then((updateRes) => {
                    utils.query(connection, res,
                        `INSERT INTO contents(user_id,content_text,create_at,share_range,location_range,image_dir,lng,lat) VALUES (?, ?, ?, ?, ?, ?,?,?)`, [user_id, content_text, create_at, share_range, location_range, image_dir,lng,lat]).then((insertRes) => {
                        connection.release()
                        return res.status(200).json(utils.toRes(utils.SUCCESS, {
                            update: updateRes,
                            insert: insertRes
                        }))
                    })
                })
        })
    });
});

//글삭제
router.delete('/:content_id', (req, res) => {
    var content_id = req.params.content_id;
    var user_id = req.authorizationId;


    console.log("contents/ delete 글삭제 user_id = " + user_id);

    utils.dbConnect(res).then((connection) => {
        utils.query(connection, res, `DELETE FROM contents WHERE content_id = ? AND user_id = ?`, [content_id, user_id])
            .then((result) => {
                connection.release();
                res.status(200).json(utils.toRes(utils.SUCCESS, {
                    data: result
                }));

            })
    })
})
//좋아요 누르기 /취소
router.post('/like', (req, res) => {
    var user_id = req.authorizationId;
    var content_id = req.body.content_id;
    var is_like = req.body.is_like;
console.log("contents/like "+ user_id + "의 " + content_id + "좋아요 누르기 /취소");
    utils.dbConnect(res).then((conn) => {
        if (is_like == 0) {
            utils.query(conn, res, `INSERT INTO content_like(user_id,content_id,is_like) VALUES(?,?,1)`, [user_id, content_id])
                .then((insertRes) => {
                    utils.query(conn, res, `UPDATE contents SET like_cnt = like_cnt + 1 WHERE content_id = ?`, [content_id])
                        .then((updateRes) => {
                            conn.release();
                            res.json(utils.toRes(utils.SUCCESS, {
                                is_like: 1,
                                update: updateRes
                            }))
                        })
                });

        } else {
            utils.query(conn, res, `DELETE FROM content_like WHERE user_id = ? && content_id = ?`, [user_id, content_id])
                .then((deleteRes) => {
                    utils.query(conn, res, `UPDATE contents SET like_cnt = like_cnt - 1 WHERE content_id = ?`, [content_id])
                        .then((updateRes) => {
                            conn.release();
                            res.json(utils.toRes(utils.SUCCESS, {
                                is_like: 0,
                                update: updateRes
                            }))
                        });
                })
        }
    })
});

//리플 등록
router.post('/:contentId/reply', (req, res) => {
    let user_id = req.authorizationId;
    let content_id = req.params.contentId;
    let reply = req.body.reply;

    if (reply === undefined || reply.trim() === "") {
        return res.status(400).json(utils.INVALID_REQUEST);
    }
    console.log("contents/reply 리플등록 userid = "+user_id +"content Id = "+ content_id);



    utils.dbConnect(res).then((conn) => {
        utils.query(conn, res, `INSERT INTO content_reply(content_id,user_id,reply) VALUES(?,?,?)`, [content_id, user_id, reply])
            .then((insertRes) => {
                utils.query(conn,res,`UPDATE contents SET reply_cnt = reply_cnt + 1 WHERE content_id =?`,[content_id]).then((updateRes)=>{
                  conn.release();
                  res.status(200).json(utils.SUCCESS);
                })

            })
    })

})
//댓글 보기
router.get('/:contentId/reply', (req, res) => {
    let content_id = req.params.contentId;
    //let user_id =  authorizationId;
    console.log("contents/reply 리플 보기 contentid = " + content_id);
    utils.dbConnect(res).then((conn) => {
        utils.query(conn, res, `SELECT cr.*, u.user_name, u.profile_dir
      FROM content_reply cr
      LEFT OUTER JOIN user_info u
      ON u.user_id = cr.user_id
      WHERE cr.content_id = ?
      ORDER BY create_at DESC`, [content_id])
            .then((result) => {
                conn.release();
                res.json(utils.toRes(utils.SUCCESS, {
                    data: result
                }))
            })
    })
})

//리플 삭제
router.delete('/:replyId/reply', (req, res) => {
    let reply_id = req.params.replyId;
    let user_id = req.authorizationId;


    console.log("contents/reply reply id = "+ reply_id+ "user_id = "+user_id);

    utils.dbConnect(res).then((conn) => {


        utils.query(conn, res,`UPDATE contents SET reply_cnt = (reply_cnt-1) WHERE content_id = (SELECT content_id FROM content_reply WHERE reply_id = ? )`,[reply_id]).then((result) => {
	console.log(`reply_id = `+ reply_id + `댓글 수정합니다`)
              utils.query(conn,res,`DELETE FROM content_reply WHERE user_id = ? AND reply_id = ?`, [user_id, reply_id]).then((updateRes)=>{
                conn.release();
                res.json(utils.toRes(utils.SUCCESS,{
			data : updateRes
		}));
              })
            })
    })
})

//댓글 수정
router.put('/:contentId/reply', (req, res) => {
    let content_id = req.params.contentId;
    let user_id = req.authorizationId;
    let reply = req.body.reply;

    if (reply === undefined || reply.trim() === "") {
        return res.status(400).json(utils.INVALID_REQUEST);
    }

    if (140 < stringLength(reply.trim()) || stringLength(reply.trim()) < 1) {
        return res.status(400).json(utils.INVALID_REQUEST);
    }

    utils.dbConnect(res).then((conn) => {
        utils.query(conn, res, `UPDATE content_reply SET reply = ? WHERE content_id = ?, user_id = ?`, [reply, content_id, user_id])
            .then((result) => {
                conn.release();
                res.json(utils.SUCCESS);
            })
    })
})


module.exports = router;



// //글 수정
// router.put('/:contents_id', (req, res) => {
//     var user_id = req.authorizationId
//     var contents_id = req.params.contents_id;
//     var contents_text = req.body.contents_text;
//     var share_range = req.body.share_range;
//     var location_range = req.body.location_range;
//     var update_date = utils.getTimeStamp();
//     req.params.create_at = update_date;
//     var sql = 'UPDATE contents SET contents_text = ?, share_range = ?, location_range = ?, update_date = ?' +
//         'WHERE contents_id = ?';
//
//     conn.query(sql, [contents_text, share_range, location_range, update_date, contents_id], (err, row) => {
//         if (err) {
//             console.log(err);
//         } else {
//             res.status(200).send('success');
//         }
//     })
// })
