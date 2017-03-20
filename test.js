
var dvb = require('dvbjs');
var Alexa = require('alexa-sdk');
var moment = require('moment-timezone');
var time = new Date();

var origin = 'Bischofsplatz'; //your homestation
var offset = 7; //time to get to station
var tzoffset = 0;
var itemName = "Hauptbahnhof";

//console.log(time.toString());
   var time = new Date()
   deparr = dvb.route.ARRIVAL;
   var arr_hr = 20;
   var arr_min = 00;
   if (time.getHours() > arr_hr ||(time.getHours() == arr_hr && time.getMinutes() > arr_min)) {
            time.setDate(time.getDate()+1);
        }
        time.setHours(arr_hr);
        time.setMinutes(arr_min);
        var tzoffset = 0;
        tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time.getTimezoneOffset(); 
        time.setMinutes(time.getMinutes() - tzoffset);
        console.log(time.toLocaleString());

      //var that = this;
      /*var itemSlot = this.event.request.intent.slots.destination;
      var itemName = this.event.request.intent.slots.value; 
      if (itemSlot && itemSlot.value) {
          itemName = itemSlot.value.toLowerCase();
      }*/
      console.log(itemName);
      dvb.route(origin,itemName,time,deparr,
       function getNextTrip(err,data) {
        if (err) {
                console.log("Es gab einen Fehler beim Abrufen der Verbindungsinformationen.");
                
                return;
            }
        else {
        //console.log("get data");
        console.log(time);
        var out;
        var data;
        if(!data) {
            console.log("Keine Verbindung zu Haltestelle " + itemName + " gefunden.");
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
            var time_now = new Date();
            tzoffset = moment.tz.zone('Europe/Berlin').offset(time) - time_now.getTimezoneOffset(); 
            time_now.setMinutes(time_now.getMinutes() - tzoffset + offset);            
            if (time_now < time && deparr == dvb.route.ARRIVAL) {
                tomorrow = 1;                
            }                
            var tzoffset = 0;
            console.log("t_now"+time_now);
            //var cur_hr = Number(time_now.getHours());
            //var cur_min = Number(time_now.getMinutes());            
            var dep_hr = Number(dep_time[0].slice(0,2));
            var dep_min = Number(dep_time[0].slice(3,5));            
            var time_dep = new Date(time_now.getFullYear(), time_now.getMonth(),time_now.getDate() + tomorrow);
            time_dep.setHours(dep_hr);
            time_dep.setMinutes(dep_min)
            time_dep.setMinutes(time_dep.getMinutes());
            console.log("t_dep" + time_dep);
            //var future = false;
            //time_now < time_dep
            
            if (time_now < time_dep)  {
                    if (deparr == dvb.route.ARRIVAL) {
                        var time_arr = var time_dep = new Date(time_now.getFullYear(), time_now.getMonth(),time_now.getDate() + tomorrow);
                        var arr_hr = arr_s
                        var arr_min 
                        
                        continue;
                    }
                    var i = 0;
                    if (modes[i] == "Fussweg") {
                        out = (" Gehe zu Fuß zur Haltestelle "+ arr_stop[i] +  ", du kommst dort um "+ arr_time[i] + " an.");
                    }
                    else {
                        out = "Starte um "+ dep_time[i] +
                            " Uhr an der Haltestelle "+ dep_stop[i] + " mit "+ modes[i] +" Linie "+line[i] +
                                " Richtung " + direction[i] + ".";
                        out += (" Fahre bis Haltestelle "+ arr_stop[i] +
                                ", du kommst dort um "+ arr_time[i] + " an.");
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
                    out = (" Keine Abfahrt innerhalb der nächsten 7 Minuten gefunden.");         
            }
            
            
            
            }

            console.log("Last: "+ out);
        }
       })
       
     