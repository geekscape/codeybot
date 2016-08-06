'use strict'

let dgram = require('dgram');
let events = require('events');
let util = require('util');

const CB_PORT = 1153;
const BROADCAST_PORT = 1155;

const MODE = {
    IDLE: 0,
    SINGLE: 5,
}

let commands = {
    face: function (bitstring) {
        // Take a bitstring 247 chars long and send it to the robot to display.
        if (bitstring.length != 247) {
            this.bot.emit("error", { component: "face", error: "Bitstring wasn't 247 pixels long"});
        } else {
            let data = `G4 ${bitstring}`;
            this.bot.send(data);
        }
    },
    wheel_colour: function (red, green, blue) {
        let data = `G3 ${red} ${green} ${blue}`;
        this.bot.send(data);

    },
};

commands["wheel_color"] = commands.wheel_colour;

function Commands (opts) {

    if (!(this instanceof Commands)) {
        return Commands(opts);
    }

    this.bot = opts.bot || undefined;

    if (!this.bot) {
        throw new Error("bot appears undefined?");
    }
}

Commands.prototype = commands;

function CodeyBot(opts) {

    if (!(this instanceof CodeyBot)) {
        return CodeyBot(opts);
    }

    this.hostname = opts.hostname || "openwrt.local";

    this.command = new Commands({ bot: this });

    // set up the socket and appropriate listeners
    this.socket = dgram.createSocket('udp4');

    this.socket.on('error', (error) => {
        console.log('Socket error: \n' + error.stack);
        this.socket.close();
    });

    this.socket.on('listening', () => {
        console.log(
            'Socket listening port: ' + this.socket.address().port
        );
    });

    this.socket.on('message', (message, info) => {  // info.address and info.port
        message = message.toString();
        if (message.endsWith('\n')) {
            message = message.substring(0, message.length - 1);
        }
        console.log('Receive: ' + message);
    });

    this.socket.bind(CB_PORT);

    this.set_mode(MODE.SINGLE);

    // emit the ready signal as we should be connected
    process.nextTick(() => {
        this.emit("ready", null);
    });
}

CodeyBot.prototype.send = function(message) {
    // sends a UDP messags to the socket

    let buffer = new Buffer(message);

    this.socket.send(buffer, 0, buffer.length, CB_PORT, this.hostname, (error, bytes) => {
        if (error) throw error;
        console.log('Send:    ' + message);
    });
};

CodeyBot.prototype.set_mode = function(mode) {
    // sets the linux mode
    this.send(`G5 ${mode}`);
};

CodeyBot.prototype.status = function() {
    // makes a status request which will then get dumped to the listener
    this.send("G1");
};

Object.defineProperty(CodeyBot, "volume", {
    set: function(value) {
        if (value > 150) value = 150;
        if (value < 0) value = 0;
        if (Number.isInteger(value)) {
            this.send(`G103 ${value}`);
        } else {
            throw new Error ("Volume must be a number between 0 and 150");
        }
    },
});

util.inherits(CodeyBot, events.EventEmitter);

module.exports = CodeyBot;

