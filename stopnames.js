var dvb = require('dvbjs');
dvb.find('Bischofsweg', function(err, data){
    if (err) throw err;
    //console.log(JSON.stringify(data, null, 4));
    console.log(data);
});