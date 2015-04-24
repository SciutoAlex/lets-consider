var prompt = require('prompt');
var say = require('say');

function prompter(opts) {
  var spoken = false;
  var delimiter = '----------------------';
  var currentString = "";

  var voice = opts.voice || "Alex";
  if(opts.mode == "spoken") {
    spoken = true;
  }

  if(opts.delimiter) {
    delimiter = opts.delimiter;
  }

  this.outputPrompt = function() {
    if(spoken) {
      speakPrompt();
    } else {
      writeOutPrompt();
    }
  }



  function speakPrompt() {
    say.stop();
    say.speak(voice, currentString);
  }

  function writeOutPrompt() {
    process.stdout.write('\u001B[2J\u001B[0;0f');
    console.log(delimiter);
    console.log(currentString);
  }


  this.appendPause =function() {
    if(spoken) {
      currentString += ". ";
    } else {
      currentString += "----------------\n";
    }
  }
  this.appendString = function(str) {
    currentString += str + "\n";
    if(spoken) {
      currentString += ",";
    }
  }

  this.resetString = function() {
    currentString = "";
  }

}

module.exports = prompter;