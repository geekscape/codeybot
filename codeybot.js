/*
 * Documentation ...
 *   https://docs.google.com/document/d/1PZAIR0dUQ3_tG38MzNi0BQWu_up2rs4msyIPj46wQmk/edit
 */

const CODEYBOT_HOST  = 'codeybot.local';
const CODEYBOT_PORT  = 1153;
const BROADCAST_PORT = 1155;

const MODE_IDLE   = 0;
const MODE_SINGLE = 5;

//let parameter = process.argv[2];

let dgram = require('dgram');

function socket_create(name, port) {
  let socket = dgram.createSocket('udp4');

  socket.on('error', function (error) {
    console.log('Socket error: ' + name + '\n' + error.stack);
    socket.close();
  });

  socket.on('listening', function () {
    console.log(
      'Socket listening: ' + name + ', port: ' + socket.address().port
    );
  });

  socket.on('message', function (message, info) {  // info.address and info.port
    message = message.toString();
    if (message.endsWith('\n')) {
      message = message.substring(0, message.length - 1);
    }

    console.log('Receive: ' + message);
  });

  socket.bind(port);

  return(socket);
}

function send(message, socket, host, port) {
  if (typeof(socket) === 'undefined') socket = socket_codeybot;
  if (typeof(host)   === 'undefined') host   = CODEYBOT_HOST;
  if (typeof(port)   === 'undefined') port   = CODEYBOT_PORT;
  
  let buffer = new Buffer(message);

  socket.send(buffer, 0, buffer.length, port, host,
    function(error, bytes) {
      if (error) throw error;

//    console.log('Send:    ' + host + ':'+ port + ', ' + message);
      console.log('Send:    ' + message);
    }
  );
}

function random_int(maximum) {
  return(Math.round(Math.random() * maximum));
}

function random_bit_string_247() {
  let output = "";

  for (let i = 0;  i < 31;  i ++) {
    let byte = "00000000" + random_int(255).toString(2);
    output = output + byte.substring(byte.length - 8);
  }

  return(output.substring(0, 247));
}

function command_get_status() {
  send('G1');
}

function command_wheel_colour(red, green, blue) {
  send('G3 ' + red + ' ' + green + ' ' + blue);
}

function command_led_screen(bit_string_247) {
  send('G4 ' + bit_string_247);
}

function robot_random_all_leds() {
  command_wheel_colour(random_int(255), random_int(255), random_int(255));
  command_led_screen(random_bit_string_247());
}

socket_codeybot     = socket_create('codeybot',  CODEYBOT_PORT);
// socket_broadcast = socket_create('broadcast', BROADCAST_PORT);

function robot_initialize() {
  send('G5 ' + MODE_SINGLE);
  command_wheel_colour(255, 255, 255);

  setInterval(command_get_status,    5000);  // milliseconds
  setInterval(robot_random_all_leds,  250);  // milliseconds
}

robot_initialize();

// TODO: On exit ...
// send(socket_codeybot, CODEYBOT_HOST, CODEYBOT_PORT, 'G5 ' + MODE_IDLE);
