
var dvb = require('dvbjs');
var Alexa = require('alexa-sdk');
var moment = require('moment-timezone');
//var time = new Date();

//route parameters
var origin = 'Bischofsplatz'; //your homestation
var offset = 7; //time to get to station

/*try to handle timezones in case we are running on servers with unknown time settings
var tzoffset = 0;
tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time.getTimezoneOffset(); 
time.setMinutes(time.getMinutes() - tzoffset);*/

//console.log(time.toString());
var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time


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
        time = new Date();
        console.log("departure");
        tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time.getTimezoneOffset();
        time.setMinutes(time.getMinutes() - tzoffset);
        deparr = dvb.route.DEPARTURE;       
        this.emit('travel');
    },
    'arrival': function() {
        console.log("arrival");
        time = new Date();
        console.log("departure");
        tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time.getTimezoneOffset();
        time.setMinutes(time.getMinutes() - tzoffset);
        var itemSlot = this.event.request.intent.slots.desttime;
        var itemDestTime = this.event.request.intent.slots.desttime.value; 
        console.log(itemDestTime);
        if (itemSlot && itemSlot.value) {
            var hr_now = time.getHours();
            var min_now = time.getMinutes();
            console.log(typeof itemDestTime);
            var hr_dest = itemDestTime.slice(0,2);
            var min_dest = itemDestTime.slice(3,5);
            //if time is in the past assume future
            if (Number(hr_dest) < Number(hr_now) || (Number(hr_dest) == Number(hr_now) && Number(min_dest) < Number(min_now))) {
               time.setDate(time.getDate() + 1);
            }
            time.setHours(hr_dest);
            time.setMinutes(min_dest);
        }
        deparr = dvb.route.ARRIVAL;
        this.emit('travel');
    },
    'travel': function () {
      var that = this;
      console.log('tavel');
      var itemSlot = this.event.request.intent.slots.destination;
      var itemName = this.event.request.intent.slots.value; 
      if (itemSlot && itemSlot.value) {
          itemName = itemSlot.value.toLowerCase();
      }
      console.log(origin + " nach " + itemName);
      console.log(time.toString());
      console.log(deparr);
         dvb.route(origin,itemName,time,deparr,
       function getNextTrip(err,data) {
        console.log(time);
        var out;
        var data;
        if (err) throw err; 
        var max_trips = Object.keys(data["trips"]).length;
        if (deparr == dvb.route.Arrival) max_trips = 3;
        //max_trips = 5;
        var time_now = new Date();
        for(trips = 0; trips < max_trips; trips++) {  
            console.log(trips);      
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
            //problem besteht bei Frage nach Ankunft und Ankunftszeit am nächsten Tag
            var tomorrow = 0;
            if (time_now < time && deparr == dvb.route.ARRIVAL) {
                tomorrow = 1;                
            }                
            var tzoffset = 0;
            tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time_now.getTimezoneOffset(); 
            time_now.setMinutes(time_now.getMinutes() - tzoffset);
            //var cur_hr = Number(time_now.getHours());
            //var cur_min = Number(time_now.getMinutes());            
            var dep_hr = Number(dep_time[0].slice(0,2));
            var dep_min = Number(dep_time[0].slice(3,5));
            var time_dep = new Date(time_now.getDate() + tomorrow);
            time_dep.setHours(dep_hr);
            time_dep.setMinutes(dep_hr + offset);
            //var future = false;
            console.log(time_dep < time_now);
            if (time_dep < time_now) {           
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
                    if (modes[i] == "Fussweg") {
                      out += (" Gehe zu Fuß zur Haltestelle"+ arr_stop[i] +  ", du kommst dort um "+ arr_time[i] + " an.");
                    }
                    else {
                    out += (" Du hast " + changetime + " Minuten Zeit in " + modes[i] + " Linie " + line[i] +
                            " Richtung " + direction[i] + " umzusteigen, Abfahrt ist um " + dep_time[i] + ".");
                    out += (" Fahre bis Haltestelle "+ arr_stop[i] +  ", du kommst dort um "+ arr_time[i] + " an.");                    
                    }                    
            }           
            
            break;            
            }
            else {
                out =("Keine passende Abfahrt innerhalb der nächsten "+ offset +" Minuten gefunden.");                      
            }
            }
            console.log(out);
            that.emit(':tell', out);
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
      "WELCOME_REPROMT": "Bitte nenne eine Zielhaltestelle"
    }
  }
};










