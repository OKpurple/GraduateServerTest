var express = require('express');
var app = express();

var contents = require('./routes/contents.js');
var location = require('./routes/location.js');
app.use('/', location);
app.use('/contents',contents);


app.get('/', (req,res)=>{

res.send("jwh Server")

})


app.listen(8080, function(){
  console.log('Connected 8080 port!');
});
