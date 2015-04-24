var prompt = require('prompt');
var say = require('say');


function prompter(twilio, opts) {

  var twilio = twilio;
  var mode = "console";
  var delimiter = '----------------------';
  var currentString = "";

  var voice = opts.voice || "Alex";
  if(opts.mode) {
    mode = opts.mode;
  }

  if(opts.delimiter) {
    delimiter = opts.delimiter;
  }

  this.outputPrompt = function(response) {
    if(mode == "spoken") {
      speakPrompt();
    } else if(mode == "twilio") {
      twiMLPrompt(response);
    } else {
      writeOutPrompt();
    }
  }


  function twiMLPrompt(response) {
    var resp = new twilio.TwimlResponse();
    resp.gather({ timeout:10, numDigits:1, finishOnKey: "" }, function() {
      this.say(currentString);
    });
    response.writeHead(200, {'Content-Type': 'text/xml'});
    response.end(resp.toString());
  }

  function speakPrompt() {
    say.stop();
    say.speak(voice, currentString);
  }

  function writeOutPrompt() {
    // process.stdout.write('\u001B[2J\u001B[0;0f');
    console.log(delimiter);
    console.log(currentString);
  }


  this.appendPause =function() {
    if(mode == "spoken" || mode == "twilio") {
      currentString += ". ";
    } else {
      currentString += "----------------\n";
    }
  }
  this.appendString = function(str) {
    currentString += str + "\n";
    if(mode == "spoken" || mode == "twilio") {
      currentString += ",";
    }
  }

  this.resetString = function() {
    currentString = "";
  }

  this.end = function(response) {
    var resp = new twilio.TwimlResponse();
    resp.say("thank you for this experience");
    resp.hangup();
    response.writeHead(200, {'Content-Type': 'text/xml'});
    response.end(resp.toString());
  }

}

module.exports = prompter;