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
