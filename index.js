var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var phonetree = require('./phone-tree.js');
var _ = require('lodash');


if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}


 // redis.lrange('calls', 0, -1, function (error, items) {
 //    var data = [];
 //    if (error) throw error
 //    items.forEach(function (item) {
 //      console.log(JSON.parse(item));
 //    });
 //  });

app.set('view engine', 'ejs');  
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


phonetree(app, redis);

app.get('/', function(request, response) {

  redis.lrange('calls', 0, -1, function (error, items) {
    var data = [];
    if (error) throw error
    items.forEach(function (item) {
      item = JSON.parse(item);
      data.push(processPhoneData(item));
    });
    response.render('home.ejs', {data : data});
  });
  
});




app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});


function processPhoneData(data) {
  var objToReturn = {};
  if(data.phoneNumber) {
    objToReturn.areaCode = data.phoneNumber.substr(2,3);
  } else {
    objToReturn.areaCode = null;
  }
  
  objToReturn.finalWord = _.find(data.steps, {type : "success"}).word;
  objToReturn.feeling = _.find(data.steps, {type : "feeling"}).value;
  var synsets = _.filter(data.steps, {type: "synset"});
  synsets.push(_.filter(data.steps, {type: "word"})[0]);
  console.log(synsets);
  objToReturn.wordTrail = [];
  synsets.forEach(function(synset) {
    objToReturn.wordTrail.push(synset.word);
  });

  return objToReturn;
}



