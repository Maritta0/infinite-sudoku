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
