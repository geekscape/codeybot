#!/usr/bin/env node

/*
 * Description
 * ~~~~~~~~~~~
 * NodeJS support for MakeBlock CodeyBot LED Matrix screen.
 * Provides simple low-level graphics support, e.g clear screen,
 *   draw point, line,horizontal line, vertical line, rectangle and cirle.
 *
 * Author(s): Andrew Fisher (@ajfisher)  https://github.com/ajfisher
 *            Andy Gelme    (@geekscape) https://github.com/geekscape
 *
 * Resources
 * ~~~~~~~~~
 * Titan Micro Electronics TM1640: 16 x 8 LED driver datasheet (Chinese)
 * https://dl.dropboxusercontent.com/u/8663580/TM1640.pdf
 *
 * To Do
 * ~~~~~
 * - Check all function parameters are within range (bounds).
 */

var WIDTH  = 19;
var HEIGHT = 13;

var font = require('oled-font-5x7');

function initialize() {
  return(new Buffer(31));  // 247 packed bits (19 columns x 13 rows)
}

function clear_screen(screen, value) {  // value = 0xff for all LEDS on
  if (typeof(value) === 'undefined') value = 0;
  screen.fill(value);
//write_screen(screen);
}

function invert_screen(screen) {
  for (var index = 0;  index < screen.length;  index ++) {
    screen[index] = screen[index] ^ 0xff;
  }
}

function draw_point(screen, column, row, value) {
  var index = WIDTH * row + column;
  var byte  = Math.floor(index / 8);
  var bit   = 7 - (index % 8);

  var value = (typeof(value) === 'undefined')  ?  1  :  value;
  var mask  = 0xff ^ (1 << bit);

  screen[byte] = screen[byte] & mask | (value << bit);
}

// Bresenham's line algorithm

function draw_line(screen, column0, row0, column1, row1, value) {
  var column_delta = Math.abs(column1 - column0);
  var row_delta    = Math.abs(row1    - row0);

  var column_increment = column0 < column1 ? 1 : -1;
  var row_increment    = row0    < row1    ? 1 : -1;

  var error = (column_delta > row_delta ? column_delta : -row_delta) / 2;

  while (true) {
    draw_point(screen, column0, row0, value);

    if (column0 === column1  &&  row0 === row1) break;

    var error2 = error;

    if (error2 > -column_delta) {
      error   -= row_delta;
      column0 += column_increment;
    }

    if (error2 < row_delta) {
      error += column_delta;
      row0  += row_increment;
    }
  }
}

function draw_lineh(screen, column, row, length, value) {
  for (var index = column;  index < column + length;  index ++) {
    draw_point(screen, index, row, value);
  }
}

function draw_linev(screen, column, row, length, value) {
  for (var index = row;  index < row + length;  index ++) {
    draw_point(screen, column, index, value);
  }
}

function draw_rectangle(screen, row, column, width, height, value) {
  draw_lineh(screen, column, row,              width,  value);
  draw_lineh(screen, column, row + height - 1, width,  value);
  draw_linev(screen, column, row,              height, value);
  draw_linev(screen, column + width - 1, row,  height, value);
}

function fill_rectangle(screen, column, row, width, height, value) {
  for (var index = 0;  index < width;  index ++) {
    draw_linev(screen, column + index, row, height, value);
  }
}

// Bresenham's line algorithm extended for circles

function draw_circle(screen, column, row, radius, value) {
  var x = radius, y = 0;
  var radiusError = 1 - x;

  while (x >= y) {
    draw_point(screen, -y + column, -x + row, value);
    draw_point(screen,  y + column, -x + row, value);
    draw_point(screen, -x + column, -y + row, value);
    draw_point(screen,  x + column, -y + row, value);
    draw_point(screen, -x + column,  y + row, value);
    draw_point(screen,  x + column,  y + row, value);
    draw_point(screen, -y + column,  x + row, value);
    draw_point(screen,  y + column,  x + row, value);
    y++;

    if (radiusError < 0) {
      radiusError += 2 * y + 1;
    }
    else {
      x --;
      radiusError += 2 * (y - x + 1);
    }
  }
}

function fill_circle(screen, column, row, radius, value) {
  var x = radius, y = 0;
  var radiusError = 1 - x;

  while (x >= y) {
    draw_line(screen, -y + column, -x + row, y + column, -x + row, value);
    draw_line(screen, -x + column, -y + row, x + column, -y + row, value);
    draw_line(screen, -x + column,  y + row, x + column,  y + row, value);
    draw_line(screen, -y + column,  x + row, y + column,  x + row, value);
    y++;

    if (radiusError < 0) {
      radiusError += 2 * y + 1;
    }
    else {
      x --;
      radiusError+= 2 * (y - x + 1);
    }
  }
}

// Thanks Suz (@noopkat) !
// https://github.com/noopkat/oled-font-5x7

function draw_character(screen, column, row, character, value) {
  var lookup   = index = font.lookup.indexOf(character) * 5;
  var fontData = font.fontData.slice(lookup, lookup + 5);

  for (var index_c = 0;  index_c < fontData.length;  index_c ++) {
    var font_c = fontData[index_c];

    for (var index_r = 0;  index_r < 7;  index_r ++) {
      if (font_c & 0x01) {
        draw_point(screen, column + index_c, row + index_r, value);
      }
      font_c = font_c >> 1;
    }
  }
}

module.exports = {
  initialize:     initialize,
  clear_screen:   clear_screen,
  invert_screen:  invert_screen,
  draw_point:     draw_point,
  draw_line:      draw_line,
  draw_lineh:     draw_lineh,
  draw_linev:     draw_linev,
  draw_rectangle: draw_rectangle,
  fill_rectangle: fill_rectangle,
  draw_circle:    draw_circle,
  fill_circle:    fill_circle,
  draw_character: draw_character
};
