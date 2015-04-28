var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var phonetree = require('./phone-tree.js');
var _ = require('lodash');


if (process.env.REDISTOGO_URL) {
  var rtg   = require("url").parse(process.env.REDISTOGO_URL);
  var redis = require("redis").createClient(rtg.port, rtg.hostname);
  redis.auth(rtg.auth.split(":")[1]);
} else {
  var redis = require("redis").createClient();
}



app.set('view engine', 'ejs');  
app.set('port', (process.env.PORT || 5000));
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));


phonetree(app, redis);



app.get('/', function(request, response) {

  redis.lrange('calls', 0, -1, function (error, items) {
    var data = [];
    if (error) throw error
    for (var i = items.length - 1; i >= 0; i--) {
      var item = items[i];
      item = JSON.parse(item);
      if(item.steps) {
        data.push(processPhoneData(item));
      }
    }
    response.render('home.ejs', {data : data});
  });
  
});




app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'));
});


function processPhoneData(data) {
  var objToReturn = {};
  if(data.phoneNumber) {
    objToReturn.areaCode = data.phoneNumber.substr(2,3);
  } else {
    objToReturn.areaCode = null;
  }



  var state = _.find(areaCodes, {areaCode : objToReturn.areaCode});
  if(state) {
    objToReturn.state = state.state;
    objToReturn.cities = state.cities;
  }
  
  objToReturn.finalWord = _.find(data.steps, {type : "success"});
  objToReturn.feeling = _.find(data.steps, {type : "feeling"});
  var synsets = _.filter(data.steps, {type: "synset"});
  if(_.filter(data.steps, {type: "word"})[0]){
    synsets.push(_.filter(data.steps, {type: "word"})[0]);
  }
  objToReturn.wordTrail = [];
  synsets.forEach(function(synset) {
    objToReturn.wordTrail.push(synset.word);
  });

  if(!objToReturn.finalWord) {
    objToReturn.finalWord = synsets[synsets.length-1].word;
    objToReturn.wordTrail.pop();
  } else {
    objToReturn.finalWord = objToReturn.finalWord.word;
  }
  if(!objToReturn.feeling) {
    objToReturn.feeling = "neutral";
  } else {
    objToReturn.feeling = objToReturn.feeling.value;
  }

  if(objToReturn.finalWord === objToReturn.wordTrail[objToReturn.wordTrail.length-1]) {
    objToReturn.wordTrail.pop();
  }

  return objToReturn;
}






var areaCodes = [
{"areaCode" : "201", "state" : "New Jersey", "cities" : "Hackensack, Jersey City, Union City, Rutherford, Leonia"},
{"areaCode" : "202", "state" : "District of Columbia", "cities" : "Washington, District of Columbia"},
{"areaCode" : "203", "state" : "Connecticut", "cities" : "Bridgeport, New Haven, Stamford, Waterbury, Norwalk, Danbury, Greenwich"},
{"areaCode" : "205", "state" : "Alabama", "cities" : "Birmingham, Huntsville, Tuscaloosa, Anniston"},
{"areaCode" : "206", "state" : "Washington", "cities" : "Seattle, Everett"},
{"areaCode" : "207", "state" : "Maine", "cities" : "Maine: All regions"},
{"areaCode" : "208", "state" : "Idaho", "cities" : "Idaho: All regions"},
{"areaCode" : "209", "state" : "California", "cities" : "Stockton, Modesto, Merced, Oakdale"},
{"areaCode" : "210", "state" : "Texas", "cities" : "San Antonio"},
{"areaCode" : "212", "state" : "New York", "cities" : "New York City (Manhattan only)"},
{"areaCode" : "213", "state" : "California", "cities" : "Los Angeles, Compton"},
{"areaCode" : "214", "state" : "Texas", "cities" : "Dallas"},
{"areaCode" : "215", "state" : "Pennsylvania", "cities" : "Philadelphia, Lansdale, Doylestown, Newtown, Quakertown"},
{"areaCode" : "216", "state" : "Ohio", "cities" : "Cleveland, Terrace, Independence, Montrose"},
{"areaCode" : "217", "state" : "Illinois", "cities" : "Springfield, Champaign Urbana, Decatur, Central Illinois"},
{"areaCode" : "218", "state" : "Minnesota", "cities" : "Duluth, Virginia, Moorhead, Brainerd, Wadena"},
{"areaCode" : "219", "state" : "Indiana", "cities" : "Gary, Hammond, Merrillville, Portage, Michigan City, Valparaiso"},
{"areaCode" : "224", "state" : "Illinois", "cities" : "Overlay of 847 area code (Chicago)"},
{"areaCode" : "225", "state" : "Louisiana", "cities" : "Baton Rouge and Surrounding Areas"},
{"areaCode" : "228", "state" : "Mississippi", "cities" : "Gulfport, Biloxi, Pascagoula, Bay St. Louis"},
{"areaCode" : "229", "state" : "Georgia", "cities" : "Albany, Valdosta, Thomasville, Bainbridge, Tifton, Americus, Moultrie, Cordele"},
{"areaCode" : "231", "state" : "Michigan", "cities" : "Muskegon, Traverse City, Big Rapids, Cadillac, Cheboygan"},
{"areaCode" : "234", "state" : "Ohio", "cities" : "Overlay of 330 Area Code"},
{"areaCode" : "239", "state" : "Florida", "cities" : "Ft. Myers, Naples, Cape Coral, Bonita Springs, Immokalee, Lehigh Acres, Sanibel, Captiva, Pine Island"},
{"areaCode" : "240", "state" : "Maryland", "cities" : "Overlay of 301 Area Code (Maryland)"},
{"areaCode" : "248", "state" : "Michigan", "cities" : "Troy, Pontiac, Royal Oak, Birmingham, Rochester, Farmington Hills"},
{"areaCode" : "251", "state" : "Alabama", "cities" : "Mobile, Prichard, Tillmans Corner, Fairhope, Jackson, Gulfshores"},
{"areaCode" : "252", "state" : "North Carolina", "cities" : "Greenville, Rocky Mount, Wilson, New Bern"},
{"areaCode" : "253", "state" : "Washington", "cities" : "Tacoma, Kent, Auburn"},
{"areaCode" : "254", "state" : "Texas", "cities" : "Waco, Killeen, Temple"},
{"areaCode" : "256", "state" : "Alabama", "cities" : "Huntsville, Anniston, Decatur, Gadsden, Florence"},
{"areaCode" : "260", "state" : "Indiana", "cities" : "Fort Wayne, Huntington, Wabash, Lagrange"},
{"areaCode" : "262", "state" : "Wisconsin", "cities" : "Green Bay, Appleton, Racine, Kenosha, Oshkosh, Waukesha, Menomonee Falls, West Bend, Sheboygan"},
{"areaCode" : "267", "state" : "Pennsylvania", "cities" : "Overlay of 215 Area Code (Philadelphia Area)"},
{"areaCode" : "269", "state" : "Michigan", "cities" : "Kalamazoo, Battle Creek, St. Joseph, Three Rivers, South Haven, Benton Harbor, Sturgis, Hastings"},
{"areaCode" : "270", "state" : "Kentucky", "cities" : "Bowling Green, Paducah, Owensboro, Hopkinsville"},
{"areaCode" : "272", "state" : "Pennsylvania", "cities" : "Overlay of 570 Area Code."},
{"areaCode" : "276", "state" : "Virginia", "cities" : "Martinsville, Abingdon, Wytheville, Bristol, Marion, Collinsville"},
{"areaCode" : "281", "state" : "Texas", "cities" : "Houston, Sugar Land, Buffalo, Airline, Greenspoint, Spring"},
{"areaCode" : "301", "state" : "Maryland", "cities" : "Rockville, Silver Spring, Bethesda, Gaithersburg, Frederick, Laurel, Hagerstown"},
{"areaCode" : "302", "state" : "Delaware", "cities" : "Delaware: All regions"},
{"areaCode" : "303", "state" : "Colorado", "cities" : "Denver, Littleton, Englewood, Arvada, Boulder, Aurora"},
{"areaCode" : "304", "state" : "West Virginia", "cities" : "West Virginia: All regions"},
{"areaCode" : "305", "state" : "Florida", "cities" : "Miami, Perrine, Homestead, Florida Keys"},
{"areaCode" : "307", "state" : "Wyoming", "cities" : "Wyoming: All regions"},
{"areaCode" : "308", "state" : "Nebraska", "cities" : "Grand Island, Kearney, North Platte, Scottsbluff"},
{"areaCode" : "309", "state" : "Illinois", "cities" : "Peoria, Bloomington, Rock Island, Galesburg, Macomb"},
{"areaCode" : "310", "state" : "California", "cities" : "Compton, Santa Monica, Beverly Hills, West LA, Inglewood, Redondo, El Segundo, Culver City, Torrance"},
{"areaCode" : "312", "state" : "Illinois", "cities" : "Chicago (Downtown area), Wheeling"},
{"areaCode" : "313", "state" : "Michigan", "cities" : "Detroit, Livonia, Dearborn"},
{"areaCode" : "314", "state" : "Missouri", "cities" : "Saint Louis, Ladue, Kirkwood, Creve Coeur, Overland, Ferguson"},
{"areaCode" : "315", "state" : "New York", "cities" : "Syracuse, Utica, Watertown, Rome"},
{"areaCode" : "316", "state" : "Kansas", "cities" : "Wichita, Hutchinson"},
{"areaCode" : "317", "state" : "Indiana", "cities" : "Indianapolis, Carmel, Fishers, Greenwood"},
{"areaCode" : "318", "state" : "Louisiana", "cities" : "Shreveport, Monroe, Alexandria, Ruston, Natchitoches"},
{"areaCode" : "319", "state" : "Iowa", "cities" : "Cedar Rapids, Iowa City, Waterloo, Burlington"},
{"areaCode" : "320", "state" : "Minnesota", "cities" : "St. Cloud, Alexandria, Willmar, Little Falls"},
{"areaCode" : "321", "state" : "Florida", "cities" : "Brevard County (Cocoa, Melbourne, Eau Gallie, Titusville), Overlay of most of 407 Area Code."},
{"areaCode" : "323", "state" : "California", "cities" : "Los Angeles, Montebello"},
{"areaCode" : "325", "state" : "Texas", "cities" : "Albilene, San Angelo, Brownwood, Synder, Swee"},
{"areaCode" : "330", "state" : "Ohio", "cities" : "Akron, Youngstown, Canton, Warren, Kent, Alliance, Medina, New Philadelphia"},
{"areaCode" : "331", "state" : "Illinois", "cities" : "Overlay of the 630 area code."},
{"areaCode" : "334", "state" : "Alabama", "cities" : "Montgomery, Dothan, Auburn, Selma, Opelika, Phenix City, Tuskegee"},
{"areaCode" : "336", "state" : "North Carolina", "cities" : "Greensboro, Winston Salem, Highpoint, Burlington, Lexington, Asheboro, Reidsville"},
{"areaCode" : "337", "state" : "Louisiana", "cities" : "Lake Charles, Lafayette, New Iberia, Leesville, Opelousas, Crowley"},
{"areaCode" : "339", "state" : "Massachusetts", "cities" : "Overlay of 781 area code."},
{"areaCode" : "346", "state" : "Texas", "cities" : "Overlay of 713, 281 and 832 area codes (Houston)."},
{"areaCode" : "347", "state" : "New York", "cities" : "Overlay of 718 Area Code (Bronx, Brooklyn, Queens, Staten Island)."},
{"areaCode" : "351", "state" : "Massachusetts", "cities" : "Overlay of 978 area code."},
{"areaCode" : "352", "state" : "Florida", "cities" : "Gainesville, Ocala, Leesburg, Brookville"},
{"areaCode" : "360", "state" : "Washington", "cities" : "Vancouver, Olympia, Bellingham, Silverdale"},
{"areaCode" : "361", "state" : "Texas", "cities" : "Corpus Christi, Victoria"},
{"areaCode" : "364", "state" : "Kentucky", "cities" : "Overlay of 270 Area Code."},
{"areaCode" : "385", "state" : "Utah", "cities" : "Overlay of 801 Area Code."},
{"areaCode" : "386", "state" : "Florida", "cities" : "Daytona, Deland, Lake City, DeBary, Orange City, New Smyrna Beach, Palatka, Palm Coast"},
{"areaCode" : "401", "state" : "Rhode Island", "cities" : "Rhode Island: All regions"},
{"areaCode" : "402", "state" : "Nebraska", "cities" : "Lincoln, Omaha, Norfolk, Columbus"},
{"areaCode" : "404", "state" : "Georgia", "cities" : "Atlanta"},
{"areaCode" : "405", "state" : "Oklahoma", "cities" : "Oklahoma City, Norman, Stillwater, Britton, Bethany, Moore"},
{"areaCode" : "406", "state" : "Montana", "cities" : "Montana: All regions"},
{"areaCode" : "407", "state" : "Florida", "cities" : "Orlando, Winter Park, Kissimmee, Cocoa, Lake Buena Vista, Melbourne"},
{"areaCode" : "408", "state" : "California", "cities" : "San Jose, Sunnyvale, Campbell Los Gatos, Salinas, San Martin, Saratoga, Morgan Hill, Gilroy"},
{"areaCode" : "409", "state" : "Texas", "cities" : "Galveston, Beaumont, Port Arthur, Texas City, Nederland"},
{"areaCode" : "410", "state" : "Maryland", "cities" : "Baltimore, Annapolis, Towson, Catonsville, Glen Burnie"},
{"areaCode" : "412", "state" : "Pennsylvania", "cities" : "Pittsburgh"},
{"areaCode" : "413", "state" : "Massachusetts", "cities" : "Springfield, Pittsfield, Holyoke, Amherst"},
{"areaCode" : "414", "state" : "Wisconsin", "cities" : "Milwaukee, Greendale, Franklin, Cudahy, St. Francis, Brown Deer, Whitefish Bay"},
{"areaCode" : "415", "state" : "California", "cities" : "San Francisco"},
{"areaCode" : "417", "state" : "Missouri", "cities" : "Joplin, Springfield, Branson, Lebanon"},
{"areaCode" : "419", "state" : "Ohio", "cities" : "Toledo, Lima, Mansfield, Sandusky, Findlay"},
{"areaCode" : "423", "state" : "Tennessee", "cities" : "Chattanooga, Cleveland, Johnson City, Bristol, Kingsport, Athens, Morristown, Greeneville"},
{"areaCode" : "424", "state" : "California", "cities" : "Overlay of 310 Area Code"},
{"areaCode" : "425", "state" : "Washington", "cities" : "Bothell, Everett, Bellevue, Kirkland, Renton"},
{"areaCode" : "430", "state" : "Texas", "cities" : "Overlay of 903 Area Code."},
{"areaCode" : "432", "state" : "Texas", "cities" : "Midland, Terminal, Odessa, Big Spring, Alpine, Pecos, Fort Stockton"},
{"areaCode" : "434", "state" : "Virginia", "cities" : "Lynchburg, Danville, Charlottesville, Madison Heights, South Boston"},
{"areaCode" : "435", "state" : "Utah", "cities" : "Logan, St. George, Park City, Tooele, Brigham City, Richfield, Moab, Blanding"},
{"areaCode" : "440", "state" : "Ohio", "cities" : "Willoughby, Hillcrest, Trinity, Lorain, Elyria"},
{"areaCode" : "442", "state" : "California", "cities" : "Overlay of 760 area code."},
{"areaCode" : "443", "state" : "Maryland", "cities" : "Overlay of 410 Area Code"},
{"areaCode" : "456", "state" : "", "cities" : "Used for premium-rate calling"},
{"areaCode" : "458", "state" : "Oregon", "cities" : "Overlay of 541 Area Code."},
{"areaCode" : "469", "state" : "Texas", "cities" : "Overlay of 214, 972 Area Codes (Greater Dallas Area)."},
{"areaCode" : "470", "state" : "Georgia", "cities" : "Overlay of 404, 678, 770."},
{"areaCode" : "475", "state" : "Connecticut", "cities" : "Overlay of 203 area code."},
{"areaCode" : "478", "state" : "Georgia", "cities" : "Macon, Warner Robbins, Dublin, Milledgeville, Forsyth"},
{"areaCode" : "479", "state" : "Arkansas", "cities" : "Fort Smith, Fayetteville, Rogers, Bentonville, Russellville"},
{"areaCode" : "480", "state" : "Arizona", "cities" : "Mesa, Scottsdale, Tempe, Chandler, Gilbert"},
{"areaCode" : "484", "state" : "Pennsylvania", "cities" : "Overlay of 610 Area Code (Allentown, Reading, Bethlehem Area)"},
{"areaCode" : "500", "state" : "", "cities" : "Used for Personal Communications Services"},
{"areaCode" : "501", "state" : "Arkansas", "cities" : "Little Rock, Hot Springs"},
{"areaCode" : "502", "state" : "Kentucky", "cities" : "Louisville, Frankfort, Fort Knox, Pleasure Ridge Park"},
{"areaCode" : "503", "state" : "Oregon", "cities" : "Portland, Salem, Beaverton, Gresham, Hillsboro"},
{"areaCode" : "504", "state" : "Louisiana", "cities" : "New Orleans, Metairie, Kenner, Chalmette"},
{"areaCode" : "505", "state" : "New Mexico", "cities" : "New Mexico: Albuquerque, Bernalillo, Farmington, Gallup, Grants, Las Vegas, Los Alamos, Rio Rancho, Santa Fe"},
{"areaCode" : "507", "state" : "Minnesota", "cities" : "Rochester, Mankato, Winona, Faribault, Luverne"},
{"areaCode" : "508", "state" : "Massachusetts", "cities" : "Worcester, Framingham, Brockton, Plymouth, New Bedford, Marlboro, Natick, Taunton, Auburn, Westboro, Easton"},
{"areaCode" : "509", "state" : "Washington", "cities" : "Spokane, Yakima, Walla Walla, Pullman, Kenwick"},
{"areaCode" : "510", "state" : "California", "cities" : "Oakland, Fremont, Newark, Hayward, Richmond"},
{"areaCode" : "512", "state" : "Texas", "cities" : "Austin, San Marcos, Round Rock, Dripping Springs"},
{"areaCode" : "513", "state" : "Ohio", "cities" : "Cincinnati, Hamilton, Clermont, Middleton, Mason"},
{"areaCode" : "515", "state" : "Iowa", "cities" : "Des Moines, Ames, Jefferson"},
{"areaCode" : "516", "state" : "New York", "cities" : "Nassau County: Hempstead, Oceanside, Freeport, Long Beach, Garden City, Glen Cove, Mineola"},
{"areaCode" : "517", "state" : "Michigan", "cities" : "Lansing, Bay City, Jackson, Howell, Adrian"},
{"areaCode" : "518", "state" : "New York", "cities" : "Albany, Schenectady, Troy, Glens Falls, Saratoga Springs, Lake Placid"},
{"areaCode" : "520", "state" : "Arizona", "cities" : "Tucson, Sierra Vista, Nogales, Douglass, Bisbee"},
{"areaCode" : "530", "state" : "California", "cities" : "Chico, Redding, Marysville, Auburn, Davis, Placerville"},
{"areaCode" : "531", "state" : "Nebraska", "cities" : "Overlay of 402 Area Code."},
{"areaCode" : "533", "state" : "", "cities" : "Used for Personal Communications Services"},
{"areaCode" : "534", "state" : "Wisconsin", "cities" : "Overlay of 715 area code."},
{"areaCode" : "539", "state" : "Oklahoma", "cities" : "Overlay of 918 area code."},
{"areaCode" : "540", "state" : "Virginia", "cities" : "Roanoke, Harrisonburg, Fredericksburg, Blacksburg, Winchester, Staunton, Culpeper"},
{"areaCode" : "541", "state" : "Oregon", "cities" : "Eugene, Medford, Corvallis, Bend, Albany, Roseburg, Klamath Falls"},
{"areaCode" : "544", "state" : "", "cities" : "Used for Personal Communications Services"},
{"areaCode" : "551", "state" : "New Jersey", "cities" : "Overlay of 201 area code."},
{"areaCode" : "559", "state" : "California", "cities" : "Fresno, Visalia, Madera, San Joaquin, Porterville, Hanford"},
{"areaCode" : "561", "state" : "Florida", "cities" : "Palm Beaches, Boca Raton, Boynton Beach"},
{"areaCode" : "562", "state" : "California", "cities" : "Long Beach, Norwalk, Alamitos, Downey, Whittier, Lakewood, La Habra"},
{"areaCode" : "563", "state" : "Iowa", "cities" : "Davenport, Dubuque, Clinton, Muscatine, Decorah, Manchester, West Union"},
{"areaCode" : "566", "state" : "", "cities" : "Used for Personal Communications Services"},
{"areaCode" : "567", "state" : "Ohio", "cities" : "Overlay of 419 area code."},
{"areaCode" : "570", "state" : "Pennsylvania", "cities" : "Wilkes-Barre, Scranton, Stroudsburg, Williamsport, Pittston"},
{"areaCode" : "571", "state" : "Virginia", "cities" : "Overlay of 703 area code."},
{"areaCode" : "573", "state" : "Missouri", "cities" : "Columbia, Cape Girardeau, Jefferson City"},
{"areaCode" : "574", "state" : "Indiana", "cities" : "South Bend, Elkhart, Mishawaka, Granger, La Porte"},
{"areaCode" : "575", "state" : "New Mexico", "cities" : "Split of 505 area code. Alamogordo, Carlsbad, Clovis, Deming, El Rito, Galina, Hatch, Hobbs, Las Cruces, Penasco, Raton, Taos"},
{"areaCode" : "580", "state" : "Oklahoma", "cities" : "Lawton, Enid, Ponca City, Ardmore, Duncan"},
{"areaCode" : "585", "state" : "New York", "cities" : "Rochester, East Rochester, Olean, Batavia, Webster, Fairport, Henrietta"},
{"areaCode" : "586", "state" : "Michigan", "cities" : "Warren, Mount Clemens, Roseville, Center Line, Utica, Romeo, Richmond, Washington, New Baltimore"},
{"areaCode" : "601", "state" : "Mississippi", "cities" : "Southern Mississippi: Jackson, Hattiesburg, Vicksburg, Meridian"},
{"areaCode" : "602", "state" : "Arizona", "cities" : "Phoenix"},
{"areaCode" : "603", "state" : "New Hampshire", "cities" : "New Hampshire: All regions"},
{"areaCode" : "605", "state" : "South Dakota", "cities" : "South Dakota: All regions"},
{"areaCode" : "606", "state" : "Kentucky", "cities" : "Ashland, Winchester, Pikeville, Somerset"},
{"areaCode" : "607", "state" : "New York", "cities" : "Elmira, Ithaca, Stamford, Binghamton, Endicott, Oneonta"},
{"areaCode" : "608", "state" : "Wisconsin", "cities" : "Madison, La Crosse, Janesville, Middleton, Monroe, Platteville, Dodgeville"},
{"areaCode" : "609", "state" : "New Jersey", "cities" : "Atlantic City, Trenton, Princeton, Pleasantville, Fort Dix, Lawrenceville"},
{"areaCode" : "610", "state" : "Pennsylvania", "cities" : "Allentown, Reading, Bethlehem, West Chester, Pottstown"},
{"areaCode" : "611", "state" : "", "cities" : "Used for telephone repair service in many Areas"},
{"areaCode" : "612", "state" : "Minnesota", "cities" : "Minneapolis, Richfield"},
{"areaCode" : "614", "state" : "Ohio", "cities" : "Columbus, Worthington, Dublin, Reynoldsburg, Westerville, Gahanna, Hilliard"},
{"areaCode" : "615", "state" : "Tennessee", "cities" : "Nashville, Mufreesboro, Hendersonville, Frank"},
{"areaCode" : "616", "state" : "Michigan", "cities" : "Grand Rapids, Holland, Grand Haven, Greenville, Zeeland, Ionia"},
{"areaCode" : "617", "state" : "Massachusetts", "cities" : "Boston, Cambridge, Quincy, Newton, Brookline, Brighton, Somerville, Dorchester, Hyde Park, Jamaica Plain"},
{"areaCode" : "618", "state" : "Illinois", "cities" : "Collinsville, Alton, Carbondale, Belleville, Mount Vernon, Centralia"},
{"areaCode" : "619", "state" : "California", "cities" : "San Diego, Chula Vista, El Cajon, La Mesa, National City, Coronado"},
{"areaCode" : "620", "state" : "Kansas", "cities" : "Hutchinson, Emporia, Liberal, Pittsburg, Dodge City, Garden City, Coffeyville"},
{"areaCode" : "623", "state" : "Arizona", "cities" : "Glendale, Sun City, Peoria"},
{"areaCode" : "626", "state" : "California", "cities" : "Pasadena, Alhambra, Covina, El Monte, La Puenta"},
{"areaCode" : "630", "state" : "Illinois", "cities" : "La Grange, Roselle, Hinsdale, Downers Grove, Naperville, Lombard, Elmhurst, Aurora, Wheaton"},
{"areaCode" : "631", "state" : "New York", "cities" : "Suffolk County: Brentwood, Farmingdale, Central Islip, Riverhead, Huntington, Deer Park, Amityville, Lindenhurst"},
{"areaCode" : "636", "state" : "Missouri", "cities" : "St. Charles, Fenton, Harvester, Chesterfield, Manchester"},
{"areaCode" : "641", "state" : "Iowa", "cities" : "Fairfield, Mason City, Grinnell, Newton, Knoxville"},
{"areaCode" : "646", "state" : "New York", "cities" : "Overlay of 212 Area Code (New York City)."},
{"areaCode" : "650", "state" : "California", "cities" : "South San Francisco, Palo Alto, San Mateo, Mountain View, Redwood City"},
{"areaCode" : "651", "state" : "Minnesota", "cities" : "St. Paul, Redwing, Farmington, Eagan, Lino Lakes, North Branch, Roseville Valley"},
{"areaCode" : "657", "state" : "California", "cities" : "Overlay of 714 area code."},
{"areaCode" : "660", "state" : "Missouri", "cities" : "Warrensburg, Kirksville, Sedalia, Chillicothe, Moberly, Marshall"},
{"areaCode" : "661", "state" : "California", "cities" : "Bakersfield, Santa Clarita, Palmdale, Simi Valley"},
{"areaCode" : "662", "state" : "Mississippi", "cities" : "Northern Mississippi: Tupelo, Columbus, Greenwood, Greenville, Oxford"},
{"areaCode" : "667", "state" : "Maryland", "cities" : "Overlay of 410, 443 area codes"},
{"areaCode" : "669", "state" : "California", "cities" : "Overlay of 408 area code (San Jose, San Jose, Sunnyvale, etc.)"},
{"areaCode" : "678", "state" : "Georgia", "cities" : "Overlay of 404 & 770 area codes."},
{"areaCode" : "681", "state" : "West Virginia", "cities" : "Overlay of 304 Area Code."},
{"areaCode" : "682", "state" : "Texas", "cities" : "Overlay of 817 area code."},
{"areaCode" : "700", "state" : "", "cities" : "Used for Value Added Special Services, per individual Carrier."},
{"areaCode" : "701", "state" : "North Dakota", "cities" : "North Dakota: All regions"},
{"areaCode" : "702", "state" : "Nevada", "cities" : "Las Vegas & Surrounding Areas."},
{"areaCode" : "703", "state" : "Virginia", "cities" : "Arlington, Alexandria, Fairfax, Falls Church, Quantico, Herndon, Vienna"},
{"areaCode" : "704", "state" : "North Carolina", "cities" : "Charlotte, Asheville, Gastonia, Concord, Statesville, Salisbury, Shelby, Monroe"},
{"areaCode" : "706", "state" : "Georgia", "cities" : "Augusta, Columbus, Athens, Rome, Dalton"},
{"areaCode" : "707", "state" : "California", "cities" : "Eureka, Napa, Santa Rosa, Petaluma, Vallejo"},
{"areaCode" : "708", "state" : "Illinois", "cities" : "Oak Brook, Calumet City, Harvey (South suburbs of Chicago)"},
{"areaCode" : "710", "state" : "", "cities" : "Federal Government Special Services"},
{"areaCode" : "712", "state" : "Iowa", "cities" : "Sioux City, Council Bluffs, Spencer, Cherokee, Denison"},
{"areaCode" : "713", "state" : "Texas", "cities" : "Houston"},
{"areaCode" : "714", "state" : "California", "cities" : "Anaheim, Santa Anna"},
{"areaCode" : "715", "state" : "Wisconsin", "cities" : "Eau Claire, Wausau, Stevens Point, Superior"},
{"areaCode" : "716", "state" : "New York", "cities" : "Buffalo, Niagara Falls, Tonawanda, Williamsville, Jamestown, Lancaster"},
{"areaCode" : "717", "state" : "Pennsylvania", "cities" : "Harrisburg, York, Lancaster"},
{"areaCode" : "718", "state" : "New York", "cities" : "New York City (Bronx, Brooklyn, Queens, Staten Island)"},
{"areaCode" : "719", "state" : "Colorado", "cities" : "Colorado Springs, Pueblo, Lamar"},
{"areaCode" : "720", "state" : "Colorado", "cities" : "Overlay of 303 area code."},
{"areaCode" : "724", "state" : "Pennsylvania", "cities" : "Greensburg, Uniontown, Butler, Washington, New Castle, Indiana"},
{"areaCode" : "725", "state" : "Nevada", "cities" : "Overlay of 702 area code"},
{"areaCode" : "727", "state" : "Florida", "cities" : "Clearwater, St. Petersburg, New Port Richey, Tarpon Springs"},
{"areaCode" : "731", "state" : "Tennessee", "cities" : "Jackson, Dyersburg, Union City, Paris, Brownsville"},
{"areaCode" : "732", "state" : "New Jersey", "cities" : "New Brunswick, Metuchen, Rahway, Perth Amboy, Toms River, Bound Brook"},
{"areaCode" : "734", "state" : "Michigan", "cities" : "Ann Arbor, Livonia, Wayne, Wyandotte, Ypsilanti, Plymouth, Monroe"},
{"areaCode" : "737", "state" : "Texas", "cities" : "Overlay of 512 area code"},
{"areaCode" : "740", "state" : "Ohio", "cities" : "Portsmouth, Newark, Zanesville, Wheeling, Steubenville"},
{"areaCode" : "747", "state" : "California", "cities" : "Overlay of 818 Area Code."},
{"areaCode" : "754", "state" : "Florida", "cities" : "Overlay of 954 Area Code (Ft. Lauderdale Area)."},
{"areaCode" : "757", "state" : "Virginia", "cities" : "Norfolk, Newport News, Williamsburgh"},
{"areaCode" : "760", "state" : "California", "cities" : "Oceanside, Palm Springs, Victorville, Escondido, Vista, Palm Desert"},
{"areaCode" : "762", "state" : "Georgia", "cities" : "Overlay of 706 Area Code."},
{"areaCode" : "763", "state" : "Minnesota", "cities" : "Brooklyn Park, Coon Rapids, Maple Grove, Plymouth, Cambridge, Blaine, Anoka"},
{"areaCode" : "765", "state" : "Indiana", "cities" : "Lafayette, Muncie, Kokomo, Anderson, Richmond, Marion"},
{"areaCode" : "769", "state" : "Mississippi", "cities" : "Overlay of 601 area code (Southern Mississippi)."},
{"areaCode" : "770", "state" : "Georgia", "cities" : "Norcross, Chamblee, Smyrna, Tucker, Marietta, Alpharetta, Gainesville"},
{"areaCode" : "772", "state" : "Florida", "cities" : "Vero Beach, Port St. Lucie, Stuart, Fort Pierce, Sebastian, Hobe Sound, Jensen Beach, Indiantown"},
{"areaCode" : "773", "state" : "Illinois", "cities" : "Chicago (except downtown Area is 312)"},
{"areaCode" : "774", "state" : "Massachusetts", "cities" : "Overlay of 508 area code."},
{"areaCode" : "775", "state" : "Nevada", "cities" : "Reno, Carson City"},
{"areaCode" : "779", "state" : "Illinois", "cities" : "Overlay of 815 area code."},
{"areaCode" : "781", "state" : "Massachusetts", "cities" : "Waltham, Lexington, Burlinton, Dedham, Woburn, Lynn, Malden, Saugus, Reading, Braintree, Wellesley"},
{"areaCode" : "785", "state" : "Kansas", "cities" : "Topeka, Lawrence, Manhattan, Salina, Junction"},
{"areaCode" : "786", "state" : "Florida", "cities" : "Overlay of 305 area code (Miami)."},
{"areaCode" : "800", "state" : "", "cities" : "Toll Free"},
{"areaCode" : "801", "state" : "Utah", "cities" : "Utah: Salt Lake City, Provo, Ogden, Orem, American Fork, Spanish Fork, Bountiful, Kaysville, Morgan"},
{"areaCode" : "802", "state" : "Vermont", "cities" : "Vermont: All regions"},
{"areaCode" : "803", "state" : "South Carolina", "cities" : "Columbia"},
{"areaCode" : "804", "state" : "Virginia", "cities" : "Richmond, Lynchburg, Petersburg,"},
{"areaCode" : "805", "state" : "California", "cities" : "Santa Barbara, Thousand Oaks, San Luis Obispo, Ventura, Oxnard, Simi Valley"},
{"areaCode" : "806", "state" : "Texas", "cities" : "Amarillo, Lubbock"},
{"areaCode" : "808", "state" : "Hawaii", "cities" : "Hawaii: All regions"},
{"areaCode" : "809", "state" : "", "cities" : "Dominican Republic"},
{"areaCode" : "810", "state" : "Michigan", "cities" : "Flint, Port Huron, Lapeer, Brighton, Sandusky"},
{"areaCode" : "812", "state" : "Indiana", "cities" : "Evansville, Bloomington, Terre Haute, New Albany"},
{"areaCode" : "813", "state" : "Florida", "cities" : "Tampa"},
{"areaCode" : "814", "state" : "Pennsylvania", "cities" : "Altoona, Johnstown, Erie, Punxsutawney"},
{"areaCode" : "815", "state" : "Illinois", "cities" : "La Salle, Joliet, Rockford, DeKalb"},
{"areaCode" : "816", "state" : "Missouri", "cities" : "Kansas City, Saint Joseph, Independence, Gladstone"},
{"areaCode" : "817", "state" : "Texas", "cities" : "Fort Worth, Arlington, Euless, Grapevine"},
{"areaCode" : "818", "state" : "California", "cities" : "Van Nuys, Canoga Park, Burbank, San Fernando, Glendale, N. Hollywood"},
{"areaCode" : "828", "state" : "North Carolina", "cities" : "Asheville, Hickory, Morganton, Hendersonville, Lenoir, Boone, Andrews, Murphy, Marble"},
{"areaCode" : "830", "state" : "Texas", "cities" : "New Braunfels, Del Rio, Seguin, Kerrville, Eagle Pass, Fredericksburg"},
{"areaCode" : "831", "state" : "California", "cities" : "Monterey, Santa Cruz, Salinas, Hollister, Aptos, Carmel"},
{"areaCode" : "832", "state" : "Texas", "cities" : "Overlay of 713, 281 and 346 area codes (Houston)."},
{"areaCode" : "843", "state" : "South Carolina", "cities" : "Charleston, Florence, Myrtle Beach, Hilton Head"},
{"areaCode" : "844", "state" : "", "cities" : "Toll Free"},
{"areaCode" : "845", "state" : "New York", "cities" : "Poughkeepsie, Spring Valley, Newburgh, Kingston, Nyack, Middletown, Brewster, Pearl River"},
{"areaCode" : "847", "state" : "Illinois", "cities" : "Northbrook, Skokie, Evanston, Glenview, Waukegan, Desplaines, Elk Grove (North suburbs of Chicago)"},
{"areaCode" : "848", "state" : "New Jersey", "cities" : "Overlay of 732 area code."},
{"areaCode" : "850", "state" : "Florida", "cities" : "Tallahassee, Pensacola, Fort Walton Beach, Panama City"},
{"areaCode" : "855", "state" : "", "cities" : "Toll Free"},
{"areaCode" : "856", "state" : "New Jersey", "cities" : "Camden, Haddonfield, Moorestown, Merchantville, Vineland, Laurel Springs"},
{"areaCode" : "857", "state" : "Massachusetts", "cities" : "Overlay of 617 area code."},
{"areaCode" : "858", "state" : "California", "cities" : "La Jolla, Rancho Bernardo, del Mar, Poway, Rancho Penasquitos, Rancho Santa Fe"},
{"areaCode" : "859", "state" : "Kentucky", "cities" : "Lexington, Covington, Boone, Winchester, Richmond, Danville, Mount Sterling"},
{"areaCode" : "860", "state" : "Connecticut", "cities" : "Hartford, New London, Norwich, Middletown, Bristol"},
{"areaCode" : "862", "state" : "New Jersey", "cities" : "Overlay of 973 area code."},
{"areaCode" : "863", "state" : "Florida", "cities" : "Lakeland, Winter Haven, Lake Wales, Sebring, Haines City, Bartow, Avon Park, Okeechobee, Wachula"},
{"areaCode" : "864", "state" : "South Carolina", "cities" : "Greenville, Spartanburg, Anderson"},
{"areaCode" : "865", "state" : "Tennessee", "cities" : "Knoxville, Maryville, Oak Ridge, Sevierville, Gatlinburg, Concord, Powell"},
{"areaCode" : "866", "state" : "", "cities" : "Toll Free"},
{"areaCode" : "870", "state" : "Arkansas", "cities" : "Texarkana, Jonesboro, Pine Bluff, El Dorado"},
{"areaCode" : "872", "state" : "Illinois", "cities" : "Overlay of 312 and 773 area codes."},
{"areaCode" : "877", "state" : "", "cities" : "Toll Free"},
{"areaCode" : "878", "state" : "Pennsylvania", "cities" : "Overlay of 412, 724 area codes."},
{"areaCode" : "880", "state" : "", "cities" : "Carribean to U.S. or Canada OR Canada to U.S. Toll Free"},
{"areaCode" : "881", "state" : "", "cities" : "Carribean to U.S. or Canada OR Canada to U.S. Toll Free"},
{"areaCode" : "888", "state" : "", "cities" : "Toll Free"},
{"areaCode" : "900", "state" : "", "cities" : "Used for Mass Calling Value Added Information"},
{"areaCode" : "901", "state" : "Tennessee", "cities" : "Memphis, Collierville"},
{"areaCode" : "903", "state" : "Texas", "cities" : "Longview, Tyler, Texarkana, Paris, Kilgore, Sherman, Denison"},
{"areaCode" : "904", "state" : "Florida", "cities" : "Jacksonville, Saint Augustine, Orange Park, Fernandina Beach"},
{"areaCode" : "906", "state" : "Michigan", "cities" : "Marquette, Iron Mountain, Houghton, Sault Ste Marie"},
{"areaCode" : "907", "state" : "Alaska", "cities" : "Alaska: All regions"},
{"areaCode" : "908", "state" : "New Jersey", "cities" : "Elizabeth, New Brunswick, Somerville, Freehold, Unionville, Plainfield"},
{"areaCode" : "909", "state" : "California", "cities" : "San Bernardino, Ontario, Upland, Pomona, Riverside, Colton, Chino"},
{"areaCode" : "910", "state" : "North Carolina", "cities" : "Fayetteville, Wilmington, Jacksonville, Lumberton, Laurinburg, Southern Pines"},
{"areaCode" : "912", "state" : "Georgia", "cities" : "Savannah, Macon, Waycross, Brunswick, Statesboro, Vidalia"},
{"areaCode" : "913", "state" : "Kansas", "cities" : "Melrose, Kansas City"},
{"areaCode" : "914", "state" : "New York", "cities" : "Westchester, Monroe, Mount Vernon, Mount Kisco, Pleasantville"},
{"areaCode" : "915", "state" : "Texas", "cities" : "El Paso, Socorro, Fabens, Dell City, Van Horn, Fort Bliss"},
{"areaCode" : "916", "state" : "California", "cities" : "Sacramento, Roseville, Fair Oaks, Folsom, Elk Grove, South Placer"},
{"areaCode" : "917", "state" : "New York", "cities" : "Overlay of 212/718 (New York City - cellular/pager only)"},
{"areaCode" : "918", "state" : "Oklahoma", "cities" : "Tulsa, Broken Arrow, Muskogee, Bartlesville, McAlester"},
{"areaCode" : "919", "state" : "North Carolina", "cities" : "Raleigh, Durham, Cary, Chapel Hill, Goldsboro, Apex, Sanford, Wake Forest"},
{"areaCode" : "920", "state" : "Wisconsin", "cities" : "Green Bay, Appleton, Racine, Fond du Lac, Oshkosh, Sheboygan"},
{"areaCode" : "925", "state" : "California", "cities" : "Walnut Creek, Pleasanton, Concord, Livermore, Bishop Ranch, Danville, Antioch"},
{"areaCode" : "928", "state" : "Arizona", "cities" : "Yuma, Flagstaff, Prescott, Sedona, Bullhead City, Kingman, Lake Havasu City"},
{"areaCode" : "929", "state" : "New York", "cities" : "Overlay of 718 Area Code (Bronx, Brooklyn, Queens, Staten Island)."},
{"areaCode" : "931", "state" : "Tennessee", "cities" : "Clarksville, Shelbyville, Cookeville, Columbia"},
{"areaCode" : "936", "state" : "Texas", "cities" : "Conroe, Nacogdoches, Huntsville, Lufkin, Madisonville"},
{"areaCode" : "937", "state" : "Ohio", "cities" : "Dayton, Springfield, Bellefontaine, Beavercreek, Franklin"},
{"areaCode" : "938", "state" : "Alabama", "cities" : "Overlay of 256 area code."},
{"areaCode" : "940", "state" : "Texas", "cities" : "Wichita Falls, Denton, Gainesville"},
{"areaCode" : "941", "state" : "Florida", "cities" : "Sarasota, Bradenton, Venice, Port Charlotte, Punta Gorda"},
{"areaCode" : "947", "state" : "Michigan", "cities" : "Overlay of 248 Area Code."},
{"areaCode" : "949", "state" : "California", "cities" : "Irvine, Saddleback Valley, Newport Beach, Capistrano Valley, Laguna Beach"},
{"areaCode" : "951", "state" : "California", "cities" : "Riverside, Corona, Temecula, Arlington, Hemet, Moreno Valley, Murietta, Sun City, Elsinore"},
{"areaCode" : "952", "state" : "Minnesota", "cities" : "Bloomington, Burnsville, Eden Prairie, Minnetonka, Edina, St. Louis Park, Apple Valley"},
{"areaCode" : "954", "state" : "Florida", "cities" : "Fort Lauderdale, Hollywood, Pompano Beach, Deerfield Beach, Coral Springs"},
{"areaCode" : "956", "state" : "Texas", "cities" : "Brownsville, Laredo, McAllen, Harlingen, Edinburg"},
{"areaCode" : "959", "state" : "Connecticut", "cities" : "Overlay of 860 Area Code"},
{"areaCode" : "970", "state" : "Colorado", "cities" : "Fort Collins, Greeley, Grand Junction, Loveland, Durango, Vail"},
{"areaCode" : "971", "state" : "Oregon", "cities" : "Overlay of 503 area code."},
{"areaCode" : "972", "state" : "Texas", "cities" : "Grand Prairie, Addison, Irving, Richardson, Plano, Carrollton"},
{"areaCode" : "973", "state" : "New Jersey", "cities" : "Newark, Morristown, Paterson, Passaic, Orange, Bloomfield, Caldwell, Whippany"},
{"areaCode" : "978", "state" : "Massachusetts", "cities" : "Lowell, Lawrence, Billerica, Concord, Wilmington, Sudbury, Fitchburg, Peabody, Andover, Beverly, Danvers"},
{"areaCode" : "979", "state" : "Texas", "cities" : "Bryan, Lake Jackson, Freeport, Brenham, Bay City, El Campo"},
{"areaCode" : "980", "state" : "North Carolina", "cities" : "Overlay of 704 Area Code."},
{"areaCode" : "984", "state" : "North Carolina", "cities" : "Overlay of 919 area code."},
{"areaCode" : "985", "state" : "Louisiana", "cities" : "Houma, Slidell, Hammond, Morgan City, Mandeville, Covington, Thibodaux, Bogalusa, St. Charles"},
{"areaCode" : "989", "state" : "Michigan", "cities" : "Saginaw, Bay City, Midland, Mount Pleasant"}
];




