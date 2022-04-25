# steamrocket Zambretti Forecaster
Implement a Zambretti forecast using:
- steamrocket.co for transporting hardware sensor measurements over MQTT and MySQL historical data.
- An MQTT server is required to be configured in steamrocket.co as a Transport
- A MySQL database is required to be configured in steamrocket.co as a Database
- An provisioned device with BMP280/BMP680/BME280 is required for temperture and pressure measurements
    
The Zambretti forecast gives a local forecast based on the barometric trend. It was originally developed for use in the UK. The original method took wind direction and season into account. Those factors are not implemented in this example since it seemed those factors were more UK region specific.

To run this on a Linux-based machine/instance:
1. ensure Node.js is installed
2. Clone/copy this repo 
3. Edit the .env file with MySQL, MQTT, and device information
4. `npm install` to install 
5. `node app.js` to run

To implement the sensor device:
1. A sample is provided for ESP32-based devices using the BMP280 [here](https://create.arduino.cc/editor/uFire/44a1e4ea-6bbb-45f3-9c94-c396cb6f984e/preview)
2. Provision a device in steamrocket.co and copy the ID/key into the sketch

Configure steamrocket.co:
1. Configure the provisioned device's group for MQTT and MySQL

The forecast will be published to the device's MQTT `[DEVICE_ID]/rcv` topic everytime that device publishes measurements.
It is in the form of an emoji and represents the forecast for the next 12 hours ie. sunny, cloudy, chance of storm, stormy.

Sources: 
- https://integritext.net/DrKFS/zambretti.htm
- https://create.arduino.cc/projecthub/mircemk/diy-zambretti-weather-forecaster-on-vfd-display-ddd069
- https://w4krl.com/zambretti-forecaster/