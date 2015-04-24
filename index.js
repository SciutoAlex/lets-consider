var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var phonetree = require('./phone-tree.js');






app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function(request, response) {
  response.send('Hello World!');
});

phonetree(app);




app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});



