/**
Sudoku Game by Maritta Gostanian
*/

// GRID VARIABLE 
var table;
// GAME NUMBER 
var gameID = 0;
// PUZZLE GRID 
var puzzle = [];
// SOLUTION GRID 
var solution = [];
// REMAINING NUMBER COUNTS 
var remaining = [9, 9, 9, 9, 9, 9, 9, 9, 9];
// Variable to check if "Sudoku Solver" solve the puzzle 
var isSolved = false;
var canSolved = true;
// STOPWATCH TIMER VARIABLES 
var timer = 0;
var pauseTimer = false;
var intervalId;
var gameOn = false;

function newGame(difficulty) {
  // get random position for numbers from 1 to 9 to generate a random puzzle 
  var grid = getGridInit();
  // prepare rows, columns, and blocks to solve the initialed grid 
  var rows = grid;
  var cols = getColumns(grid);
  var blks = getBlocks(grid);
  // generate allowed digits for each cell 
  var psNum = generatePossibleNumber(rows, cols, blks);
  // solve the grid 
  solution = solveGrid(psNum, rows, true);
  // reset the game state timer and remaining number 
  timer = 0;
  for (var i in remaining) {
    remaining[i] = 9;
  }
  // empty cells from grid depend on difficulty 
  // it will be: 
  // 59 empty cells for very easy 
  // 64 empty cells for easy 
  // 69 empty cells for normal 
  // 74 empty cells for hard 
  // 79 empty cells for expert 
  puzzle = makeItPuzzle(solution, difficulty);
  // game is on when the difficulty = [0, 4] 
  gameOn = difficulty < 5 && difficulty >= 0;
  // update the UI 
  ViewPuzzle(puzzle);
  updateRemainingTable();
  // start the timer 
  if (gameOn) {
    startTimer();
  }
}

function getGridInnit() {
  var rand = [];
  // for each digits from 1 to 9 find a random row and column 
  for (var i = 1; i <= 9; i++) {
    var row = Math.floor(Math.random() * 9);
    var col = Math.floor(Math.random() * 9);
    var accept = true;
    for (var j = 0; j < rand.length; j++) {
      // if number exist or there's a number already located in there, ignore and try again 
      if ((rand[j][0] == i) | ((rand[j][1] == row) & (rand[j][2] == col))) {
        accept = false;
        // try to get a new position for this number 
        i--;
        break;
      }
    }
    if (accept) {
      rand.push([i, row, col]);
    }
  }
  // initialise new empty grid 
  var result = [];
  for (var i = 0; i < 9; i++) {
    var row = "000000000";
    result.push(row);
  }
  // put numbers in the grid 
  for (var i = 0; i < rand.length; i++) {
    result[rand[i][1]] = replaceCharAt(result[rand[i][1]], rand[i][2], rand[i][0]);
  }
  return result;
}

// return columns from a row grid 
function getColumns(grid) {
  var result = ["", "", "", "", "", "", "", "", ""];
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      result[j] += grid[i][j];
    }
  }
  return result;
}

// return blocks from a row grid 
function getBlocks(grid) {
  var result = ["", "", "", "", "", "", "", "", ""];
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      result[Math.floor(i / 3) * 3 + Math.floor(j / 3)] +=grid[i][j];
    }
  }
  return result;
}

// function to replace char in string 
function replaceCharAt(string, index, char) {
  if (index > string.length - 1) {
    return string;
  }
  return string.substr(0, index) + char + string.substr(index + 1);
}

// get allowed numbers that can be placed in each cell 
function generatePossibleNumber(rows, columns, blocks) {
  var psb = [];
  // for each cell get number that are not viewed in a row, column or block 
  // if the cell is not empty, then allowed number is the number already exist in it 
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      psb[i * 9 + j] = "";
      if (rows[i][j] != 0) {
        psb[i * 9 + j] += rows[i][j];
      } else {
        for (var k = "1"; k <= "9"; k++) {
          if (!rows[i].includes(k))
            if(!columns[j].includes(k))
              if(!blocks[Math.floor(i / 3) * 3 + Math.floor(j / 3)].includes(k)) {
                psb[i * 9 + j] += k;
              }
        }
      }
    }
  }
  return psb;
}

function solveGrid(possibleNumber, rows, startFromZero) {
  var solution = [];
  // solve Sudoku with a backtracking algorithm 
  // Steps are: 
  // 1. get all allowed numbers that fit in each empty cell 
  // 2. generate all possible rows that fit in the first row depend on the allowed number list 
  // 3. select one row from possible row list and put it in the first row 
  // 4. go to next row and find all possible number that fit in each cell 
  // 5. generate all possible row fit in this row then go to step 3 until reach the last row or there aren't any possible rows left 
  // 6. if next row has no possible numbers left then go to the previous row and try the next possibility from possible rows' list 
  // 7. if the last row has reached and a row fit in it has found then the grid has solved 
  var result = nextStep(0, possibleNumber, rows, solution, startFromZero);
  if (result == 1) {
    return solution;
  }
}

// level is current row number in the grid 
function nextStep(level, possibleNumber, rows, solution, startFromZero) {
  // get possible number fit in each cell in this row 
  var x = possibleNumber.slice(level * 9, (level + 1) * 9);
  // generate possible numbers sequence that fit in the current row 
  var y = generatePossibleRows(x);
  if (y.length == 0) {
    return 0;
  }
  // to allow, check if solution is unique 
  var start = startFromZero ? 0 : y.length - 1;
  var stop = startFromZer ? y.length - 1 : 0;
  var step = startFromZero ? 1 : -1;
  var condition = startFromZero ? start <= stop : start >= stop; 
  // try every numbers sequence in this list and go to next row 
  for (var num = start; condition; num += step) {
    var condition = startFromZero ? num + step <= stop : num + step >= stop;
    for (var i = level + 1; i < 9; i++) {
      solution[i] = rows[i];
    }
    solution[level] = y[num];
    if (level < 8) {
      ver cols = getColumns(solution);
      var blocks = getBlocks(solution);
      var poss = generatePossibleNumber(solution, cols, blocks);
      if (nextStep(level + 1, poss, rows, solution, startFromZero) == 1) {
        return 1;
      }
    }
    if (level == 8) {
      return 1;
    }
  }
  return -1;
}
