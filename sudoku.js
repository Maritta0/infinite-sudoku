// GRID VARIABLE 
var table;
// GAME NUMBER 
var gameID = 0;
// PUZZLE GRID (array of 9 strings, each "012345678")
var puzzle = [];
// SOLUTION GRID 
var solution = [];
// REMAINING NUMBER COUNTS 
var remaining = [9, 9, 9, 9, 9, 9, 9, 9, 9];
// SOLVER STATE 
var isSolved = false;
var canSolved = true;
// TIMER 
var timer = 0;
var pauseTimer = false;
var intervalId;
var gameOn = false;

/* ----------------------------
   Helper / generator functions
   ---------------------------- */

// create initial grid with one random position for numbers 1...9
function getGridInit() {
  var rand = [];
  // pick a random unique (number,row,col) positions 
  for (var n = 1; n <= 9; n++) {
    var tries = 0;
    while (true) {
      var row = Math.floor(Math.random() * 9);
      var col = Math.floor(Math.random() * 9);
      var ok = true;
      for (var j = 0; j < rand.length; j++) {
        // if same number already chosen or exact cell taken 
        if (rand[j][0] === n || (rand[j][1] === row && rand[j][2] === col)) {
          ok = false;
          break;
        }
      }
      if (ok) {
        rand.push([n, row, col]);
        break;
      }
      tries++;
      if (tries > 100) {
        // fallback - break to avoid infinite loop 
        rand.push([n, row, col]);
        break;
      }
    }
  }
  var result = [];
  for (var r = 0; r < 9; r++) result.push("000000000");
  for (var i = 0; i < rand.length; i++) {
    var n = String(rand[i][0]);
    var rr = rand[i][1];
    var cc = rand[i][2];
    result[rr] = replaceCharAt(result[rr], cc, n);
  }
  return result;
}

// get columns from rows (both arrays of strings) 
function getColumns(grid) {
  var result = ["", "", "", "", "", "", "", "", ""];
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      result[j] += grid[i][j];
    }
  }
  return result;
}

// get 3x3 blocks as strings 
function getBlocks(grid) {
  var result = ["", "", "", "", "", "", "", "", ""];
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
       var idx = Math.floor(i/3)*3 + Math.floor(j/3);
      result[idx] += grid[i][j];
    }
  }
  return result;
}

function replaceCharAt(string, index, char) {
  if (index < 0 || index > string.length - 1) return string;
  return string.substr(0, index) + char + string.substr(index + 1);
}

// possible numbers for each cell (returns array length 81 with strings of allowed digits) 
function generatePossibleNumber(rows, columns, blocks) {
   var psb = [];
   for (var i = 0; i < 9; i++) {
     for (var j = 0; j < 9; j++) {
       var idx = i*9 + j;
        psb[idx] = "";
        if (ch !== "0") {
           psb[idx] = ch; // already filled 
        } else {
           for (var k = 1; k <= 9; k++) {
              var s = String(k);
              if (!rows[i].includes(s) && !columns[j].includes(s) && !blocks[Math.floor(i/3)*3 + Math.floor(j/3)].includes(s)) {
                 psb[idx] += s;
              }
           }
        }
     }
   }
   return psb;
}

/* -------------------
   Backtracking solver 
   ------------------- */

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
   // 7. if the last row has reached and a row fit in it has found then the grid is solved 
   var result = nextStep(0, possibleNumber, rows, solution, startFromZero);
   if (result === 1) return solution;
   // if result not 1, no solution found -> undefined 
   return undefined;
}

// helper to try filling rows recursively 
function nextStep(level, possibleNumber, rows, solution, startFromZero) {
   var x = possibleNumber.slice(level * 9, (level + 1) * 9);
   var y = generatePossibleRows(x); // all possible rows fitting this row 
   if (y.length === 0) return 0;
   // to allow, check if solution is unique 
   var start = startFromZero ? 0 : y.length - 1;
   var stop = startFromZer ? y.length - 1 : 0;
   var step = startFromZero ? 1 : -1;
   // iterate through possible rows 
   for (var num = start; startFromZero ? num <= stop : num >= stop; num += step) {
      // copy remaining rows (for later checks) 
      for (var i = level + 1; i < 9; i++) solution[i] = rows[i];
      solution[level] = y[num];
      if (level < 8) {
         ver cols = getColumns(solution);
         var blks = getBlocks(solution);
         var poss = generatePossibleNumber(solution, cols, blks);
         if (nextStep(level + 1, poss, rows, solution, startFromZero) === 1) {
            return 1;
         }
      } else {
         // last row filled successfully 
         return 1;
      }
   }
   return -1;
}

// generate all row strings that match possibleNumber (array of 9 strings) 
function generatePossibleRows(possibleNumber) {
   var result = [];
   function step(level, curRow) {
      if (level === 9) {
         result.push(curRow);
         return;
      }
      var options = possibleNumber[level];
      for (var k = 0; k < options.length; k++) {
         var d = options[k];
         if (curRow.includes(d)) continue; // cannot repeat digit in row 
         step(level + 1, curRow + d);
      }
   }
   step(0, "");
   return result;
}

/* ---------------------------------------
   Make puzzle by removing symmetric cells 
   --------------------------------------- */
function makeItPuzzle(grid, difficulty) {
   // if difficulty not valid, show solved grid 
   if (!(difficulty < 5 && difficulty > -1)) difficulty = 13;
   var remainedValues = 81;
   var puzzleLocal = grid.slice(0); // shallow copy of rows (strings) 
   function getSymmetry(x, y) {
      return [8 - x, 8 - y];
    }
    function clearValue(gridArr, x, y) {
       var sym = getSymmetry(x, y);
       if (gridArr[y][x] !== "0") {
          gridArr[y] = replaceCharAt(gridArr[y], x, "0");
          remainedValues--;
          if (!(x === sym[0] && y === sym[1])) {
             if (gridArr[sym[1]][sym[0]] !== "0") {
                gridArr[sym[1]] = replaceCharAt(gridArr[sym[1]], sym[0], "0");
                remainedValues--;
             }
          }
       }
    }
   while (remainedValues > difficulty * 5 + 20) {
      var x = Math.floor(Math.random() * 9);
      var y = Math.floor(Math.random() * 9);
      clearValue(puzzleLocal, x, y);
      // safety fallback in case loop runs too long 
      if (remainedValues < 0) break;
   }
   return puzzleLocal;
}


/* ---------------------------
   UI: render / read / helpers 
   --------------------------- */ 

function ViewPuzzle(grid) {
   // grid is array of 9 strings 
   for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
         var input = table.rows[i].cells[j].getElementsByTagName("input")[0];
         // reset classes and value 
         addClassToCell(input);
         var ch = grid[i][j];
         if (ch === "0") {
            input.disabled = false;
            input.value = "";
         } else {
            input.disabled = true;
            inpute.value = ch;
         }
      }
   }
   // recompute remaining numbers from scratch 
   remaining = [9, 9, 9, 9, 9, 9, 9, 9, 9];
   for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
         var v = table.rows[r].cells[c].getElementsByTagName("input")[0].value;
         if (v >= "1" && v <= "9") remaining[Number(v) - 1]--;
      }
   }
}

function readInput() {
   var result = [];
   for (var i = 0; i < 9; i++) {
      var row = "";
      for (var j = 0; j < 9; j++) {
         var input = table.rows[i].cells[j].getElementsByTagName("input")[0];
         if (!input || input.value === "" || input.value.length > 1 || input.value === "0") {
            input.value = "";
            row += "0";
         } else {
            row += input.value;
         }
      }
      result.push(row);
   }
   return result;
}

// check single value validity  
// returns codes: 
// 0 can't be changed/empty, 1 correct, 2 allowed but not correct, 3 conflict, 4 invalid input 
function checkValue(value, row, column, block, defaultValue, currectValue) {
   if (value === "" || value === "0") return 0;
   if (!(value > "0" && value < ":")) return 4;
   if (value === defaultValue) return 0;
   if (row.indexOf(value) !== row.lastIndexOf(value) || 
       column.indexOf(value) !== column.lastIndexOf(value) || 
       block.indexOf(value) !== block.lastIndexOf(value)) {
      return 3;
   }
   if (value !== currectValue) return 2;
   return 1;
}

function addClassToCell(input, className) {
   input.classList.remove("right-cell");
   input.classList.remove("warning-cell");
   input.classList.remove("wrong-cell");
   if (className) input.classList.add(className);
}

function updateRemainingTable() {
   for (var i = 1; i < 9; i++) {
      var item = document.getElementById("remain-" + i);
      if (!item) continue;
      item.innerText = remaining[i - 1];
      item.classList.remove("red");
      item.classList.remove("gray");
      if (remaining[i - 1] === 0) item.classList.add("gray");
      else if (remaining[i - 1] < 0 || remaining[i - 1] > 9) item.classList.add("red");
   }
}

/* -----
   Timer 
   ----- */
function startTimer() {
   var timerDiv = document.getElementById("timer");
   clearInterval(intervalId);
   pauseTimer = false;
   intervalId = setInterval(function () {
      if (!pauseTimer) {
         timer++;
         var min = Math.floor(timer / 60);
         var sec = timer % 60;
         timerDiv.innerText = (("" + min).length < 2 ? "0" + min : min ) + ":" + (("" + sec).length < 2 ? "0" + sec : sec);
      }
   }, 1000);
}

/* ---------------------
   Solve/check/hint flow 
   --------------------- */

function solveSudoku(changeUI) {
   puzzle = readInput();
   var columns = getColumns(puzzle);
   var blocks = getBlocks(puzzle);
   // check if there is any conflict 
   var errors = 0;
   var correctCount = 0;
   for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
         var res = checkValue(puzzle[i][j], puzzle[i], columns[j], blocks[Math.floor(i / 3) * 3 + Math.floor(j / 3)], "-1", "-1");
         correctCount += (res === 2 ? 1 : 0);
         errors += (res > 2 ? 1 : 0);
         addClassToCell(table.rows[i].cells[j].getElementsByTagName("input")[0], res > 2 ? "wrong-cell" : undefined);
      }
   }
   if (errors > 0) {
      canSolved = false;
      return 2; // invalid input 
   }
   canSolved = true;
   isSolved = true;
   if (correctCount === 81) return 1; // already solved 
   var timeStart = Date.now();
   solution = solveGrid(generatePossibleNumber(puzzle, columns, blocks), puzzle, true);
   var took = Date.now() - timeStart;
   if (changeUI) {
      document.getElementById("timer").innerText = Math.floor(took / 1000) + "." + ("000" + (took % 1000)).slice(-3);
   }
   if (solution === undefined) {
      isSolved = false;
      canSolved = false;
      return 3; // no solution 
   }
   if (changeUI) {
      remaining = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      updateRemainingTable();
      ViewPuzzle(solution);
   }
   return 0;
}

/* --------------------------
   UI helpers (menus/dialogs)
   -------------------------- */

function hideMoreOptionMenu() {
   var moreOptionList = document.getElementById("more-option-list");
   if (!moreOptionList) return;
   if (moreOptionList.style.visibility === "visible") {
      moreOptionList.style.maxWidth = "40px";
      moreOptionList.style.minWidth = "40px";
      moreOptionList.style.maxHeight = "10px";
      moreOptionList.style.opacity = "0";
      setTimeout(function() {moreOptionList.style.visibility = "hidden"; }, 175);
   }
}

function showDialogClick(dialogId) {
   hideHamburgerClick();
   var dialog = document.getElementById(dialogId);
   var dialogBox = document.getlElementById(dialogId + "-box");
   if (!dialog || !dialogBox) return;
   dialogBox.focus();
   dialog.style.opacity = 0;
   dialogBox.style.marginTop = "-500px";
   dialog.style.display = "block";
   dialog.style.visibility = "visible";
   setTimeout(function(){ dialog.style.opacity = 1; dialogBox.style.marginTop = "64px"; }, 200);
}

function moreOptionButtonClick() {
   var moreOptionList = document.getElementById("more-option-list");
   if(!moreOptionList) return;
   setTimeout(function(){
      if (moreOptionList.style.visibility === "hidden") {
         moreOptionList.style.visibility = "visible";
         setTimeout(function () {
            moreOptionList.style.maxWidth = "160px";
            moreOptionList.style.minWidth = "160px";
            moreOptionList.style.maxHeight = "160px";
            moreOptionList.style.opacity = "1";
         }, 50);
      }
   }, 50);
}

function hideDialogButtonClick(dialogId) {
   var dialog = document.getElementById(dialogId);
   var dialogBox = document.getElementById(dialogId + "-box");
   if (!dialog || !dialogBox) return;
   dialog.style.opacity = 0;
   dialogBox.style.marginTop = "-500px";
   setTimeout(function(){ dialog.style.visibility = "collapse"; dialog.style.display = "none"; }, 500);
}

function hideHamburgerClick() {
   var div = document.getElementById("hamburger-menu");
   var menu = document.getElementById("nav-menu");
   if (!div || !menu) return;
   menu.style.left = "-256px";
   setTimeout(function(){ div.style.opacity = 0; div.style.visibility = "collapse"; div.style.display = "none"; }, 200);
}

/* --------------------------------------
   Controls: new/pause/check/restart/hint 
   -------------------------------------- */ 

function newGame(difficulty) {
   var grid = getGridInit();
   var rows = grid;
   var cols = getColumns(grid);
   var blks = getBlocks(grid);
   var psNum = generatePossibleNumber(rows, cols, blks);
   solution = solveGrid(psNum, rows, true);
   timer = 0;
   for (var i = 0; i < 9; i++) remaining[i] = 9;
   puzzle = makeItPuzzle(solution, difficulty);
   gameOn = difficulty < 5 && difficulty >= 0;
   ViewPuzzle(puzzle);
   updateRemainingTable();
   if (gameOn) startTimer();
   // show controls 
   document.getElementById("moreoption-sec").style.display = "block";
   document.getElementById("pause-btn").style.display = "block";
   document.getElementById("check-btn").style.display = "block";
}

function getSelectedDifficulty(){
   var difficulties = document.getElementsByName("difficulty");
   for (var i = 0; i < difficulties.length; i++) {
      if (difficulties[i].checked) return i; // 0 -> very easy etc 
   }
return -1;
}
   

function startGameButtonClick() {
   var difficulties = document.getElementsByName("difficulty");
   var difficultyIndex = getSelectedDifficulty();
   var difficulty = 5; // default solved 
   if (difficultyIndex >= 0) {
      // map index -> difficulty used (4 - index)
      difficulty = 4 - difficultyIndex;
      newGame(difficulty);
   } else {
      // show solved grid 
      newGame(5);
   }
   hideDialogButtonClick("dialog");
   gameID++;
   document.getElementById("game-number").innerText = "game #" + gameID;
   document.getElementById("timer-label").innerText = "Time";
   document.getElementById("game-difficulty-label").innerText = "Game difficulty";
   var diffLabe1 = (difficultyIndex >= 0 ? document.getElementsByName("difficulty")[difficultyIndex].value : "solved");
   document.getElementById("game-difficulty").innerText = diffLabe1;
   // show options in side card too 
   var pauseBtn2 = document.getElementById("pause-btn-2");
   var checkBtn2 = document.getElementById("check-btn-2");
   if (pauseBtn2) pauseBtn2.style.display = "block";
   if (checkBtn2) checkBtn2.style.display = "block";
}

function pauseGameButtonClick() {
   var icon = document.getElementById("pause-icon");
   var label = document.getElementById("pause-text");
   if (pauseTimer) {
      icon.innerText = "pause";
      label.innerText = "Pause";
      if (table) table.style.opacity = 1;
   } else {
      icon.innerText = "play_arrow";
      label.innerText = "Continue";
      if (table) table.style.opacity = 0;
   }
   pauseTimer = !pauseTimer;
}

function checkButtonClick() {
   if (!gameOn) return;
   timer += 60;
   var currentGrid = readInput();
   var columns = getColumns(currentGrid);
   var blocks = getBlocks(currentGrid);
   var errors = 0;
   var corrects = 0;
   for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
         if (currentGrid[i][j] === "0") continue;
         var result = checkValue(currentGrid[i][j], currentGrid[i], columns[j], blocks[Math.floor(i / 3) * 3 + Math.floor(j / 3)], puzzle[i][j], solution[i] ? solution[i][j] : "-1");
         var cellInput = table.rows[i].cells[j].getElementsByTagName("input")[0];
         addClassToCell(cellInput, result === 1 ? "right-cell" : result === 2 ? "warning-cell" : result === 3 ? "wrong-cell" : undefined);
         if (result === 1 || result === 0) corrects++;
         else if (result === 3) errors++;
      }
   }
   if (corrects === 81) {
      gameOn = false;
      pauseTimer = true;
      clearInterval(intervalId);
      document.getElementById("game-difficulty").innerText = "Solved";
      alert("Congrats, You solved it!");
   } else if (errors === 0 && corrects === 0) {
      alert("Congrats, You solved it, but this is not the solution that I want.");
   }
}

function restartButtonClick() {
   if (!gameOn) return;
   for (var i = 0; i < 9; i++) remaining[i] = 9;
   ViewPuzzle(puzzle);
   updateRemainingTable();
   timer = -1; // will start from 0 on next tick 
}


// surrender 
function SurrenderButtonClick() {
  if (gameOn) {
    // reset remaining number table 
    for (var i in remaining) {
      remaining[i] = 9;
    }
    // review puzzle 
    ViewPuzzle(solution);
    // update remaining numbers table 
    updateRemainingTable();
    // stop the game 
    gameOn = false;
    pauseTimer = true;
    clearInterval(intervalId);
    // mark game as solved 
    document.getElementById("game-difficulty").innerText = "Solved";
  }
}

// hint 
function hintButtonClick() {
  if (gameOn) {
    // get list of empty cells and list of wrong cells 
    var empty_cells_list = [];
    var wrong_cells_list = [];
    for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
        var input = table.rows[i].cells[j].getElementsByTagName("input")[0];
        if (input.value == "" || input.value.length > 1 || input.value == "0") {
          empty_cells_list.push([i, j]);
        } else {
          if (input.value !== solution[i][j]) {
            wrong_cells_list.push([i, j]);
          }
        }
      }
    }
    // check if gird is solved, if so stop the game 
    if (empty_cells_list.length === 0 && wrong_cells_list.length === 0) {
      gameOn = false;
      pauseTimer = true;
      document.getElementById("game-difficulty").innerText = "Solved";
      clearInterval(intervalId);
      alert("Congrats, You solved it.");
    } else {
        // add one minute to the stopwatch as a cost for given hint 
        timer += 60;
        // get random cell from empty or wrong list and put the currect value in it 
        var input;
        if ((Math.random() < 0.5 && empty_cells_list.length > 0) || wrong_cells_list.length === 0) {
          var index = Math.floor(Math.random() * empty_cells_list.length);
          input = table.rows[empty_cells_list[index][0]].cells[empty_cells_list[index][1]].getElementsByTagName("input")[0];
          input.oldvalue = input.value;
          input.value =solution[empty_cells_list[index][0]][empty_cells_list[index][1]];
          remaining[input.value - 1]--;
        } else {
          var index = Math.floor(Math.random() * wrong_cells_list.length);
          input = table.rows[wrong_cells_list[index][0]].cells[wrong_cells_list[index][1]].getElementsByTagName("input")[0];
          input.oldvalue = input.value;
          remaining[input.value - 1]++;
          input.value = solution[wrong_cells_list[index][0]][wrong_cells_list[index][1]];
          remaining[input.value - 1]--;
        }
        // update remaining numbers 
        updateRemainingTable();
      }
      // make updated cell blinking 
      var count = 0;
      for (var i = 0; i < 6; i++) {
        setTimeout(function() {
          if (count % 2 == 0) {
            input.classList.add("right-cell");
          } else {
            input.classList.remove("right-cell");
          }
          count++;
        }, i * 750);
      }
  }
}

function showDialogClick(dialogId) {
  // to hide navigation bar if it opened 
  hideHamburgerClick();
  var dialog = document.getElementById(dialogId);
  var dialogBox = document.getElementById(dialogId + "-box");
  dialogBox.focus();
  dialog.style.opacity = 0;
  dialogBox.style.marginTop = "-500px";
  dialog.style.display = "block";
  dialog.style.visibility = "visible";
  // to view and move the dialog to the correct position after it set visible 
  setTimeout(function() {dialog.style.opacity = 1; dialogBox.style.marginTop = "64px";}, 200);
}

// show more option menu 
function moreOptionButtonClick() {
  var moreOptionList = document.getElementById("more-option-list");
  // timeout to avoid hide menu immediately in window event 
  setTimeout(function() {
    if (moreOptionList.style.visibility == "hidden") {
      moreOptionList.style.visibility = "visible";
      setTimeout(function() {moreOptionList.style.maxWidth = "160px"; moreOptionList.style.minWidth = "160px"; moreOptionList.style.maxHeight = "160px"; moreOptionList.style.opacity = "1";}, 50);
    }
  }, 50);
}

function hideDialogButtonClick(dialogId) {
  var dialog = document.getElementById(dialogId);
  var dialogBox = document.getElementById(dialogId + "-box");
  dialog.style.opacity = 0;
  dialogBox.style.marginTop = "-500px";
  setTimeout(function() {dialog.style.visibility = "collapse";}, 500);
}

// hide hamburger menu when click outside 
function hideHamburgerClick() {
  var div = document.getElementById("hamburger-menu");
  var menu = document.getElementById("nav-menu");
  menu.style.left = "-256px";
  setTimeout(function() {div.style.opacity = 0; div.style.visibility = "collapse";}, 200);
}
