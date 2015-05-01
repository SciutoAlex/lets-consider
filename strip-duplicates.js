var _ = require('lodash');
var fs = require('fs');

var initialData = fs.readFileSync('synset-meta.json');
initialData = JSON.parse(initialData);

var bingData = fs.readFileSync('bing-data.json');
bingData = JSON.parse(bingData);

var newData = {};

for (var i = initialData.length - 1; i >= 0; i--) {
  console.log(i);
  var synset = initialData[i];
  if(!newData[synset.id]) {
    newData[synset.id] = synset;
  }
};

newData = _.values(newData);

for (var i = newData.length - 1; i >= 0; i--) {
  console.log('hi');
  var thisSynset = newData[i];
  if(thisSynset.synsets) {
    for (var j = thisSynset.synsets.length - 1; j >= 0; j--) {
      var thisSubSynset = thisSynset.synsets[j];
      var maxReturn = 0;
      for (var k = thisSubSynset.label.length - 1; k >= 0; k--) {
        var thisLabel = thisSubSynset.label[k];
        if(bingData[thisLabel] && maxReturn < bingData[thisLabel]) {
          maxReturn = bingData[thisLabel];
        }
      }
      thisSubSynset.bingCount = maxReturn;
    };
  }
};


fs.writeFile('bing-results-no-dupes.json', JSON.stringify(newData , null, 4));

