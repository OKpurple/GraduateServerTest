var express = require('express');
var app = express();

var contents = require('./routes/contents.js');


app.use('/contents',contents);
app.use('/user', express.static('files'));

app.get('/uploadPage',(req,res)=>{
var output = `
<form method="post" action="contents/upload/1">
<input type="file" name="contents_image">
<input type="submit">
</form>
`

})
app.get('/',(req,res)=>{

  var output = `
<html>
<body>
   <form method="post" action="contents/1">
      <h1>내용</h1>
       <input type="text" name = 'content_text'>
       <h1>공개범위</h1>
       <input type="text" name = 'share_range'>
       <h1>위치범위</h1>
       <input type="number" name = 'location_range'>
       <h1></h1>
       <input type="file" name="contents_image">
       <input type="submit">
   </form>
</body>
</html>
   `;
   res.send(output);

})


app.listen(8080, function(){
  console.log('Connected 8080 port!');
});
