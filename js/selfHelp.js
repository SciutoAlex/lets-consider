
var wordNet = require('wordnet-magic');
var wn = wordNet();
var Menu = require('terminal-menu');
var util =  require('util');
var prompt = require('prompt');
var interface = require('./interfacer.js');
var natural = require('natural');
var nounInflector = new natural.NounInflector();
var StateTracker = require('./stateTracker.js');
var fs = require('fs');
var _ = require('lodash');
 
// no callback, fire and forget 

var promptDisplay = new interface({delimiter : "##############", mode:"spoken"});


var data = fs.readFileSync("synset-meta.json");
var tree = JSON.parse(data);


var stateTracker = new StateTracker();


var chunks = {
  noun : [
    ['physical entity.n.1',"if it is a Physical Object"],
    ['group.n.1',"if it is a Group of Things or People"],
    ['causal agent.n.1',"if it is A Thing that Acts on Other Things"],
    ['psychological feature.n.1',"if it has to do with the mind"],
    ['human action.n.1',"if it is a human action"],
    ['living thing.n.1',"if it is a living thing"],
    ['state.n.2',"if it is a state of being or situation"],
    ['abstract entity.n.1',"An abstract idea"],
    ['event.n.1',"An event which occurs"],
    ['whole.n.2',"A thing that exists"]
  ]
}



stateTracker.stepForward({
  synsetid : "Start Menu",
  label : "start"
});

initialQuestion();



function initialQuestion() {
  promptDisplay.appendString("Welcome back to the self-help phone line. Today, let's get to the bottom of what is giving you anxiety at the moment. Listen carefully to the options and let's begin.");
  for (var i = 0; i < chunks.noun.length; i++) {
    var word = chunks.noun[i][0];
    var string = chunks.noun[i][1];
    promptDisplay.appendString("enter " + i + " " + string);
  }; 
  promptDisplay.outputPrompt();

  prompt.start();
  prompt.get(['choice'], function (err, result) {
  wn.fetchSynset(chunks.noun[result.choice][0], function(err, synset){

      stateTracker.stepForward({
        synsetid : synset.synsetid,
        label : chunks.noun[result.choice][1]
      });
      askQuestion(chunks.noun[result.choice][1], synset.synsetid);
    });
  });
}


function askQuestion(wordString, synsetid) {


  promptDisplay.resetString();
  // promptDisplay.appendString(stateTracker.returnStateList(true));
  var indexCount = 0;
  var synsetMetaData = _.find(tree, {id : synsetid});

  var count = 0;
  var options = synsetMetaData.synsets;

  options.sort(function(a,b) { return b.count - a.count; });
      
  // promptDisplay.appendString(nounInflector.pluralize(createLabel(synsetMetaData,1)) + ' stink. Exactly which kind of ' + nounInflector.pluralize(createLabel(synsetMetaData,1)) + ' are bothering you?');
  promptDisplay.appendString(genericSentence(nounInflector.pluralize(createLabel(synsetMetaData,1))))
  displayOptions();

  function displayOptions() {

      var optionsToShow = options.length - indexCount + 1;
      
      // promptDisplay.appendString("total options: " + options.length);
      // promptDisplay.appendString("current index: " + indexCount);

      var availableOpts = [];
      var totalOptions = 9;
      if(optionsToShow >= totalOptions) {
        optionsToShow = totalOptions;
      }

      for (var i = 0; i < optionsToShow-1; i++) {
        availableOpts.push(i+1 + "");
        promptDisplay.appendString(i+1 + ' for ' + createLabel(options[indexCount + i]));
      };

      promptDisplay.appendPause();
      if(indexCount - optionsToShow >= 0) {
        availableOpts.push("*");
        promptDisplay.appendString('star to hear previous options for ' + createLabel(synsetMetaData) + '.');
      }
      if(indexCount + optionsToShow + 1 < options.length) {
        availableOpts.push("#");
        promptDisplay.appendString('pound sign to hear more options for ' + createLabel(synsetMetaData) + '.');
      }

      if(stateTracker.getPrevious()) {
        availableOpts.push("0");
        promptDisplay.appendString('0 to return to ' + stateTracker.getPrevious().label + '.');
      }

      promptDisplay.appendPause();
      availableOpts.push("9");
      promptDisplay.appendString('9 if ' + createLabel(synsetMetaData) + ' is what is annoying you today.');


      promptDisplay.outputPrompt();
      prompt.start();
      prompt.get(['choice'], function (err, result) {
        if(availableOpts.indexOf(result.choice) === -1) {
          promptDisplay.resetString();
          promptDisplay.appendString("whoops that's not an available option");
          displayOptions();
        } else {
          switch (result.choice) {
            case "1" : 
              directQuestion(1);
            break;
            case "2" : 
              directQuestion(2);
            break;
            case "3" : 
              directQuestion(3);
            break;
            case "4" : 
              directQuestion(4);
            break;
            case "5" : 
              directQuestion(5);
            break;
            case "6" : 
              directQuestion(6);
            break;
            case "7" : 
              directQuestion(7);
            break;
            case "8" : 
              directQuestion(8);
            break;
            case "*" : 
              indexCount -= totalOptions;
              promptDisplay.resetString();
              promptDisplay.appendString('okay here are previous options for ' + createLabel(synsetMetaData));
              displayOptions();
            break;
            case "9" : 
              successfulSynset(stateTracker.getCurrent())
            break;
            case "#" : 
              indexCount += totalOptions;
              promptDisplay.resetString();
              promptDisplay.appendString('okay here are more options for ' + createLabel(synsetMetaData));
              displayOptions();
            break;
            case "0" : 
              var previous = stateTracker.stepBack();
              if(previous.label === "start") {
                initialQuestion();
              } else {
                askQuestion(previous.label, previous.synsetid);
              }
            break;
          }
        }

        function directQuestion(index) {
          index--;
          if(options[indexCount + index].count == 0) {
            successfulSynset(options[indexCount + index]);
          } else {
            stateTracker.stepForward({
              synsetid : options[indexCount + index].id,
              label : options[indexCount + index].label
            });
            askQuestion(options[indexCount + index].label, options[indexCount + index].id);
            
          }
        }

      });
  }

}

function returnLabel(synset) {

}



function successfulSynset(synset) {
  promptDisplay.resetString();
  var id = synset.synsetid || synset.id;

  synset = _.find(tree, {id : id});

  if(synset.label.length < 2) {
    
    success(synset, createLabel(synset));
  } else {
    promptDisplay.appendString("Ah! I think we are getting close to your anxiety. Let's find out what exact kind of " + createLabel(synset, 1) + " is bothering you.");

    var availableOptions = [];
    for (var i = 0; i < synset.label.length; i++) {
      promptDisplay.appendString(i + 1 + " for " + synset.label[i]);
      availableOptions.push(i+1+"");
    }

    promptDisplay.appendString("if this is entirely wrong, enter 0 to go back.");
      availableOptions.push(0+"");

    promptDisplay.outputPrompt();
    prompt.get(['choice'], function (err, result) {
      for (var i = 1; i <= synset.label.length; i++) {
        if(result.choice == i) {
          success(synset, synset.label[i-1]);
        }
      };
      if(result.choice == "0") {
        askQuestion(createLabel(synset), synset.id);
      }
    });


  }
}
function success(synset, label) {
  promptDisplay.resetString();
  promptDisplay.appendString("I think we have finally gotten to the bottom of your problem. I believe that " + nounInflector.pluralize(label) + " are causing you anxiety today. Do you think I'm correct?");

  var availableOpts = [1,2,3];

  promptDisplay.appendPause();
  promptDisplay.appendString("Enter one if you agree with my analysis.");
  promptDisplay.appendString("Enter two if you'd like to return to " + createLabel(synset));
  promptDisplay.outputPrompt();
  prompt.get(['choice'], function (err, result) {
      switch (result.choice) {
        case "1" : 
          promptDisplay.resetString();
          promptDisplay.appendString("Wonderful. " + nounInflector.pluralize(label) + " it is. Let's talk again tomorrow.");
          promptDisplay.outputPrompt();
        break;
        case "2" : 
          askQuestion(createLabel(synset), synset.id);
        break;
        default:
          success(synset, label);
        break;
      }
    });

}

function createLabel(synsetMeta, num) {
  console.log("create label synset");
  console.log(synsetMeta.label);
  var number = num || 2;
  var returnString = [];
  var labels = synsetMeta.label;

  if(labels.length == 0) {
    return "no label";
  }
  if(labels.length == 1) {
    return labels[0];
  }

  if(number === 1) {
    return labels[0];
  } else if (number === 2) {
    return labels[0] + " or " + labels[1];
  } else {
    var str = "";
    for (var i = 0; i < labels.length - 1; i++) {
      str += labels[i] + ", ";
    };
    str += ", or " + labels[labels.length-1];
    return str;
  }
  
}


  function genericSentence(string) {
    var sentences = [
      "You mentioned last time that *** can be demanding. Would you care to elaborate on what exact *** are so demanding?",
      "Do you really think you would react so violently to ***? Tell me more about what kind of *** makes you react.",
      "Tell me, how *** bothers you specifically?",
      "You feel that *** is not right. Tell me more about why *** is not right.",
      "Do you feel like you've been hurt by ***? What genre of *** hurt you?",
      "You mentioned before you enjoyed ***. What exactly has changed?",
    ];

    var ourSentence = sentences[Math.floor(Math.random()*sentences.length)];
    return ourSentence.replace(/\*\*\*/g, string);
  }









