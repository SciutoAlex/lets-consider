function prompter(twilio, opts) {

  var twilio = twilio;
  var currentStrings = [];

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
      var bufferString = "";
      for(var i = 0; i < currentStrings.length; i++) {
        if(currentStrings[i].type === "pause") {
          console.log("pause");
          this.pause({length : currentStrings[i].pauseLength});
        } else {
          bufferString += currentStrings[i].string + ". ";
          if(!currentStrings[i+1] || currentStrings[i+1].type !=="spoken") {
            console.log(bufferString);
            this.say(bufferString, {
              voice:'man',
              language:'en-US'
            });
            bufferString = "";
          }
          
        }
      }
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


  this.appendPause =function(n) {
    var length = n || 1;
    currentStrings.push({
      type: "pause",
      pauseLength : length
    });
  };

  this.appendString = function(str) {
    currentStrings.push({
        type: "spoken",
        string : str
      });
  }

  this.resetString = function() {
    currentStrings = [];
  }

  this.end = function(response, word) {
    var resp =new twilio.TwimlResponse();
    resp.say('Thank you for this experience. All of your thoughts are meaningful in their own special way, particularly your thoughts about ' + word +'. I\'m glad we were able to share this moment together.');
    resp.hangup();
    response.writeHead(200, {'Content-Type': 'text/xml'});
    response.end(resp.toString());
  }

}

module.exports = prompter;