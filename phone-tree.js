var Dialogue = require('./dialogue.js');
var fs = require('fs');
var _ = require('lodash');
var moment = require('moment');
 

var data = fs.readFileSync("synset-meta.json");
var tree = JSON.parse(data);

// Twilio Credentials 
var accountSid = process.env.TWILIO_ID; 
var authToken = process.env.TWILIO_TOKEN; 
 
//require the Twilio module and create a REST client 
var twilio = require('twilio')
var client = twilio(accountSid, authToken); 

// function phoneTree(app) {
//   app.post('/phone', function(request, response) {
//     console.log(request.body);
//     var resp = new twilio.TwimlResponse();
//     resp.gather({ timeout:10, numDigits:1 }, function() {
//       this.say('For sales, press 1. For support, press 2.');
//     });
//     response.writeHead(200, {'Content-Type': 'text/xml'});
//     response.end(resp.toString());
//   });

// }

var callList = [];

function phoneTree(app) {
  app.post('/phone', function(request, response) {
    var thisCallMetaData = request.body;
    var thisCall = _.find(callList, {id : thisCallMetaData.CallSid});
    if(typeof thisCall == "undefined") {
      var dialogue = new Dialogue(twilio, response);
      callList.push({
        dialogue : dialogue,
        id : thisCallMetaData.CallSid,
        lastUpdate : moment()
      });
    } else {
      thisCall.lastUpdate = moment();
      thisCall.dialogue.update(response, thisCallMetaData.Digits)
    }
  });
}


module.exports = phoneTree;


