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
        var time = new Date(); // starting at what time
        var tzoffset = 0;
        tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time.getTimezoneOffset(); 
        time.setMinutes(time.getMinutes() - tzoffset);
        this.emit('travel', time);
    },
    'arrival': function() {
        deparr = dvb.route.ARRIVAL;
        var time = new Date();
        var tzoffset = 0;
        tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time.getTimezoneOffset(); 
        time.setMinutes(time.getMinutes() - tzoffset);
        var itemSlot = this.event.request.intent.slots.desttime;
        var itemValue = this.event.request.intent.slots.value;
        if (itemSlot && itemSlot.value) {
            itemValue = itemSlot.value;
        }
        else {
            this.emit(':tell', "Leider konnte ich die Ankunftszeit nicht verstehen.");
        }
        var arr_hr = itemValue.slice(0,2);
        var arr_min = itemValue.slice(3,5);
        if (time.getHours() > arr_hr ||(time.getHours() == arr_hr && time.getMinutes() > arr_min)) {
            time.setDate(time.getDate()+1);
        }
        time.setHours(arr_hr);
        time.setMinutes(arr_min);
        this.emit('travel', time);
    },
    'travel': function (time) {            

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
                return;
            }
        else {
        //console.log("get data");
        console.log(time);
        var out;
        var card;
        var data;
        if(!data) {
            that.emit(':tell', "Keine Verbindung zu Haltestelle " + itemName + " gefunden.");
            return;
        }
        var max_trips = Object.keys(data["trips"]).length;        
        console.log(max_trips)
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
            //problem besteht bei Frage nach Ankunft und Ankunftszeit am nächsten Tag
            var tomorrow = 0;
            var time_now = new Date();            
            tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time_now.getTimezoneOffset(); 
            time_now.setMinutes(time_now.getMinutes() - tzoffset + offset);            
            if (time_now < time && deparr == dvb.route.ARRIVAL) {
                tomorrow = 1;                
            }                
            var tzoffset = 0;
            //console.log(time_now);
            //var cur_hr = Number(time_now.getHours());
            //var cur_min = Number(time_now.getMinutes());            
            var dep_hr = Number(dep_time[0].slice(0,2));
            var dep_min = Number(dep_time[0].slice(3,5));            
            var time_dep = new Date(time_now.getFullYear(), time_now.getMonth(),time_now.getDate() + tomorrow);
            time_dep.setHours(dep_hr);
            time_dep.setMinutes(dep_min)
            time_dep.setMinutes(time_dep.getMinutes());
            //console.log(time_dep);
            //var future = false;
            //time_now < time_dep
            if (time_now < time_dep)  {                
                    var i = 0;
                    if (modes[i] == "Fussweg") {
                        out = (" Gehe zu Fuß zur Haltestelle "+ arr_stop[i] +  ", du kommst dort um "+ arr_time[i] + " an.");
                        card = ("Zu Fuß nach " + arr_stop[i] + "\n");
                    }
                    else {
                        out = "Starte um "+ dep_time[i] +
                            " Uhr an der Haltestelle "+ dep_stop[i] + " mit "+ modes[i] +" Linie "+line[i] +
                                " Richtung " + direction[i] + ".";
                        out += (" Fahre bis Haltestelle "+ arr_stop[i] +
                                ", du kommst dort um "+ arr_time[i] + " an.");
                        card = (dep_stop[i] + " " + dep_time[i] + " " + modes[i] + " " + line[i] + "("+direction[i]+")\n");
                        card += (arr_stop[i] + " " + arr_time[i]  + "\n");
                    }
     
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
                        out += (" Gehe zu Fuß zur Haltestelle "+ arr_stop[i] +  ", du kommst dort um "+ arr_time[i] + " an.");
                        card += ("Zu Fuß nach " + arr_stop[i] + "\n");
                    }
                    else {
                        out += (" Du hast " + changetime + " Minuten Zeit in " + modes[i] + " Linie " + line[i] +
                            " Richtung " + direction[i] + " umzusteigen, Abfahrt ist um " + dep_time[i] + ".");
                        out += (" Fahre bis Haltestelle "+ arr_stop[i] +  ", du kommst dort um "+ arr_time[i] + " an.");
                        card += (dep_stop[i] + " " + dep_time[i] + " " + modes[i] + " " + line[i] + "("+direction[i]+")\n");
                        card += (arr_stop[i] + " " + arr_time[i]  + "\n");
                    }
                }
            break;  
            }           
            
                      
            
            else {
                out =(" Keine Abfahrt innerhalb der nächsten 7 Minuten gefunden.");
                card = out;
            }
            
            
            }

            that.emit(':tellWithCard', out, "Verbindung nach " + itemName, card);
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










