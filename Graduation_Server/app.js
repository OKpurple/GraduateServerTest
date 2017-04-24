var express = require('express');
var app = express();
var bodyParser = require('body-parser');

var users = require('./routes/users.js')
var multer = require('multer');
var authMiddleware = require('./middlewares/auth.js');

const TOKEN_KEY = "jwhtoken"


app.use(bodyParser.urlencoded({ extended: false }))

app.use('/users',authMiddleware);
app.use('/users',users);

app.use('/contents',authMiddleware);
var contents = require('./routes/contents.js');
app.use('/contents',contents);

app.use('/image', express.static('files/images'));
app.use('/profile',express.static('files/profile'));




app.listen(8080, function(){
  console.log('Connected 8080 port!');
});
