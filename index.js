var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var phonetree = require('./phone-tree.js');
var _ = require('lodash');
var areaCodes = require('./areacodes.js');
var moment = require('moment');
var natural = require('natural');
var nounInflector = new natural.NounInflector();


if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}



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
    for (var i = items.length - 1; i >= 0; i--) {
      var item = items[i];
      item = JSON.parse(item);
      if(item.steps && item.steps.length > 3) {
        data.push(processPhoneData(item));
      }
    }
    response.render('home-2.ejs', {data : data});
  });
  
});




app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});


function processPhoneData(data) {
  var objToReturn = {};
  if(data.phoneNumber) {
    objToReturn.areaCode = data.phoneNumber;
  } else {
    objToReturn.areaCode = null;
  }

  objToReturn.day = moment(data.startTime).format('dddd, MMMM Do');
  objToReturn.startTime = moment(data.startTime).format('h:mm a');
  objToReturn.endTime = moment(data.endTime).format('h:mm a');



  var state = _.find(areaCodes, {areaCode : objToReturn.areaCode});
  if(state) {
    objToReturn.state = state.state;
    objToReturn.cities = state.cities;
  }
  
  objToReturn.finalWord = _.find(data.steps, {type : "success"});
  objToReturn.feeling = _.find(data.steps, {type : "feeling"});
  var synsets = _.filter(data.steps, {type: "synset"});
  if(_.filter(data.steps, {type: "word"})[0]){
    synsets.push(_.filter(data.steps, {type: "word"})[0]);
  }
  objToReturn.wordTrail = [];
  objToReturn.startingWord = nounInflector.pluralize(synsets.shift().word);
  synsets.forEach(function(synset) {
    objToReturn.wordTrail.push(nounInflector.pluralize(synset.word));
  });

  if(!objToReturn.finalWord) {
    objToReturn.finalWord = nounInflector.pluralize(synsets[synsets.length-1].word);
    objToReturn.wordTrail.pop();
  } else {
    objToReturn.finalWord = nounInflector.pluralize(objToReturn.finalWord.word);
  }
  if(!objToReturn.feeling) {
    objToReturn.feeling = "neutral";
  } else {
    objToReturn.feeling = objToReturn.feeling.value;
  }

  if(objToReturn.finalWord === objToReturn.wordTrail[objToReturn.wordTrail.length-1]) {
    objToReturn.wordTrail.pop();
  }

  return objToReturn;
}










