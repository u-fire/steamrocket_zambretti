// edit the .env file with required information
require('dotenv').config()

// connect to the MySQL database
const mysql = require('knex')({
    client: 'mysql2',
    connection: {
        host: process.env.MYSQL_SERVER,
        port: process.env.MYSQL_PORT,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
        ssl: {
            rejectUnauthorized: false,
        },
    },
});

// connect to the MQTT server
const mqtt = require('mqtt')
const client = mqtt.connect(process.env.MQTT_SERVER);

// on MQTT connect event, subscribe the the DEVICE_ID/json topic
client.on('connect', () => {
    client.subscribe([process.env.DEVICE_ID + "/json"]);
});

// on MQTT message event, process the payload which should include
// hPa_0 for sea-level adjusted pressure in hPa
client.on('message', (topic, payload) => {
    on_message(payload);
});

// get the nearest 3 hour old pressure measurement
// call `zambretti` function to get the forecast
// publish the forecast to the DEVICE_ID/rcv topic which the device and anything else can receive
async function on_message(payload) {
    // payload is received in JSON format
    let current_pressure = JSON.parse(payload.toString());
    
    const pressure_from_3_hours_ago = await mysql
        .from(process.env.DEVICE_ID)
        .whereRaw('time >= DATE_SUB(UTC_TIMESTAMP(),INTERVAL 3 HOUR)')
        .where({ measurement: 'hPa_0' })
        .limit(1);

    let zambretti_forecast = zambretti(pressure_from_3_hours_ago, current_pressure.hPa_0);
    console.log(process.env.DEVICE_ID + " " + zambretti_forecast);
    client.publish(process.env.DEVICE_ID + "/rcv", zambretti_forecast, { qos: 0, retain: true });
}

// determine pressure trend
// a difference of 1.6 hPa over three hours determines the trend
function zambretti(pressure_from_3_hours_ago, current_pressure) {
    let zambretti_letter;
    let pressure_difference = pressure_from_3_hours_ago - current_pressure;

    if (pressure_difference >= 1.6) {
        zambretti_letter = _zambretti_falling(current_pressure);
    }
    else if (pressure_difference <= 1.6) {
        zambretti_letter = _zambretti_rising(current_pressure);
    }
    else {
       zambretti_letter = _zambretti_steady(current_pressure);
    }

    return zambretti_letter;
}

// determine the forecast and return an emoji representing it
function _zambretti_falling(current_pressure) {
    let letter = '';
    if      (current_pressure > 1045) letter = "☀️";    // A: Settled Weather 
    else if (current_pressure > 1032) letter = "☀️";    // B: Fine Weather 
    else if (current_pressure > 1020) letter = "🌤️";    // D: Fine, Becoming Less Settled 
    else if (current_pressure > 1014) letter = "⛅";    // H: Fairly Fine, Showers Later 
    else if (current_pressure > 1006) letter = "🌦️";    // O: Showery, Becoming More Unsettled 
    else if (current_pressure > 1000) letter = "🌦️";    // R: Unsettled, Rain Later 
    else if (current_pressure > 993) letter = "🌧️";     // U: Rain At Time, Worse Later 
    else if (current_pressure > 987) letter = "🌧️";     // V: Rain At Times, Becomng Very Unsettled 
    else letter = "🌧️";                                 // X: Very Unsettled 

    return letter;
}

// determine the forecast and return an emoji representing it
function _zambretti_rising(current_pressure) {
    let letter = '';
    if      (current_pressure > 1025) letter = "☀️";    // A: Settled Weather 
    else if (current_pressure > 1016) letter = "☀️";    // B: Fine Weather 
    else if (current_pressure > 1009) letter = "☀️";    // C: Becoming Fine 
    else if (current_pressure > 1003) letter = "🌤️";    // F: Fairly Fine, Improv 
    else if (current_pressure > 997) letter = "⛅";     // G: Fairly Fine, Possible Showers Early 
    else if (current_pressure > 992) letter = "⛅";     // I: Showers Early, Improving  
    else if (current_pressure > 986) letter = "⛅";     // J: Changeable, Mending 
    else if (current_pressure > 980) letter = "⛅";     // L: Rather Unsettled, Clearing Later 
    else if (current_pressure > 973) letter = "⛅";     // M: Unsettled, Probably Improving 
    else if (current_pressure > 967) letter = "☁️";     // Q: Unsettled, Short Fine Intervals 
    else if (current_pressure > 961) letter = "☁️";     // T: Very Unsettled, Finer At Times 
    else if (current_pressure > 953) letter = "🌧️";     // Y: Stormy, Possibly Improving 
    else letter = "🌧️";                                 //Z: Stormy, Much Rain 

    return letter;
}

// determine the forecast and return an emoji representing it
function _zambretti_steady(current_pressure) {
    let letter = '';
    if      (current_pressure > 1028) letter = "☀️";    // A: Settled Weather 
    else if (current_pressure > 1017) letter = "☀️";    // B: Fine Weather 
    else if (current_pressure > 1011) letter = "🌤️";    // E: Fine, Possible Showers 
    else if (current_pressure > 1003) letter = "⛅";    // K: Fairly Fine, Showers Likely 
    else if (current_pressure > 996) letter = "⛅";     // N: Showery, Bright Intervals 
    else if (current_pressure > 991) letter = "☁️";     // P: Changeable, Some Rain 
    else if (current_pressure > 984) letter = "☁️";     // S: Unsettled, Rain At Times 
    else if (current_pressure > 978) letter = "🌧️";     // W: Rain At Frequent Intervals 
    else if (current_pressure > 966) letter = "🌧️";     // X: Very Unsettled, Rain 
    else letter = "🌧️";                                 // Z: Stormy, Much Rain 

    return letter;
}