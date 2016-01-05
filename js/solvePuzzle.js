// -------------------------------------------------------------------
// CS 560 Algorithms
// Fadi George & Ranulfo Limpiado
// -------------------------------------------------------------------
var board , pGrid = [] , startGrid = [] , numCols = 5 , numRows = 4 , state = new Uint32Array(1) , qIndx= 0 , mIndx = 0;
var moveQueue = [], pastConfigs = [] , emptyBlocks = new Uint8Array(2) , notSolved = 1 , moveDelay = 400;
var blockSize = {"A":"12","B":"12","C":"12","D":"12","E":"21","F":"11","G":"11","H":"11","I":"11","J":"22","":"11","*":"0"};
var blockColors = {"A":"#E98931","B":"#EB403B","C":"#38A35A","D":"#6C2A6A", "E":"#5C4399","F":"#274398","G":"#1F5EA8","H":"#4990CB","I":"#BA57B5","J":"#FBB735","":"#FFFFFF"};
var huffBlock = {"11":"10" , "12":"11" , "21":"010"  , "22":"011" , "0":"00"};

// Perform Functions when page loads
$( document ).ready(function() {

  $("#solveButton").click(function(){
    solveGrid();
  });

  board = document.getElementById('puzzleBoard');  // grab div element
  loadDefault();									                 // load default configuartion

});

// Unimplimented
function markAllowMove(){
  for(var i = 0; i < numRows; i++){
    for(var j = 0; j < numCols; j++){

    }
  }
}

// Check winning configuration
function solveGrid(){
  pastConfigs.push(storeConfig( pGrid ));      			// store shape grammar to be referenced later

  if( pGrid[1][3] == "J" && pGrid[2][4] == "J"){		// check if J block is in winning configuration
    alert("Board is already solved.");					    // notify user if configuration is already in a winning configuration
  }else{

    getValidMoves( pGrid , [[(emptyBlocks[0]<<17) | (emptyBlocks[1] << 12)]] );		// first build a queue by passing in the positions of the empty blocks
    while(notSolved){

      if( qIndx == moveQueue.length){												// unique moves made is at its limits and so the configuration was not solvable to begin with
        console.log("Configuration is not solvable");
        break;
      }
      if( moveQueue[qIndx][0][1][3] == "J" && moveQueue[qIndx][0][2][4] == "J")     // winning configuration found
        notSolved = 0;
      else
        getValidMoves( moveQueue[qIndx][0] , moveQueue[qIndx++][1] );				// keep adding to the move queue

    }
    if( !notSolved ){																// finally solve, so print optimal number of moves and animate each of them
      console.log( "Number of Moves" , moveQueue[qIndx][1].length-1 );
      animateMoves();
    }
  }
}
// animate moves at a specific interval
function animateMoves(){
  var numberMoves , blockName , blockDir , move , mIndx = 1 , w , h , i , j , k , moveListdiv, topPad, margRight, dirText;
  startGrid = copyArray(pGrid);
  numberMoves = moveQueue[qIndx][1].length;
  moveListdiv = document.getElementById("moveList");

  var animateTimer = setInterval(function(){										// timer that always runs till its cleared

    if( mIndx < numberMoves){

      // position of any block is 2 bits for the row (i) and 3 bits for the col(j)
      // move is constructed as follows
      // Block name    - empty block position 1 - empty block position 2 - new position - old position - direction
      // 8 bits (char) - 5 bits                 - 5 bits                 - 5 bits       - 5 bits       - 2 bits (00 - 11) up,right,down,left
      move = moveQueue[qIndx][1][mIndx][0];
      blockName = String.fromCharCode( move >> 22 );
      blockDir = move&3;
      w = blockSize[blockName][1];
      h = blockSize[blockName][0];
      i = ((move>>5) & 3);
      j = ((move>>2) & 7);

      if( blockDir == 2 )
        i = i - (-h) - 1;				// adjust to get top left position of block

      if( blockDir == 1 )
        j = j - (-w) - 1;

      // get current move and change grid to match it
      // animate as we move down the move list history
      if( blockDir == 2 ){
        dirText = "down";
        $('.'+blockName+'Piece').addClass("moveDown");
        for(k = 0; k < w; k++){
          startGrid[i+1][j+k] = startGrid[i-h+1][j+k];
          startGrid[i-h+1][j+k] = "";
        }

      }else if( blockDir == 1 ){
        dirText = "right";
        $('.'+blockName+'Piece').addClass("moveRight");
        for(k = 0; k < h; k++){
          startGrid[i+k][j+1] = startGrid[i+k][j-w+1];
          startGrid[i+k][j-w+1] = "";
        }

      }else if( blockDir == 0 ){
        dirText = "up";
        $('.'+blockName+'Piece').addClass("moveUp");
        for(k = 0; k < w; k++){
          startGrid[i-1][j+k] = startGrid[i-(-h)-1][j+k];
          startGrid[i-(-h)-1][j+k] = "";
        }
      }else{
        dirText = "left";
        $('.'+blockName+'Piece').addClass("moveLeft");
        for(k = 0; k < h; k++){
          startGrid[i+k][j-1] = startGrid[i+k][j-(-w)-1];
          startGrid[i+k][j-(-w)-1] = "";
        }
      }

      // append to move list canvas
      moveListdiv.innerHTML += '<div id = "move' + mIndx + '" class = "moveListItem"><div class = "moveNumber">' + mIndx + '</div>'
                            +  '<div class = "moveContain">' + '<div style = "height:' + (h+"0px") + '; width:'
                            + (w+"0px") + ';background: ' + (blockColors[blockName]) + ';" class = "miniBlock">' + '</div>'
                            +  '<div class = "moveItem">Move ' + blockName + ' at ' + '(' + ((move>>5) & 3) + ',' + ((move>>2) & 7) + ') '
                            + dirText + " 1" + '</div>'
                            +   '</div></div>';

      setTimeout(function(){
        loadFromGrid(startGrid);
      },moveDelay + 10);

      // scroll to current move
      moveListdiv.scrollTop = moveListdiv.scrollHeight;

      mIndx++;
    }else{
      alert("Board is now solved.");
      clearInterval(animateTimer);
    }

  }, moveDelay+40);

}
function getValidMoves( gridIn , moveHistory ){

  var i , j , tmp , emptyWidth , emptyHeight, top , bot , left , right , emptyPos = moveHistory[moveHistory.length-1][0];
  var uHeight , uWidth , uValid, bHeight, bWidth, bValid, lHeight, lWidth, lValid, rHeight, rWidth, rValid;

  for( var k = 0; k < 2; k++){

    tmp = (k<<2)+k;
    i = ( emptyPos >> (20-tmp) )&3;
    j = ( emptyPos >> (17-tmp) )&7;

    emptyWidth = emptyHeight = 1;     // assume free spaces are not adjacent
    top = bot = left = right = "1";

    if(i == 0 || i == 3){
      top = (i^1)>>1            // disregard row above if on first row
      bot = (i^1)&1;            // disregard row below if on last row
    }

    if(j == 0 || j == 4){
      left = (j-(-4)>>3);       // disregard row to the right if on first column
      right = (j-(-4)>>2)&1;    // disregard row to the left if on last column
    }

    if( right == 1  &&  gridIn[i][j+1] == "") emptyWidth++;   // if free spaces adjacent, add to it
    if( bot == 1    &&  gridIn[i+1][j] == "") emptyHeight++;

    // check row below
    uHeight = blockSize[gridIn[i-top][j]][0];   // grab block size from dictionary
    uWidth = blockSize[gridIn[i-top][j]][1];
    uValid = 1;                                 // check if piece aligned with freespace

    if( ((uWidth & emptyWidth) == 2) &&  gridIn[i-top][j] !=  gridIn[i-top][j+1] )
      uValid = 0;

    if( gridIn[i-top][j] != "" && uWidth <= emptyWidth && uValid){
      addMoveIfUnique(gridIn , (uHeight)<<2|(uWidth) , (i-1<<5)|(j<<2)|2 , moveHistory);
    }

    // check row below
    bHeight = blockSize[gridIn[i-(-bot)][j]][0];
    bWidth = blockSize[gridIn[i-(-bot)][j]][1];
    bValid = 1;

    if( ((bWidth & emptyWidth) == 2) && gridIn[i-(-bot)][j] != gridIn[i-(-bot)][j+1] )
      bValid = 0;

    if( gridIn[i-(-bot)][j] != "" && bWidth <= emptyWidth && bValid ){
      addMoveIfUnique(gridIn , (bHeight)<<2|(bWidth) , (i+1<<5)|(j<<2)|0 , moveHistory);
    }

    // check row to the left side
    lHeight = blockSize[gridIn[i][j-left]][0];
    lWidth = blockSize[gridIn[i][j-left]][1];
    lValid = 1;

    if( ((lHeight & emptyHeight) == 2) && gridIn[i][j-left] != gridIn[i+1][j-left] )
      lValid = 0;

    if( gridIn[i][j-left] != "" && lHeight <= emptyHeight && lValid){
      addMoveIfUnique(gridIn , (lHeight)<<2|(lWidth) , (i<<5)|(j-1<<2)|1 , moveHistory);
    }

    // check row to the right side
    rHeight = blockSize[gridIn[i][j-(-right)]][0];
    rWidth = blockSize[gridIn[i][j-(-right)]][1];
    rValid = 1;

    if( ((rHeight & emptyHeight) == 2) && gridIn[i][j-(-right)] != gridIn[i+1][j-(-right)] )
      rValid = 0;

    if( gridIn[i][j-(-right)] != "" &&  rHeight <= emptyHeight && rValid){
      addMoveIfUnique(gridIn , (rHeight)<<2|(rWidth) , (i<<5)|(j+1<<2)|3 , moveHistory);
    }

  }
}
// for debugging
function printGrid( gridIn ){
  console.log(gridIn[0]);
  console.log(gridIn[1]);
  console.log(gridIn[2]);
  console.log(gridIn[3]);
  console.log("");
}
// to be reduced to 3 params
function addMoveIfUnique( gridIn , blockSize , spotdir , moveList ){

  var gridCopy = copyArray(gridIn), dir = spotdir & 3 , w = blockSize&3 , h = blockSize>>2;
  var i = (spotdir >> 5) , j = (spotdir >>2)&7 , moveListCopy = copyArray(moveList) , gridState;
  var emptyPos = moveListCopy[moveListCopy.length - 1][0]>>12 & 1023 , tmp , beforeFlag = 0;
  // dir 0 -> going up
  // dir 1 -> going right
  // dir 2 -> going down
  // dir 3 -> going left
  if(dir == 2){

    if( (spotdir>>2) + 8 != emptyPos>>5 )
      beforeFlag = 1;

    // move block, to be checked if its unique later
    for(var k = 0; k < w; k++){
      gridCopy[i+1][j+k] = gridCopy[i-h+1][j+k];
      gridCopy[i-h+1][j+k] = "";

      tmp = (k<<2) + k; // adjust position of empty block after mpve
      if( beforeFlag)   // k to only reach 1 expected
        emptyPos = emptyPos&(992) | (i-h+1)<<3 | (j);
      else
        emptyPos = emptyPos&(31<<tmp) | ((i-h+1)<<8 | (j+k)<<5)>>tmp;
    }
  }else if(dir == 1){

    if( (spotdir>>2) + 1 != emptyPos>>5 )
      beforeFlag = 1;

    for(var k = 0; k < h; k++){
      gridCopy[i+k][j+1] = gridCopy[i+k][j-w+1];
      gridCopy[i+k][j-w+1] = "";

      tmp = (k<<2) + k;
      if( beforeFlag  )
        emptyPos = emptyPos&(992) | i<<3 | (j-w+1);
      else
        emptyPos = emptyPos&(31<<tmp) | ((i+k)<<8 | (j-w+1)<<5)>>tmp;
    }
  }else if(dir == 0){

    if( (spotdir>>2) - 8 != emptyPos>>5 )
      beforeFlag = 1;

    for(var k = 0; k < w; k++){
      gridCopy[i-1][j+k] = gridCopy[i+h-1][j+k];
      gridCopy[i+h-1][j+k] = "";

      tmp = (k<<2) + k;
      if( beforeFlag  )
        emptyPos = emptyPos&(992) | (i+h-1)<<3 | j;
      else
        emptyPos = emptyPos&(31<<tmp) | ((i+h-1)<<8 | (j+k)<<5)>>tmp;
    }
  }else{

    if( (spotdir>>2) - 1 != emptyPos>>5 )
      beforeFlag = 1;

    for(var k = 0; k < h; k++){
      gridCopy[i+k][j-1] = gridCopy[i+k][j+w-1];
      gridCopy[i+k][j+w-1] = "";

      tmp = (k<<2) + k;
      if( beforeFlag  )
        emptyPos = emptyPos&(992) | i<<3 | (j+w-1);
      else
        emptyPos = emptyPos&(31<<tmp) | ((i+k)<<8 | (j+w-1)<<5)>>tmp;
    }
  }

  gridState = storeConfig( gridCopy );
  // switch if positions of empty blocks is descending
  if( (emptyPos>>5) > (emptyPos&31) ){
    emptyPos = (emptyPos>>5) | ((emptyPos<<5)&992);
  }

  if( pastConfigs.indexOf(gridState) >= 0 )    // past configurations already found
    return;

  // move word is as follows:
  // 2 bits for direction (00 - 11) clockwise from the up direction
  // 5 bits for new position of moved block (2 bits for row, 3 bits for column)
  // 5 bits for old position of moved block (2 bits for row, 3 bits for column)
  // 10 bits for the empty block positions (2 bits for row , 3 bits for column) (2 free spaces at most)
  // 8 bits for the character (block name)
  if(dir == 2){
    moveListCopy.push([gridCopy[i+1][j].charCodeAt(0)<<22 | emptyPos<<12 | (i-h+2)<<10 | j << 7 | spotdir - (h-1<<5)]);

  }else if(dir == 1){
    moveListCopy.push([gridCopy[i][j+1].charCodeAt(0)<<22 | emptyPos<<12 | (i)<<10 | (j-w+2) << 7 | spotdir - (w-1<<2)]);

  }else if(dir == 0){
    moveListCopy.push([gridCopy[i-1][j].charCodeAt(0)<<22 | emptyPos<<12 | (i-1)<<10 | j << 7 | spotdir]);

  }else{
    moveListCopy.push([gridCopy[i][j-1].charCodeAt(0)<<22 | emptyPos<<12 | (i)<<10 | (j-1) << 7 | spotdir]);
  }

  //printGrid(gridCopy);
  pastConfigs.push(gridState);
  moveQueue.push([gridCopy , moveListCopy])
}

// save current CONFIGURATION as an 26-bit string using huffman encoding
function storeConfig( gridIn ){
  state[0] = 0;
  var w;

  for(var i = 0; i < numRows; i++){
    for(var j = 0; j < numCols; j++){

      if( i > 0 && (gridIn[i][j] != (gridIn[i-1][j] || "@"))  || i == 0){
        w = blockSize[gridIn[i][j]||"*"];
        state[0] = (state[0] << huffBlock[w].length ) | parseInt( huffBlock[w] , 2) ;
        if(w[1] == "2") j++;
      }
    }
  }
  return state[0];
}
// empty the grid
function clearGrid(){
  pGrid = [];
  board.innerHTML = "";
  for(var i = 0; i < numRows; i++){
    row = [];
    for(var j = 0; j < numCols; j++){
      row.push("");
    }
    pGrid.push(row);
  }
}

// load some configuartion into grid array
function loadDefault(){
    clearGrid();
    clearQueue();
    pGrid[0] = ["A","A","B","B","F"];
    pGrid[1] = ["J","J","E","G",""];
    pGrid[2] = ["J","J","E","H",""];
    pGrid[3] = ["C","C","D","D","I"];
    drawGrid( pGrid );
}
function loadFromGrid( gridIn ){
  clearGrid();
  pGrid = gridIn;
  drawGrid( pGrid );
}
function loadFromStr( str ){  // Block piece from top-left to bottom-right

  if( str.length != 12 ){
    alert('Not valid input configuartion.');
    return;
  }
  board.innerHTML = "";
  clearQueue();
  var i = 0 , j = 0 , k = 0 ,  blockCounter = 0 , bName ,  w , h;

  for(var ii = 0; ii < numRows; ii++){
    for(var jj = 0; jj < numCols; jj++){
      pGrid[ii][jj] = "0";
    }
  }
  while( blockCounter < 12){

    if( pGrid[i][j] == "0"){

      bName = str[k++];
      h = blockSize[ bName.trim() ][0];
      w = blockSize[ bName.trim() ][1];

      for(var wI = 0; wI < w; wI++){
        for(var hI = 0; hI < h; hI++){
          pGrid[i+hI][j+wI] = bName.trim();
        }
      }
      blockCounter++;
      if( w == "2" )
        j = j + 2;
      else
        j++;

    }else{
      j++;
    }
    if( j == 5 ){
      j = 0;
      i = i + 1;
    }
  }

  drawGrid( pGrid );
}

// clear movelist history, move queue, and past configurations;
function clearQueue(){
  var moveList = document.getElementById("moveList");
  moveQueue = [];
  pastConfigs = [];
  qIndx= 0;
  notSolved = 1;
  moveList.innerHTML = '<h4 class = "moveCardTitle">Move List</h4>';
}


// Deep Copy of Inputted Array
function copyArray( gridIn ){
  var clonedArr = [];
  for(var i = 0; i < gridIn.length; i++){
    clonedArr[i] = ( gridIn[i].slice() );
  }
  return clonedArr;
}


// draws based off puzzleGrid
function drawGrid( gridIn ){

  var w , h , offSet = 10 , drawSize = 100 , emptyClass = "" , k = 0;
  for(var i = 0; i < numRows; i++){
    for(var j = 0; j < numCols; j++){

       h = blockSize[pGrid[i][j]][0];   // grab height from block size dictionary
       w = blockSize[pGrid[i][j]][1];   // grab width

       if( gridIn[i][j] == "" ){        // store empty block position
         emptyClass = "emptyBlock";
         emptyBlocks[k++] = (i<<3)|j;
       }else
         emptyClass = gridIn[i][j] + 'Piece';

       // append pcieces to blank canvas
       if( i > 0 && (gridIn[i][j] != (gridIn[i-1][j] || "@"))  || i == 0)
         board.innerHTML += '<div class = "size'+ h + 'by' + w + ' ' + emptyClass +' pBlock" style = "top: '
         + (i*drawSize+offSet) + 'px; left: ' + (j*drawSize+offSet)
         + 'px; background-color:' + blockColors[pGrid[i][j]] + ';"></div>';

       if(w == "2") j++;
    }
  }
}
