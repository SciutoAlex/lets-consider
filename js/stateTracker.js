function StateTracker() {
  var states = [];
  var currentState = 0;

  this.returnStateList = function(string) {
    if(string) {
      var str = "";
      states.map(function(state) { str += state.label + "-> "; });
      // str += " |||| " + currentState + "  / " + states.length;
      return str;
    }
    
    return states;
  }
  this.stepForward = function(synset) {
    currentState++;
    if(!states[currentState]) {
      states.push(synset); 
    } else {
      states[currentState-1] = synset;
    }     
  }

  this.stepBack = function() {
    currentState--;
    return states[currentState-1];
  };

  this.getCurrent = function() {
    var returnState = null;
    var currentIndex = currentState-1;
    if(states[currentIndex]) {
      returnState = states[currentIndex];
    }
    return returnState;
  };

  this.getPrevious = function() {
    var returnState = null;
    var previousIndex = currentState-2;
    if(states[previousIndex]) {
      returnState = states[previousIndex];
    }
    return returnState;
  };
}

module.exports = StateTracker;