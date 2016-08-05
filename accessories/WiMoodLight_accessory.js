var Accessory = require('../').Accessory;
var Service = require('../').Service;
var Characteristic = require('../').Characteristic;
var uuid = require('../').uuid;

// MQTT Setup
var mqtt = require('mqtt');
var options = {
    port: 1883,
    host: '192.168.0.108',
    //username: 'jikbynmh',
    //password: 'DNwFM-PivkEl',
    clientId: 'wilight_homekit_bridge2'
};

var client = mqtt.connect(options);

client.subscribe('/heartbeat');

client.on('message', function(topic, message) {
    // message is Buffer 
    console.log(message.toString());
    //client.end();
});

client.on('connect', function(conn) {
    console.log('connected to MQTT server');
});

// here's a fake hardware device that we'll expose to HomeKit
var NWIFI_MOOD_LIGHT = {
    powerOn: false,
    brightness: 100, // percentage
    hue: 0,
    saturation: 0,

    setPowerOn: function(on) {
        console.log("Turning the light %s!", on ? "on" : "off");
        NWIFI_MOOD_LIGHT.powerOn = on;

        if (on) {
            client.publish('wimoodlight', 'on');
        } else {
            client.publish('wimoodlight', 'off');
        };
    },
    setBrightness: function(brightness) {
        console.log("Setting light brightness to %s", brightness);
        NWIFI_MOOD_LIGHT.brightness = brightness;
        client.publish('wimoodlight/brightness', "" + brightness);
    },
    setHue: function(hueVal) {
        console.log("Setting light hue to %s", hueVal);
        NWIFI_MOOD_LIGHT.hue = hueVal;
        client.publish('wimoodlight/hue', "" + hueVal);
    },
    setSaturation: function(saturation) {
        console.log("Setting light saturation to %s", saturation);
        NWIFI_MOOD_LIGHT.saturation = saturation;
        client.publish('wimoodlight/saturation', "" + saturation);
    },
    identify: function() {
        console.log("Identify the WiMood Light!");
    }
}

// Generate a consistent UUID for our light Accessory that will remain the same even when
// restarting our server. We use the `uuid.generate` helper function to create a deterministic
// UUID based on an arbitrary "namespace" and the word "light".
var lightUUID = uuid.generate('hap-nodejs:accessories:wimoodlight');

// This is the Accessory that we'll return to HAP-NodeJS that represents our fake light.
var light = exports.accessory = new Accessory('WiMoodLamp', lightUUID);

// Add properties for publishing (in case we're using Core.js and not BridgedCore.js)
light.username = "1A:1C:3C:4D:5E:FF";
light.pincode = "031-45-154";

// set some basic properties (these values are arbitrary and setting them is optional)
light
    .getService(Service.AccessoryInformation)
    .setCharacteristic(Characteristic.Manufacturer, "nZen Technologies")
    .setCharacteristic(Characteristic.Model, "Rev-1")
    .setCharacteristic(Characteristic.SerialNumber, "A1S2NASF88FF");

// listen for the "identify" event for this Accessory
light.on('identify', function(paired, callback) {
    NWIFI_MOOD_LIGHT.identify();
    callback(); // success
});

// Add the actual Lightbulb Service and listen for change events from iOS.
// We can see the complete list of Services and Characteristics in `lib/gen/HomeKitTypes.js`
light
    .addService(Service.Lightbulb, "Wi Mood Lamp") // services exposed to the user should have "names" like "Fake Light" for us
    .getCharacteristic(Characteristic.On)
    .on('set', function(value, callback) {
        NWIFI_MOOD_LIGHT.setPowerOn(value);
        callback(); // Our fake Light is synchronous - this value has been successfully set
    });

// We want to intercept requests for our current power state so we can query the hardware itself instead of
// allowing HAP-NodeJS to return the cached Characteristic.value.
light
    .getService(Service.Lightbulb)
    .getCharacteristic(Characteristic.On)
    .on('get', function(callback) {

        // this event is emitted when you ask Siri directly whether your light is on or not. you might query
        // the light hardware itself to find this out, then call the callback. But if you take longer than a
        // few seconds to respond, Siri will give up.

        var err = null; // in case there were any problems

        if (NWIFI_MOOD_LIGHT.powerOn) {
            console.log("Are we on? Yes.");
            callback(err, true);
        } else {
            console.log("Are we on? No.");
            callback(err, false);
        }
    });

// also add an "optional" Characteristic for Brightness
light
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Brightness)
    .on('get', function(callback) {
        callback(null, NWIFI_MOOD_LIGHT.brightness);
    })
    .on('set', function(value, callback) {
        NWIFI_MOOD_LIGHT.setBrightness(value);
        callback();
    })

light
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Hue)
    .on('get', function(callback) {
        callback(null, NWIFI_MOOD_LIGHT.hue);
    })
    .on('set', function(value, callback) {
        NWIFI_MOOD_LIGHT.setHue(value);
        callback();
    })

light
    .getService(Service.Lightbulb)
    .addCharacteristic(Characteristic.Saturation)
    .on('get', function(callback) {
        callback(null, NWIFI_MOOD_LIGHT.saturation);
    })
    .on('set', function(value, callback) {
        NWIFI_MOOD_LIGHT.setSaturation(value);
        callback();
    })