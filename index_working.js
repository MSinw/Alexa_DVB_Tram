var dvb = require('dvbjs');
var Alexa = require('alexa-sdk');
var moment = require('moment-timezone');

var offset = 7; //time to get to station
//console.log(time.toString());
var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

var origin = 'Bischofsplatz';
//var testdest= "Augsbuger Str.";

exports.handler = function(event, context, callback) {
    var alexa = Alexa.handler(event, context);
    alexa.registerHandlers(handlers);
    alexa.resources = languageStrings;
    alexa.execute();
};


var handlers = {
    'LaunchRequest': function () {
      this.attributes['speechOutput'] = this.t("WELCOME_MESSAGE", this.t("SKILL_NAME"));
      this.attributes['repromptSpeech'] = this.t("WELCOME_REPROMT");
      this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    },
    'departure': function() {
        deparr = dvb.route.DEPARTURE;
        this.emit('travel');
    },
    'arrival': function() {
        deparr = dvb.route.ARRIVAL;        
    },
    'travel': function () {
        var time = new Date(); // starting at what time
        var tzoffset = 0;
        tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time.getTimezoneOffset(); 
        time.setMinutes(time.getMinutes() - tzoffset);

      var that = this;
      var itemSlot = this.event.request.intent.slots.destination;
      var itemName = this.event.request.intent.slots.value; 
      if (itemSlot && itemSlot.value) {
          itemName = itemSlot.value.toLowerCase();
      }
      console.log(itemName);
      dvb.route(origin,itemName,time,deparr,
       function getNextTrip(err,data) {
        if (err) {
                that.emit(':tell', "Es gab einen Fehler beim Abrufen der Verbindungsinformationen.");
                console.log(err);
                return;
            }
        else {
        //console.log("get data");
        var out;
        var data;
        if(!data) {
            that.emit(':tell', "Keine Verbindung zu Haltestelle " + itemName + " gefunden.");
            return;
        }
        var max_trips = Object.keys(data["trips"]).length;        
        //max_trips = 5;
        for(trips = 0; trips < max_trips; trips++) {
            var modes = [];
            var line = [];
            var dep_stop = [];
            var dep_time = [];
            var arr_stop = [];
            var arr_time = [];
            var direction = [];
            var count = Object.keys(data["trips"][trips]["nodes"]).length;
            for (i = 0; i < count; i++) {
                modes.push(data["trips"][trips]["nodes"][i]["mode"]);
                line.push(data["trips"][trips]["nodes"][i]["line"]);
                direction.push(data["trips"][trips]["nodes"][i]["direction"]);
                dep_stop.push(data["trips"][trips]["nodes"][i]["departure"]["stop"]);
                dep_time.push(data["trips"][trips]["nodes"][i]["departure"]["time"]);        
                arr_stop.push(data["trips"][trips]["nodes"][i]["arrival"]["stop"]);
                arr_time.push(data["trips"][trips]["nodes"][i]["arrival"]["time"]);                    
            } 
            //zeitprüfung auf vergangenheit            
            var cur_hr = Number(time.getHours());
            var cur_min = Number(time.getMinutes());
            var dep_hr = Number(dep_time[0].slice(0,2));
            var dep_min = Number(dep_time[0].slice(3,5));
            var future = false;           
            if (((cur_min + offset ) <= dep_min) && (cur_hr == dep_hr)) {                 
                 future = true;
            }
            if (dep_hr > cur_hr && (cur_min + offset - 60) <= dep_min) {                
                future = true;
            }            
            if (future) {
                    var i = 0;
        out = "Starte um "+ dep_time[i] +
                   " Uhr an der Haltestelle "+ dep_stop[i] + " mit "+ modes[i] +" Linie "+line[i] +
                        " Richtung " + direction[i] + ".";
        out += (" Fahre bis Haltestelle "+ arr_stop[i] +
                  ", du kommst dort um "+ arr_time[i] + " an.");
     
                for (i++; i < count; i++) {
                    var arr_hr = Number(arr_time[i-1].slice(0,2));
                    var arr_min = Number(arr_time[i-1].slice(3,5));
                    var dep_hr = Number(dep_time[i].slice(0,2));
                    var dep_min = Number(dep_time[i].slice(3,5));
                    var changetime = 0;
                    if (arr_hr > dep_hr) {
                        changetime = 60 - arr_min + dep_min;
                    }
                    else {          
                        changetime = dep_min - arr_min;
                    }                
                    out += (" Du hast " + changetime + " Minuten Zeit in " + modes[i] + " Linie " + line[i] +
                            " Richtung " + direction[i] + " umzusteigen, Abfahrt ist um " + dep_time[i] + ".");
                    out += (" Fahre bis Haltestelle "+ arr_stop[i] +  ", du kommst dort um "+ arr_time[i] + " an.");                    
            }           
            
            break;            
            } 
            else {
                continue;
            }
            out +=(" Keine Abfahrt innerhalb der nächsten 7 Minuten gefunden.");         
            
            }

            that.emit(':tell', out);
        }
       })
       },

    'AMAZON.HelpIntent': function () {
      this.attributes['speechOutput'] = this.t("HELP_MESSAGE");
      this.attributes['repromptSpeech'] = this.t("HELP_REPROMT");
      this.emit(':ask', this.attributes['speechOutput'], this.attributes['repromptSpeech'])
    },
    'AMAZON.StopIntent': function () {
      this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
      this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest':function () {
      this.emit(':tell', this.t("STOP_MESSAGE"));
    }
 };


var languageStrings = {
  "de-DE": {
    "translation": {
      "STOP_MESSAGE": "Bis zum nächsten mal",
      "HELP_MESSAGE": "Wohin willst du fahren",
      "HELP_REPROMT": "Bitte nenne mir eine Haltestelle",
      "WELCOME_MESSAGE": "Willkommen bei tram-helper, bitte nenne eine Zielhaltestelle",
      "WELCOME_REPROMT": "bitte nenne eine Zielhaltestelle"
    }
  }
};










