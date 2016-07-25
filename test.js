var mqtt = require('mqtt');
var options = {
    port: 1883,
    host: '192.168.0.108',
    username: 'nhomehub',
    password: 'Budugu123',
    clientId: 'wilock_homekit_bridge'
};

var client = mqtt.connect(options);

client.subscribe('/nzen-dev-status');

client.on('message', function(topic, message) {
    console.log(message.toString());
});