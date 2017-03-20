var dvb = require('dvbjs');
var Alexa = require('alexa-sdk');

var offset = 7; //time to get to station
var time = new Date(); // starting at what time
//console.log(time.toString());
var deparr = dvb.route.DEPARTURE; // set to dvb.route.DEPARTURE for the time to be the departure time, dvb.route.ARRIVAL for arrival time

var origin = 'Bischofplatz';
var testdest= "Augsbuger Str.";
 dvb.route(origin,testdest,time,deparr,
 function getNextTrip(err,data) {
        console.log("get data");
        var out;
        var data;
        if (err) throw err; 
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
                        " Richtung " + direction[i];
        out += ("\nFahre bis Haltestelle "+ arr_stop[i] +
                  " du kommst dort um "+ arr_time[i] + " an.");
     
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
                    out += ("\nDu hast " + changetime + " Minuten Zeit in " + modes[i] + " Linie " + line[i] +
                            " Richtung " + direction[i] + " umzusteigen, Abfahrt ist um " + dep_time[i] + ".");
                    out += ("\nFahre bis Haltestelle "+ arr_stop[i] +  " du kommst dort um "+ arr_time[i] + " an.");                    
            }           
            
            break;            
            } 
            else {
                continue;
            }
            out +=("\nKeine Abfahrt innerhalb der nächsten 5 Minuten gefunden.");         
            
            } 
            console.log(out);
           // alexa.emit(':tell', out);
});