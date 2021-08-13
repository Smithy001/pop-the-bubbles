console.log("Game class being imported.");

class Game {
    constructor(left, top, board_rows, cell_width, bubbleColor) {
        var board, eventLoop;
        var score = 0;
        var minBubblePopGrowthFactor = 0.2;
        var defaultBubbleGrowthFactor = 0.4;
        var bubbleGrowthFactorMax = 1;

        var bubblesMax = board_rows * board_rows;
        var bubblesCount = 0;

        var startTime = Date.now();

        this.top = top;
        this.left = left;
        this.cell_width = cell_width;

        var poppedAlready = {};

        this.GetScore = function () {
            return (Date.now() - startTime)/1000;
        };

        this.Start = function () {
            console.log("Game starting.");

            eventLoop = setInterval(EventLoop, 100);
        };

        this.Render = function (context) {

            for (let i=0; i<board_rows; i++) {
                for (let j=0; j<board_rows; j++) {
                    let x = this.left + (j * this.cell_width) + (this.cell_width*0.5);
                    let y = this.top + (i * this.cell_width) + (this.cell_width*0.5);
                    board[i][j].Render(x, y, this.cell_width, context);
                }
            }
        };

        this.HandleMouseDown = function(x, y) {
            let relx = x - this.left;
            let rely = y - this.top;

            if (relx < 0 || rely < 0) {
                return;
            }

            let celx = Math.floor(relx / this.cell_width);
            let cely = Math.floor(rely / this.cell_width);

            if (poppedAlready.hasOwnProperty(cely+','+celx) == true) {
                console.log('Already popped a bubble at ' + cely + ' ' + celx);
                console.log(poppedAlready);
                return;
            }

            board[cely][celx].HandleMouseDown(x, y, PopBubble);
        }

        this.HandleMouseUp = function() {
            poppedAlready = {};
        }

        function EventLoop() {
            let new_score = 0;
            for (let i=0; i<board_rows; i++) {
                for (let j=0; j<board_rows; j++) {
                    if (board[i][j].items[0]) {
                        board[i][j].items[0].Grow(bubbleGrowthFactorMax, bubbleGrowthFactorMax-(bubblesCount/bubblesMax));
                        new_score += (board[i][j].items[0].growthFactor*10)
                    }
                }
            }
            score = Math.floor(new_score);
        }

        function CreateBoard() {
            board = []
            for (let i=0; i<board_rows; i++) {
                let row = [];
                for (let j=0; j<board_rows; j++) {
                    row.push(new Cell(i, j));
                }
                board.push(row);
            }
        }

        function PopBubble(row, col) {
            let b = board[row][col].GetItem();

            if (b.growthFactor < minBubblePopGrowthFactor) {
                return;
            }

            console.log('You popped a bubble at ' + row + ' ' + col);

            let energySpawlLostFactor = 0.9;
            let energyLost = b.growthFactor*0.7;
            let newBubbleEnergy =  energyLost*energySpawlLostFactor;
            
            // Up
            CreateBubble(row-1, col, newBubbleEnergy);
            // Right
            CreateBubble(row, col+1, newBubbleEnergy);
            // Down
            CreateBubble(row+1, col, newBubbleEnergy);
            // Left
            CreateBubble(row, col-1, newBubbleEnergy);

            if (b.growthFactor >= bubbleGrowthFactorMax) {
                newBubbleEnergy = newBubbleEnergy * 1.1;
                // Top Right
                CreateBubble(row+1, col+1, newBubbleEnergy);
                // Top Left
                CreateBubble(row+1, col-1, newBubbleEnergy);
                // Bottom Right
                CreateBubble(row-1, col+1, newBubbleEnergy);
                // Bottom Left
                CreateBubble(row-1, col-1, newBubbleEnergy);
            }

            b.growthFactor -= energyLost;
        }

        function CreateBubble(row, col, energy) {
            if (row >= board_rows) { return; }
            if (row < 0) { return; }
            if (col >= board_rows) { return; }
            if (col < 0) { return; }

            let b = board[row][col].GetItem();
            if (!b) {
                AddBubble(row, col, bubbleColor, energy);
            } else {
                b.growthFactor += energy*(1/6);
                if (b.growthFactor > bubbleGrowthFactorMax) {
                    b.growthFactor = bubbleGrowthFactorMax;
                }
            }
        }

        function AddStartingBubble() {
            let center = Math.floor(board_rows*0.5);
  
            AddBubble(center, center, bubbleColor, defaultBubbleGrowthFactor)
        }

        function AddBubble(x, y, color, growthFactor) {
            board[x][y].AddItem(new Bubble(color, growthFactor));
            bubblesCount += 1;
        }

        function Setup() {
            console.log("Game object being constructed.");
            CreateBoard();
            AddStartingBubble();
        }
        Setup();
    
    }
}

class Cell {
    constructor(row, col) {
        this.items = [];
        this.row = row;
        this.col = col;

        this.Render = function (x, y, size, context) {
            for (let i=0; i<this.items.length; i++) {
                this.items[i].Render(x, y, size, context);
            }
        };

        this.GetItem = function() {
            return this.items[0];
        }

        this.AddItem = function(item) {
            this.items.push(item);
        };

        this.HandleMouseDown = function(x, y, callback) {
            if (this.items.length > 0) {
                callback(this.row, this.col);
            }
        }
    }
}

class Bubble {
    constructor(color, growthFactor) {
        this.color = color;
        this.growthRateMin = 0.01;
        this.growthRateMax = 0.5;
        this.growthFactor = growthFactor;

        this.Render = function (x, y, size, context) {
            context.fillStyle = this.color;
            context.beginPath();
            context.moveTo(x, y);
            context.arc(x, y, size*0.5*this.growthFactor, 0, Math.PI * 2, true);
            context.fill();
        };

        this.Grow = function (maxSize, dimFactor) {
            if (this.growthFactor < maxSize) {
                this.growthFactor += (this.growthRateMin * this.growthFactor * dimFactor);
            }

            if (this.growthFactor > maxSize) {
                this.growthFactor = maxSize;
            }
        }
    }
}