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
    ['substance.n.7', 'if you are thinking about a physical substance such as foods, materials, or chemicals.', 100020270],
    ['organism.n.1', 'if you are thinking about a living organism such as a person or animal.', 100004475],
    ['feeling.n.1', 'if you are thinking about a feeling or emotion.', 100026390],
    ['artifact.n.1','if you are thinking about A human-made object.', 100022119],
    ['abstract entity.n.1','if you are thinking about An abstract idea or concept.', 100002137],
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



function dialogue(twilio, response) {

  var offset = 0;
  var maxOptions = 7;
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


  var currentChoices = {};
  initialQuestion();


  function initialQuestion() {
    promptDisplay.appendString('What\'s on your mind.');
    promptDisplay.appendPause();
    promptDisplay.appendString('Listen to the options, and let\'s explore your thoughts.');
    
    currentStepData = {
      type : 'start', 
      data : ''
    };

    steps.push(currentStepData);
    for (var i = 1; i < chunks.simpleNoun.length-1; i++) {
      var word = chunks.simpleNoun[i][0];
      var string = chunks.simpleNoun[i][1];
      promptDisplay.appendString('enter ' + i + ', ' + string);
      availableOpts.push('' + i);
    }; 

    var word = chunks.simpleNoun[0][0];
    var string = chunks.simpleNoun[0][1];
    promptDisplay.appendString('enter ' + 0 + ', ' + string);
    availableOpts.push('' + 0);
    promptDisplay.outputPrompt(response);
  }

  this.update = function(r, digit) {
    response = r;
    promptDisplay.resetString();
    console.log(currentStepData.type);
    switch(currentStepData.type) {
      case 'start':
        if(isOpt(digit)) {
          var id = chunks.simpleNoun[digit][2];
          newSynset(id);
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
    
    steps.push({
      type: 'synset',
      synsetid: synsetid,
      word: createLabel(_.find(tree, {id : synsetid}), 1)
    });

    currentStepData = steps[steps.length-1];
    previousStepData = steps[steps.length-2];

    previousSynsetData = _.find(tree, {id : previousStepData.synsetid});
    currentSynsetData = _.find(tree, {id : currentStepData.synsetid});

    currentSynsetData.synsets = currentSynsetData.synsets.sort(function(a,b) { return b.count - a.count;});
    
    

    

    availableOpts = [];
    offset = 0;
    promptDisplay.appendString(genericSentence(nounInflector.pluralize(createLabel(currentSynsetData,1))));
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

      var totalOptions = 9;
      if(optionsToShow >= totalOptions) {
        optionsToShow = totalOptions;
      }

      for (var i = 0; i < optionsToShow-1; i++) {
        availableOpts.push(i+1 + '');
        promptDisplay.appendString(i+1 + ' for ' + createLabel(options[offset + i]));
        console.log(createLabel(options[offset + i]));
      }

      promptDisplay.appendPause();
      if(offset - optionsToShow >= 0) {
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
      
      

      promptDisplay.appendPause();
      availableOpts.push('9');
      promptDisplay.appendString('9 if ' + createLabel(currentSynsetData) + ' is what is annoying you today.');
      promptDisplay.outputPrompt(response);
    }



  function successfulSynsetFound(synsetid) {
    availableOpts = [];
    steps.push({
      type: 'word',
      id: synsetid,
      word: createLabel(_.find(tree, {id : synsetid}), 1)
    });

    previousStepData = steps[steps.length-2];
    currentStepData = steps[steps.length-1];
    previousSynsetData = currentSynsetData;
    currentSynsetData = _.find(tree, {id : synsetid});

    console.log(currentSynsetData);
    console.log(currentSynsetData.label.length);
    if(currentSynsetData.label.length === 1) {
      console.log('word found');
      successfulWordFound(currentSynsetData.label[0]);
    } else {
      console.log('synonyms found');
      displaySuccessfulSynsetOptions();
    }
  }

  function displaySuccessfulSynsetOptions() {
    promptDisplay.appendString('Ah! I think we are getting close to your anxiety. Let\'s find out what exact kind of ' + createLabel(currentSynsetData, 1) + ' is bothering you.');
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
      console.log(poppedSynset);
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

    previousStepData = steps[steps.length-2];
    currentStepData = steps[steps.length-1];

    displaySuccessfulWordOptions();
  }

  function displaySuccessfulWordOptions() {
    console.log('running displaySuccessfulWordOptions');
    var word = currentStepData.word;
    availableOpts = ['1','2','3','0'];
    promptDisplay.appendString('I think we have finally gotten to the bottom of your problem. I believe that ' + nounInflector.pluralize(word) + ' are causing you anxiety today. Do you think I\'m correct?');
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
    console.log(steps);
    console.log(feeling);
    promptDisplay.end(response);
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

    function responseTracker() {
      var opts = {};
      this.clearOpts = function() {
        opts = {};
      }

      this.addOpt = function(digit, event) {
        opts[digit] = event;
      }

      this.getOpts = function() {
        return opts;
      }

      this.getOpt = function(digit) {
        return opts[digit];
      }
    }
}




module.exports = dialogue;









