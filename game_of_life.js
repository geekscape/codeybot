/*
 * Conway's Game of Life
 * A simple Javascript implementation by ankr
 * @author http://ankr.dk
 * https://github.com/nomatteus/conway-game-of-life-js/blob/master/gameoflife.js
 *
 * Modified to work on CodeyBot
 */

/*
 * Initialize game: create the world and start simulation
 */

const SIZE  = 64;
var   cells = [];

function initialize(led_screen, screen, robot_write_screen) {
  for (var x = 0; x < SIZE; x ++) {
    cells[x] = [];
    for (var y = 0; y < SIZE; y ++) cells[x][y] = 0;
  }

// Prefilled cells: Gosper glider gun
  [
    [1,  5],[1,  6],[ 2, 5],[ 2, 6],[11, 5],[11, 6],[11, 7],[12, 4],[12, 8],
    [13, 3],[13, 9],[14, 3],[14, 9],[15, 6],[16, 4],[16, 8],[17, 5],[17, 6],
    [17, 7],[18, 6],[21, 3],[21, 4],[21, 5],[22, 3],[22, 4],[22, 5],[23, 2],
    [23, 6],[25, 1],[25, 2],[25, 6],[25, 7],[35, 3],[35, 4],[36, 3],[36, 4]
  ]
  .forEach(function(point) {
    cells[point[0]][point[1]] = 1;
  });

  update(led_screen, screen, robot_write_screen);
}

/*
 * Check which cells are still alive
 */

function update(led_screen, screen, robot_write_screen) {
  var result = [];

/*
 * Return amount of alive neighbours for a cell
 */

  function _countNeighbours(x, y) {
    var amount = 0;

    function _isFilled(x, y) {
      return cells[x]  &&  cells[x][y];
    }

    if (_isFilled(x-1, y-1)) amount ++;
    if (_isFilled(x,   y-1)) amount ++;
    if (_isFilled(x+1, y-1)) amount ++;
    if (_isFilled(x-1, y  )) amount ++;
    if (_isFilled(x+1, y  )) amount ++;
    if (_isFilled(x-1, y+1)) amount ++;
    if (_isFilled(x,   y+1)) amount ++;
    if (_isFilled(x+1, y+1)) amount ++;

    return(amount);
  }

  cells.forEach(function(row, x) {
    result[x] = [];
    row.forEach(function(cell, y) {
      var alive = 0,
          count = _countNeighbours(x, y);

      if (cell > 0) {
        alive = count === 2 || count === 3 ? 1 : 0;
      }
      else {
        alive = count === 3 ? 1 : 0;
      }

      result[x][y] = alive;
    });
  });

  cells = result;

  draw(led_screen, screen, robot_write_screen);
}

/*
 * Draw cells
 */

function draw(led_screen, screen, robot_write_screen) {
  led_screen.clear_screen(screen);

  cells.forEach(function(row, x) {
    row.forEach(function(cell, y) {
      if (x < 19 && y < 13 && cell) led_screen.draw_point(screen, x, y);
    });
  });

  robot_write_screen(screen);

  setTimeout(function() {
    update(led_screen, screen, robot_write_screen);
  }, 100);
}

module.exports = {
  initialize: initialize
};
