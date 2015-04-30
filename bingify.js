var cheerio = require('cheerio');
var fs = require('fs');
var request = require('request');
console.log('loadsynsets');
var initialData = fs.readFileSync('synset-meta-no-duplicates.json');
initialData = JSON.parse(initialData);
var _ = require('lodash');


var counter = 0;
var maxLength = 0 || initialData.length;

console.log('loadBing');
var cachedBingQueries = JSON.parse(fs.readFileSync('bing-data.json'));
var totalWords = _.size(cachedBingQueries);
console.log('total words already saved: ' + totalWords)

var urlCreator = function(label) {
  return "http://www.bing.com/search?q=" + encodeURIComponent(label);
};


var nextItem = function() {
  fs.writeFile('bing-data.json', JSON.stringify(cachedBingQueries, null, 4));
  if(counter < maxLength) {
    processSynset();
  } else {
    console.log('done')
  }
  counter++;
};


var processSynset = function() {
  var timeout = 500;
  var thisSynset = initialData[counter];
  for (var i = thisSynset.label.length - 1; i >= 0; i--) {
    var thisLabel = thisSynset.label[i];
    if(!cachedBingQueries[thisLabel]) {
      addData(thisLabel);
    } else {
      console.log('#' + _.size(cachedBingQueries) + ' ' + thisLabel + ' already queried');
      timeout = 0;
    }
  };
  setTimeout(nextItem, timeout);
};

var addData = function(label) {
  var url = urlCreator(label);
  
  request(url, function (error, response, body) {
    console.log('#' + _.size(cachedBingQueries) + ' ' + label + ' queried');
    if(error) {
      console.log(error);
      setTimeout(nextItem, (Math.random() * 40 + 10) * 1000);
    }
    if (!error && response.statusCode == 200) {
      var $ = cheerio.load(body);
      var rawVal = $('.sb_count').html();
      if(rawVal === null) {
        console.log('**********NO VALUE FOR ' + label);
      } else {
        var count = rawVal.replace(/\,/g,'').replace(' results', '');
        if(count == "NaN") {
          count = 0;
        }
        totalWords++;
        cachedBingQueries[label] = count / 1000;
      }
      
    }
  });
};

nextItem();




