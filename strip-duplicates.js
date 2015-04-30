var _ = require('lodash');
var fs = require('fs');

var initialData = fs.readFileSync('synset-meta.json');
initialData = JSON.parse(initialData);

var newData = {};

for (var i = initialData.length - 1; i >= 0; i--) {
  console.log(i);
  var synset = initialData[i];
  if(!newData[synset.id]) {
    newData[synset.id] = synset;
  }
};

fs.writeFile('synset-meta-no-duplicates.json', JSON.stringify(_.values(newData), null, 4));

