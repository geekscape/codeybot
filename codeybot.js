#!/usr/bin/env node

/*
 * CodeyBot documentation ...
 *   https://docs.google.com/document/d/1PZAIR0dUQ3_tG38MzNi0BQWu_up2rs4msyIPj46wQmk/edit
 */

var DEBUG = false;

const CODEYBOT_HOST  = 'codeybot.local';
const CODEYBOT_PORT  = 1153;
const BROADCAST_PORT = 1155;

const MODE_IDLE   = 0;
const MODE_SINGLE = 5;

//let parameter = process.argv[2];

let led_screen = require('./tm1640_led_screen');
let screen     = led_screen.initialize();

let game_of_life = require('./game_of_life');

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

      if (DEBUG) console.log('Send:    ' + message);
    }
  );
}

function screen_as_bit_string(screen) {
  let output = "";

  for (let index = 0;  index < 31;  index ++) {
    let byte = "00000000" + screen[index].toString(2);
    output = output + byte.substring(byte.length - 8);
  }

  return(output.substring(0, 247));
}

function random_int(maximum) {
  return(Math.round(Math.random() * maximum));
}

function random_bit_string_247() {
  let output = "";

  for (let index = 0;  index < 31;  index ++) {
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

function robot_write_screen(screen) {
  command_led_screen(screen_as_bit_string(screen));
}

function robot_leds_random_all() {
  command_wheel_colour(random_int(255), random_int(255), random_int(255));
  command_led_screen(random_bit_string_247());
}

function robot_leds_random_circles() {
  var column = random_int(18);
  var row    = random_int(12);
  var radius = random_int(5) + 2;

  if (radius == 2) led_screen.clear_screen(screen);

  led_screen.draw_circle(screen, column, row, radius);
  command_led_screen(screen_as_bit_string(screen));
}

function robot_leds_random_one_by_one() {
  var column = random_int(18);
  var row    = random_int(12);
  var value  = random_int(1);

  led_screen.draw_point(screen, column, row, value);
  command_led_screen(screen_as_bit_string(screen));
}

var column = 0;
var row    = 0;
var value  = 1;

function robot_leds_turn_on_one_by_one() {
  led_screen.draw_point(screen, column, row, value);
  command_led_screen(screen_as_bit_string(screen));

  if (++ column >= 19) {
    column = 0;
    if (++ row >= 13) {
      row   = 0;
      value = ! value;
    }
  }
}

var invert = false;

function robot_draw_characters() {
  led_screen.clear_screen(screen, invert ? 0xff : 0x00);
  led_screen.draw_rectangle(screen, 0, 0, 19, 13);
  led_screen.draw_character(screen,  3,  3, 'H', invert ? 0 : 1);
  led_screen.draw_character(screen,  9,  3, 'i', invert ? 0 : 1);
  led_screen.draw_character(screen, 13,  3, '!', invert ? 0 : 1);
  command_led_screen(screen_as_bit_string(screen));

  invert = ! invert;
}

socket_codeybot     = socket_create('codeybot',  CODEYBOT_PORT);
// socket_broadcast = socket_create('broadcast', BROADCAST_PORT);

function robot_initialize() {
  send('G5 ' + MODE_SINGLE);
  command_wheel_colour(255, 255, 255);
  led_screen.clear_screen(screen);
  led_screen.draw_rectangle(screen, 0, 0, 19, 13);

//setInterval(robot_leds_random_all,         200);  // milliseconds
//setInterval(robot_leds_random_circles,     500);  // milliseconds
//setInterval(robot_leds_random_one_by_one,   50);  // milliseconds
//setInterval(robot_leds_turn_on_one_by_one,  50);  // milliseconds
//setInterval(robot_draw_characters,         500);  // milliseconds

  game_of_life.initialize(led_screen, screen, robot_write_screen);

  setInterval(command_get_status, 5000);  // milliseconds
}

robot_initialize();

// TODO: On exit ...
// send(socket_codeybot, CODEYBOT_HOST, CODEYBOT_PORT, 'G5 ' + MODE_IDLE);
