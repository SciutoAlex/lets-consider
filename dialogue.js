var interfacer = require('./interfacer.js');
var natural = require('natural');
var nounInflector = new natural.NounInflector();
var StateTracker = require('./stateTracker.js');
var fs = require('fs');
var _ = require('lodash');


var data = fs.readFileSync('synset-meta.json');
var tree = JSON.parse(data);




var chunks = {
  simpleNoun : [
    ['entity.n.1', 'to Explore more complex ideas.', 100001740],
    ['person.n.1', 'if you are thinking about A person or human.', 100007846],
    ['human action.n.1', 'if you are thinking about a human act, action, or activity.', 100030657],
    ['organism.n.1', 'if you are thinking about a living organism such as an animal.', 100004475],
    ['substance.n.7', 'if you are thinking about a physical substances such spaghetti, rawhide, or einsteinium.', 100020270],
    ['feeling.n.1', 'if you are thinking about a feeling or emotion such as hope, complacency, or passion.', 100026390],
    ['artifact.n.1','if you are thinking about human-made objects such as a fishnet, a violin, or a pair of trousers.', 100022119],
    ['','if you are thinking about a location such as a piazza, a playground, or a breadbasket', 100027365],
    ['','if you are thinking about a communication between two people such as an opera, a recipe, or a chortle', 100027365],
    ['','if you are thinking about organic processes such as foreplay, farting, or evolution, ', 113547313],
  ],
  noun : [
    ['physical entity.n.1','if it is a Physical Object', 100001930],
    ['group.n.1','if it is a Group of Things or People', 100031563], 
    ['causal agent.n.1','if it is A Thing that Acts on Other Things', 100007347],
    ['psychological feature.n.1','if it has to do with the mind', 100023280],
    ['human action.n.1','if it is a human action', 100030657],
    ['living thing.n.1','if it is a living thing', 100004258],
    ['state.n.2','if it is a state of being or situation', 100024900], 
    ['event.n.1','An event which occurs', 100029677],
    ['whole.n.2','A thing that exists', 100003553]
  ]
}



function dialogue(twilio, redis, response, phoneCallMeta) {

  var redisClient = redis;
  var offset = 0;
  var maxOptions = 9;
  var backSymbol = '*';
  var backSymbolSpoke = 'star';
  var nextSymbol = '#';
  var nextSymbolSpoke = 'pound sign';
  var availableOpts = [];
  var steps = [];
  var promptDisplay = new interfacer(twilio, {delimiter : '##############', mode:'twilio'});
  var response;
  var currentSynsetData;
  var previousSynsetData;
  var currentStepData;
  var previousStepData;
  var lpushVal = "";
  var lpushVal = redisClient.rpush("calls", "{}", function(e,i) {
    lpushVal = i-1;
  });


  var currentChoices = {};
  initialQuestion();


  function initialQuestion() {
    promptDisplay.appendString('What\'s on your mind? Take a moment and listen to your thoughts.');
    promptDisplay.appendPause(3);
    promptDisplay.appendString('Okay. Now, Listen to the options, and let\'s explore what you are thinking about.');
    promptDisplay.appendPause(1);
    currentStepData = {
      type : 'start', 
      data : ''
    };

    steps.push(currentStepData);
    for (var i = 1; i < chunks.simpleNoun.length; i++) {
      var word = chunks.simpleNoun[i][0];
      var string = chunks.simpleNoun[i][1];
      promptDisplay.appendString('enter ' + i + ', ' + string);
      promptDisplay.appendPause(1);
      availableOpts.push('' + i);
    }; 

    var word = chunks.simpleNoun[0][0];
    var string = chunks.simpleNoun[0][1];
    promptDisplay.appendString('enter ' + 0 + ', ' + string);
    availableOpts.push('' + 0);
    promptDisplay.appendPause(1);
    promptDisplay.appendString('enter star to hear these options again.');
    availableOpts.push('*');

    promptDisplay.outputPrompt(response);
  }

  this.update = function(r, digit) {
    response = r;
    promptDisplay.resetString();
    switch(currentStepData.type) {
      case 'start':
        if(isOpt(digit)) {
          if(digit == '*') {
            initialQuestion(response);
          } else {
            var id = chunks.simpleNoun[digit][2];
            newSynset(id);
          }
        } else {
          promptDisplay.appendString('Oops that\'s an incorrect entry. Let\'s try again?');
          initialQuestion(response);
        }
      break;

      case 'synset':
        if(isOpt(digit)) {
          processSynsetOpts(digit);
        } else {
          promptDisplay.appendString('Oops that\'s an incorrect entry. Let\'s try again?');
          displaySynsetOptions();
        }
      break;

      case 'word':
        if(isOpt(digit)) {
          processSuccessfulSynsetOptions(digit);
        } else {
          promptDisplay.appendString('Oops that\'s an incorrect entry. Let\'s try again?');
          displaySuccessfulSynsetOptions();
        }
      break;

      case 'success':
        if(isOpt(digit)) {
          processSuccessfulWordOptions(digit);
        } else {
          promptDisplay.appendString('Oops that\'s an incorrect entry. Let\'s try again?');
          displaySuccessfulWordOptions();
        }
      break;
    }
    
  }

  function isOpt(digit) {
    return availableOpts.indexOf(digit) !== -1;
  }


  function newSynset(synsetid) {
    console.log(steps);
    steps.push({
      type: 'synset',
      synsetid: synsetid,
      word: createLabel(_.find(tree, {id : synsetid}), 2)
    });
    console.log(steps);
    saveToRedis();

    currentStepData = steps[steps.length-1];
    previousStepData = steps[steps.length-2];

    previousSynsetData = _.find(tree, {id : previousStepData.synsetid});
    currentSynsetData = _.find(tree, {id : currentStepData.synsetid});

    currentSynsetData.synsets = currentSynsetData.synsets.sort(function(a,b) { return b.count - a.count;});
    
    

  
    availableOpts = [];
    offset = 0;
    promptDisplay.appendString(genericSentence(nounInflector.pluralize(createLabel(currentSynsetData,1))));
    promptDisplay.appendPause();
    displaySynsetOptions();
  }

  function processSynsetOpts(digit) {
    switch (digit) {
      case '1' : 
        directQuestion(1);
      break;
      case '2' : 
        directQuestion(2);
      break;
      case '3' : 
        directQuestion(3);
      break;
      case '4' : 
        directQuestion(4);
      break;
      case '5' : 
        directQuestion(5);
      break;
      case '6' : 
        directQuestion(6);
      break;
      case '7' : 
        directQuestion(7);
      break;
      case '8' : 
        directQuestion(8);
      break;
      case '*' : 
        offset -= maxOptions;
        promptDisplay.appendString('okay here are previous options for ' + createLabel(currentSynsetData));
        displaySynsetOptions();
      break;
      case '9' : 
        successfulSynsetFound(currentSynsetData.id);
      break;
      case '#' : 
        offset += maxOptions;
        promptDisplay.appendString('okay here are more options for ' + createLabel(currentSynsetData));
        displaySynsetOptions();
      break;
      case '0' : 
        if(previousStepData.type === 'start') {
          steps = [];
          initialQuestion();

        } else {
          steps.pop();
          var poppedSynset = steps.pop();
          newSynset(poppedSynset.synsetid);
        }
      break;
    }

    function directQuestion(index) {
      index--;
      var potentialNextSynset = currentSynsetData.synsets[offset + index];
      if(potentialNextSynset.count == 0) {
        successfulSynsetFound(potentialNextSynset.id);
      } else {
        newSynset(potentialNextSynset.id);
      }
    }

  }

 

  function displaySynsetOptions() {


      var count = 0;
      var options = currentSynsetData.synsets;
      var optionsToShow = options.length - offset + 1;

      availableOpts = [];
      var totalOptions = maxOptions;
      if(optionsToShow >= totalOptions) {
        optionsToShow = totalOptions;
      }

      for (var i = 0; i < optionsToShow-1; i++) {
        availableOpts.push(i+1 + '');
        var examples = generateExamples(options[offset + i])
        promptDisplay.appendString(i+1 + ' for ' + createLabel(options[offset + i]) + (examples ? " " : ".") + examples);
        promptDisplay.appendPause();
      }

      availableOpts.push('9');
      promptDisplay.appendString('9 if ' + createLabel(currentSynsetData) + ' is what is annoying you today.');

      if(offset - optionsToShow + 1 >= 0) {
        availableOpts.push('*');
        promptDisplay.appendString('star to hear previous options for ' + createLabel(currentSynsetData) + '.');
      }
      if(offset + optionsToShow + 1 < options.length) {
        availableOpts.push('#');
        promptDisplay.appendString('pound sign to hear more options for ' + createLabel(currentSynsetData) + '.');
      }

      availableOpts.push('0');
      if(previousStepData.type === 'start') {
        promptDisplay.appendString('0 to return to the start.');
      } else if (previousStepData.type === 'synset') {
        promptDisplay.appendString('Zero to hear return to ' + createLabel(previousSynsetData) + '.');
      }
      
    

      promptDisplay.outputPrompt(response);
    }



  function successfulSynsetFound(synsetid) {
    availableOpts = [];
    steps.push({
      type: 'word',
      id: synsetid,
      word: createLabel(_.find(tree, {id : synsetid}), 2)
    });
    saveToRedis();

    previousStepData = steps[steps.length-2];
    currentStepData = steps[steps.length-1];
    previousSynsetData = currentSynsetData;
    currentSynsetData = _.find(tree, {id : synsetid});

    console.log(currentSynsetData.label.length);
    if(currentSynsetData.label.length === 1) {
      successfulWordFound(currentSynsetData.label[0]);
    } else {
      displaySuccessfulSynsetOptions();
    }
  }

  



  function displaySuccessfulSynsetOptions() {
    promptDisplay.appendString('I hope your thoughts have grown more precise through this process. We are almost at the end. Tell me, what kind of ' + createLabel(currentSynsetData, 1) + ' you are thinking about.');
    promptDisplay.appendPause();
    var totalOpts = maxOptions;
    if(currentSynsetData.label.length < maxOptions) {
      totalOpts = currentSynsetData.label.length;
    }
    for (var i = 0; i < totalOpts; i++) {
      promptDisplay.appendString(i + 1 + ' for ' + currentSynsetData.label[i]);
      availableOpts.push(i+1+'');
    }

    promptDisplay.appendString('Zero to return to ' + createLabel(currentSynsetData, 2));
    availableOpts.push(0+'');

    promptDisplay.outputPrompt(response);
  }

  function processSuccessfulSynsetOptions(digit) {
    if((digit > 0) && (digit < 10)) {
      successfulWordFound(currentSynsetData.label[digit-1]);
    } else if (digit === "0") {
      steps.pop();
      var poppedSynset = steps.pop();
      newSynset(poppedSynset.synsetid); 
    }
  }

  function successfulWordFound(word) {
    console.log('running successfulWordFound');
    availableOpts = [];
    steps.push({
      type: 'success',
      word: word
    });
    saveToRedis();

    previousStepData = steps[steps.length-2];
    currentStepData = steps[steps.length-1];

    displaySuccessfulWordOptions();
  }

  function displaySuccessfulWordOptions() {
    var word = currentStepData.word;
    availableOpts = ['1','2','3','0'];
    promptDisplay.appendString(nounInflector.pluralize(word) + ' are a worthwhile thing to think about. As you think about ' + nounInflector.pluralize(word) + ' how do you feel?');
    promptDisplay.appendPause();
    promptDisplay.appendString('Enter one if this word gives you a positive or warm feeling.');
    promptDisplay.appendString('Enter two if this word gives you a negative or cold feeling.');
    promptDisplay.appendString('Enter three if this word gives you a neutral feeling.');
    promptDisplay.appendString('Enter zero if you\'d like to return to ' + createLabel(previousSynsetData));
    promptDisplay.outputPrompt(response);
  }

  function processSuccessfulWordOptions(digit) {
    switch(digit) {
      case '1':
        success('positive');
      break;
      case '2':
        success('negative');
      break;
      case '3':
        success('neutral');
      break;
      case '0':
        steps.pop();
        steps.pop();
        var poppedSynset = steps.pop();
        newSynset(poppedSynset.synsetid);
      break;
    }
  }

  function success(feeling) {
    steps.push({
      type:"feeling",
      value: feeling
    });

    saveToRedis();

    promptDisplay.end(response);
    
  }

  function saveToRedis() {
    var string = JSON.stringify({
      id : phoneCallMeta.CallSid,
      steps : steps,
      phoneNumber : phoneCallMeta.Caller
    });
    redisClient.lset("calls", lpushVal, string);
  }





    function genericSentence(string) {
      var psychSentences = [
        'You mentioned last time that *** can be demanding. Would you care to elaborate on what exact *** are so demanding?',
        'Do you really think you would react so violently to ***? Tell me more about what kind of *** makes you react.',
        'Tell me, how *** bothers you specifically?',
        'You feel that *** does not sit well with you. Tell me more about why *** is not right.',
        'Do you feel like you have been hurt by ***? What genre of *** hurt you?',
        'You mentioned before you enjoyed ***. What exactly has changed?',
        'You feel you have a problem with ***. Explain'
      ];

      var neutralSentences = [
        'Lets think about *** for a moment. ... What kinds of *** are you thinking about now?',
        'There are many kinds of ***. ... What types of *** are on your mind?',
        'A range of *** may be considered. ... What types of *** are you considering?',
      ];

      var sentences = neutralSentences;

      var ourSentence = sentences[Math.floor(Math.random()*sentences.length)];
      return ourSentence.replace(/\*\*\*/g, string);
    }

}

function generateExamples(synset) {
  
  var results = [];
  var currentSynset = _.find(tree, {id : synset.id});
  var currentSynsetLabels = currentSynset.label;
  var labelsToCheckAgainst = _.clone(currentSynsetLabels);
  for (var i = 10 - 1; i >= 0; i--) {
    var finished = false;
    currentSynset = _.find(tree, {id : synset.id});
    currentSynsetLabels = currentSynset.label;
    
    while(!finished) {
      currentSynset = _.find(tree, {id : currentSynset.id});
      var childSynsets = currentSynset.synsets;
      var nextSynset = _.sample(childSynsets);
      if(!nextSynset) {
        finished = true;
        var label = _.sample(currentSynset.label);
        var minDist = 0;
        for (var j = labelsToCheckAgainst.length - 1; j >= 0; j--) {
          var tempDist = natural.JaroWinklerDistance(labelsToCheckAgainst[j], label);
          if(tempDist > minDist) { minDist = tempDist; }
        };
        if(minDist < .8) {
          results.push(label);
          labelsToCheckAgainst.push(label);

        }
      } else {
        currentSynset = nextSynset;
      }
    }
  }

  results.sort(function(a,b) {
    a.length - b.length;
  });

  if(results.length == 0) {
    return "";
  } else if (results.length == 1) {
    return "such as " + results[0];
  } else if (results.length == 2) {
    return "such as " + results[0] + " or " + results[1];;
  } else if (results.length >= 3) {
    return "such as " + results[0] + ', ' + results[1] + ', or ' + results[2];
  }
}

function createLabel(synsetMeta, num) {
  var number = num || 2;
  var returnString = [];
  var labels = synsetMeta.label;

  if(labels.length == 0) {
    return 'no label';
  }
  if(labels.length == 1) {
    return labels[0];
  }

  if(number === 1) {
    return labels[0];
  } else if (number === 2) {
    return labels[0] + ' or ' + labels[1];
  } else {
    var str = '';
    for (var i = 0; i < labels.length - 1; i++) {
      str += labels[i] + ', ';
    };
    str += ', or ' + labels[labels.length-1];
    return str;
  }  
}



module.exports = dialogue;









