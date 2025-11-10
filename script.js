// GRID VARIABLE 
var table;
// GAME NUMBER 
var gameID = 0;
// PUZZLE GRID (array of 9 strings)
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
  for (var n = 1; n <= 9; n++) {
    var tries = 0;
    while (true) {
      var row = Math.floor(Math.random() * 9);
      var col = Math.floor(Math.random() * 9);
      var ok = true;
      for (var j = 0; j < rand.length; j++) {
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
      if (tries > 100) { rand.push([n, row, col]); break; }
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

// get columns from rows 
function getColumns(grid) {
  var result = ["", "", "", "", "", "", "", "", ""];
  for (var i = 0; i < 9; i++) {
    for (var j = 0; j < 9; j++) {
      result[j] += grid[i][j];
    }
  }
  return result;
}

// get 3x3 blocks 
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

// possible numbers for each cell (81-length array of allowed digits) 
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
   var result = nextStep(0, possibleNumber, rows, solution, startFromZero);
   if (result === 1) return solution;
   return undefined;
}

function nextStep(level, possibleNumber, rows, solution, startFromZero) {
   var x = possibleNumber.slice(level * 9, (level + 1) * 9);
   var y = generatePossibleRows(x);
   if (y.length === 0) return 0;
   var start = startFromZero ? 0 : y.length - 1;
   var stop = startFromZero ? y.length - 1 : 0;
   var step = startFromZero ? 1 : -1;
   for (var num = start; startFromZero ? num <= stop : num >= stop; num += step) {
      for (var i = level + 1; i < 9; i++) solution[i] = rows[i];
      solution[level] = y[num];
      if (level < 8) {
         var cols = getColumns(solution);
         var blks = getBlocks(solution);
         var poss = generatePossibleNumber(solution, cols, blks);
         if (nextStep(level + 1, poss, rows, solution, startFromZero) === 1) return 1;
      } else {
         return 1;
      }
   }
   return -1;
}

function generatePossibleRows(possibleNumber) {
   var result = [];
   function step(level, curRow) {
      if (level === 9) { result.push(curRow); return; }
      var options = possibleNumber[level];
      for (var k = 0; k < options.length; k++) {
         var d = options[k];
         if (curRow.includes(d)) continue;
         step(level + 1, curRow + d);
      }
   }
   step(0, "");
   return result;
}

/* Make puzzle by removing symmetric cells */
function makeItPuzzle(grid, difficulty) {
   if (!(difficulty < 5 && difficulty > -1)) difficulty = 13;
   var remainedValues = 81;
   var puzzleLocal = grid.slice(0);
   function getSymmetry(x, y){ return [8-x, 8-y]; }
   function clearValue(gridArr, x, y) {
       var sym = getSymmetry(x, y);
       if (gridArr[y][x] !== "0") {
          gridArr[y] = replaceCharAt(gridArr[y], x, "0"); remainedValues--;
          if (!(x === sym[0] && y === sym[1])) {
             if (gridArr[sym[1]][sym[0]] !== "0") {
                gridArr[sym[1]] = replaceCharAt(gridArr[sym[1]], sym[0], "0"); remainedValues--;
             }
          }
       }
   }
   var safety = 0;
   while (remainedValues > difficulty * 5 + 20 && safety < 10000) {
      var x = Math.floor(Math.random() * 9);
      var y = Math.floor(Math.random() * 9);
      clearValue(puzzleLocal, x, y);
      safety++;
   }
   return puzzleLocal;
}


/* UI: render / read / helpers */ 
function ViewPuzzle(grid) {
   for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
         var input = table.rows[i].cells[j].getElementsByTagName("input")[0];
         addClassToCell(input);
         var ch = grid[i][j];
         if (ch === "0") { input.disabled = false; input.value = ""; } 
         else { input.disabled = true; inpute.value = ch; }
      }
   }
   // recompute remaining numbers 
   remaining = [9, 9, 9, 9, 9, 9, 9, 9, 9];
   for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
         var v = table.rows[r].cells[c].getElementsByTagName("input")[0].value;
         if (v >= "1" && v <= "9") remaining[Number(v) - 1]--;
      }
   }
   updateRemainingTable();
}

function readInput() {
   var result = [];
   for (var i = 0; i < 9; i++) {
      var row = "";
      for (var j = 0; j < 9; j++) {
         var input = table.rows[i].cells[j].getElementsByTagName("input")[0];
         if (!input || input.value === "" || input.value.length > 1 || input.value === "0") {
            if (input) input.value = "";
            row += "0";
         } else row += input.value;
      }
      result.push(row);
   }
   return result;
}

// 0 can't be changed/empty, 1 correct, 2 allowed but not correct, 3 conflict, 4 invalid input 
function checkValue(value, row, column, block, defaultValue, currectValue) {
   if (value === "" || value === "0") return 0;
   if (!(value > "0" && value < ":")) return 4;
   if (value === defaultValue) return 0;
   if (row.indexOf(value) !== row.lastIndexOf(value) || 
       column.indexOf(value) !== column.lastIndexOf(value) || 
       block.indexOf(value) !== block.lastIndexOf(value)) return 3;
   if (value !== currectValue) return 2;
   return 1;
}

function addClassToCell(input, className) {
   if (!input) return;
   input.classList.remove("right-cell");
   input.classList.remove("warning-cell");
   input.classList.remove("wrong-cell");
   if (className) input.classList.add(className);
}

function updateRemainingTable() {
   for (var i = 1; i <= 9; i++) {
      var item = document.getElementById("remain-" + i);
      if (!item) continue;
      item.innerText = remaining[i - 1];
      item.classList.remove("red");
      item.classList.remove("gray");
      if (remaining[i - 1] === 0) item.classList.add("gray");
      else if (remaining[i - 1] < 0 || remaining[i - 1] > 9) item.classList.add("red");
   }
}

/* Timer */
function startTimer() {
   var timerDiv = document.getElementById("timer");
   clearInterval(intervalId);
   pauseTimer = false;
   intervalId = setInterval(function() {
      if (!pauseTimer) {
         timer++;
         var min = Math.floor(timer/60);
         var sec = timer % 60;
         timerDiv.innerText = (("" + min).length < 2 ? "0"+min : min) + ":" + (("" + sec).length < 2 ? "0"+sec : sec);
      }
   }, 1000);
}

/* Solve/check/hint flow */
function solveSudoku(changeUI) {
   puzzle = readInput();
   var columns = getColumns(puzzle);
   var blocks = getBlocks(puzzle);
   var errors = 0;
   var correctCount = 0;
   for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
         var res = checkValue(puzzle[i][j], puzzle[i], columns[j], blocks[Math.floor(i/3)*3 + Math.floor(j/3)], "-1", "-1");
         correctCount += (res === 2 ? 1 : 0);
         errors += (res > 2 ? 1 : 0);
         var input = table.rows[i].cells[j].getElementsByTagName("input")[0];
         addClassToCell(input, res > 2 ? "wrong-cell" : undefined);
      }
   }
   if (errors > 0) { canSolved = false; return 2; }
   canSolved = true; isSolved = true;
   if (correctCount === 81) return 1;
   var timeStart = Date.now();
   solution = solveGrid(generatePossibleNumber(puzzle, getColumns(puzzle), getBlocks(puzzle)), puzzle, true);
   var took = Date.now() - timeStart;
   if (changeUI) document.getElementById("timer").innerText = Math.floor(took/1000) + "." + ("000" + (took % 1000)).slice(-3);
   if (solution === undefined) { isSolved = false; canSolved = false; return 3; }
   if (changeUI) {
      remaining = [0, 0, 0, 0, 0, 0, 0, 0, 0];
      updateRemainingTable();
      ViewPuzzle(solution);
   }
   return 0;
}

/* UI helpers */
function hideMoreOptionMenu() {
   var moreOptionList = document.getElementById("more-option-list");
   if (!moreOptionList) return;
   if (moreOptionList.style.visibility === "visible") {
      moreOptionList.style.maxWidth = "40px";
      moreOptionList.style.minWidth = "40px";
      moreOptionList.style.maxHeight = "10px";
      moreOptionList.style.opacity = "0";
      setTimeout(function(){ moreOptionList.style.visibility = "hidden"; }, 175);
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
         setTimeout(function() {
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

/* Controls: new/pause/check/restart/hint */ 
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
   var more = document.getElementById("moreoption-sec");
   if (more) more.style.display = "block";
   var pbtn = document.getElementById("pause-btn");
   if (pbtn) pbtn.style.display = "block";
   var cbtn = document.getElementById("check-btn");
   if (cbtn) cbtn.style.display = "block";
}

function getSelectedDifficulty(){
   var difficulties = document.getElementsByName("difficulty");
   for (var i = 0; i < difficulties.length; i++) if (difficulties[i].checked) return i;
   return -1;
}
   

function startGameButtonClick() {
   var difficultyIndex = getSelectedDifficulty();
   var difficulty = 5;
   if (difficultyIndex >= 0) {
      difficulty = 4 - difficultyIndex;
      newGame(difficulty);
   } else {
      newGame(5);
   }
   hideDialogButtonClick("dialog");
   gameID++;
   document.getElementById("game-number").innerText = "game #" + gameID;
   document.getElementById("timer-label").innerText = "Time";
   document.getElementById("game-difficulty-label").innerText = "Game difficulty";
   var diffLabel = (difficultyIndex >= 0 ? document.getElementsByName("difficulty")[difficultyIndex].value : "solved");
   document.getElementById("game-difficulty").innerText = diffLabe1;
   var pauseBtn2 = document.getElementById("pause-btn-2");
   var checkBtn2 = document.getElementById("check-btn-2");
   if (pauseBtn2) pauseBtn2.style.display = "block";
   if (checkBtn2) checkBtn2.style.display = "block";
}

function pauseGameButtonClick() {
   var icon = document.getElementById("pause-icon");
   var label = document.getElementById("pause-text");
   if (pauseTimer) {
      if (icon) icon.innerText = "pause";
      if (label) label.innerText = "Pause";
      if (table) table.style.opacity = 1;
   } else {
      if (icon) icon.innerText = "play_arrow";
      if (label) label.innerText = "Continue";
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
         var result = checkValue(currentGrid[i][j], currentGrid[i], columns[j], blocks[Math.floor(i/3)*3 + Math.floor(j/3)], puzzle[i][j], solution[i] ? solution[i][j] : "-1");
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
   timer = -1;
}

function SurrenderButtonClick() {
   if (!gameOn) return;
   for (var i = 0; i < 9; i++) remaining[i] = 9;
   ViewPuzzle(solution);
   updateRemainingTable();
   gameOn = false;
   pauseTimer = true;
   clearInterval(intervalId);
   document.getElementById("game-difficulty").innerText = "Solved";
}

function hintButtonClick() {
   if (!gameOn) return;
   var empty_cells_list = [];
   var wrong_cells_list = [];
   for (var i = 0; i < 9; i++) {
      for (var j = 0; j < 9; j++) {
         var input = table.rows[i].cells[j].getElementsByTagName("input")[0];
         if (!input.value || input.value.length > 1 || input.value === "0") empty_cells_list.push([i,j]);
         else if (solution[i] && input.value !== solution[i][j]) wrong_cells_list.push([i,j]);
      }
   }
   if (empty_cells_list.length === 0 && wrong_cells_list.length === 0) {
      gameOn = false; pauseTimer = true; clearInterval(intervalId);
      document.getElementById("game-difficulty").innerText = "Solved";
      alert("Congrats, You solved it!");
      return;
   }
   timer += 60;
   var input, chosen;
   if ((Math.random() < 0.5 && empty_cells_list.length > 0) || wrong_cells_list.length === 0) {
      var idx = Math.floor(Math.random()*empty_cells_list.length);
      chosen = empty_cells_list[idx];
      input = table.rows[chosen[0]].cells[chosen[1]].getElementsByTagName("input")[0];
      input.oldvalue = input.value;
      input.value =solution[chosen[0]][chosen[1]];
      remaining[input.value - 1]--;
   } else {
      var idx = Math.floor(Math.random()*wrong_cells_list.length);
      chosen = wrong_cells_list[idx];
      input = table.rows[chosen[0]].cells[chosen[1]].getElementsByTagName("input")[0];
      input.oldvalue = input.value;
      if (input.value >= "1" && input.value <= "9") remaining[input.value - 1]++;
      input.value = solution[chosen[0]][chosen[1]];
      remaining[input.value - 1]--;
   }
   updateRemainingTable();
   (function animateHint(el) {
      var count = 0;
      for (var k = 0; k < 6; k++) {
         setTimeout(function() {
            if (count % 2 === 0) el.classList.add("right-cell");
            else el.classList.remove("right-cell");
            count++;
         }, k * 750);
      }
   })(input);
}

/* Global Helpers */
// called by each input's onchange attribute in HTML (keeps backward compatibility)
function checkInput(input) {
   if (!input) return;
   var v = input.value;
   if (!v) return;
   if (v[0] < "1" || v[0] > "9") {
      if (v !== "?") {
         input.value = "";
         alert("Only numbers [1-9] and question mark '?' are allowed!");
         input.focus();
      }
   } else {
      input.valu = v[0];
   }
}

/* Event wiring & UI polish (ripples) */
window.onload = function() {
   table = document.getElementById("puzzle-grid");
   var rippleButtons = document.getElementsByClassName("button");
   for (var i = 0; i < rippleButtons.length; i++) {
      rippleButtons[i].onmousedown = function (e) {
         var rect = this.getBoundingClientRect();
         var x = e.clientX - rect.left;
         var y = e.clientY - rect.top;
         var rippleItem = document.createElement("div");
         rippleItem.classList.add("ripple");
         rippleItem.style.left = x + "px";
         rippleItem.style.top = y + "px";
         var rippleColor = this.getAttribute("ripple-color");
         if (rippleColor) rippleItem.style.background = rippleColor;
         this.appendChild(rippleItem);
         setTimeout(function() { if (rippleItem.parentElement) rippleItem.parentElement.removeChild(rippleItem); }, 1500);
      };
   }
   if (!table) return;
   for (var r = 0; r < 9; r++) {
      for (var c = 0; c < 9; c++) {
         var input = table.rows[r].cells[c].getElementsByTagName("input")[0];
         if (!input) continue;
         input.onchange = function() {
            addClassToCell(this);
            checkInput(this);
            if (this.value >= "1" && this.value <= "9") remaining[this.value - 1]--;
            if (this.oldvalue !== undefined && this.oldvalue !== "") {
               if (this.oldvalue >= "1" && this.oldvalue <= "9") remaining[this.oldvalue - 1]++;
            }
            canSolved = true;
            updateRemainingTable();
         };
         input.onfocus = function(){ this.oldvalue = this.value; };
      }
   }
};

/* click outside to hide dialogs/menus */
window.onclick = function (event) {
   var d1 = document.getElementById("dialog");
   var d2 = document.getElementById("about-dialog");
   var m1 = document.getElementById("more-option-list");
   if (event.target === d1) hideDialogButtonClick("dialog");
   else if (event.target === d2) hideDialogButtonClick("about-dialog");
   else if (m1 && m1.style.visibility === "visible") hideMoreOptionMenu();
};

/* Hamburger toggle */
function HamburgerButtonClick() {
   var div = document.getElementById("hamburger-menu");
   var menu = document.getElementById("nav-menu");
   if (!div || !menu) return;
   div.style.display = "block";
   div.style.visibility = "visible";
   setTimeout(function(){ div.style.opacity = 1; menu.style.left = "0"; }, 50);
}
