console.log("Game class being imported.");

class Game {
    constructor(left, top, board_rows, cell_width, bubbleColor) {
        var board, eventLoop;
        var score = 0;
        var minBubblePopGrowthFactor = 0.2;
        var defaultBubbleGrowthFactor = 0.1;

        var bubblesMax = board_rows * board_rows;
        var bubblesCount = 0;

        this.top = top;
        this.left = left;
        this.cell_width = cell_width;

        this.GetScore = function () {
            return score;
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

        this.HandleMouseDown = function(e) {
            let relx = e.x - this.left;
            let rely = e.y - this.top;

            if (relx < 0 || rely < 0) {
                return;
            }

            let celx = Math.floor(relx / this.cell_width);
            let cely = Math.floor(rely / this.cell_width);

            board[cely][celx].HandleMouseDown(e, PopBubble);
        }

        function EventLoop() {
            let new_score = 0;
            for (let i=0; i<board_rows; i++) {
                for (let j=0; j<board_rows; j++) {
                    if (board[i][j].items[0]) {
                        board[i][j].items[0].Grow(1, 1-(bubblesCount/bubblesMax));
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

            let energySpawlLostFactor = 0.2;
            let energyLost = b.growthFactor*0.7;
            b.growthFactor -= energyLost;

            // Up
            if (row-1 >= 0) {
                b = board[row-1][col].GetItem();
                if (!b) {
                    AddBubble(row-1, col, bubbleColor, defaultBubbleGrowthFactor);
                } else {
                    b.growthFactor += energyLost*energySpawlLostFactor;
                }
            }

            // Right
            if (col+1 < (board_rows)) {
                b = board[row][col+1].GetItem();
                if (!b) {
                    AddBubble(row, col+1, bubbleColor, defaultBubbleGrowthFactor);
                } else {
                    b.growthFactor += energyLost*energySpawlLostFactor;
                }
            }

            // Down
            if (row+1 < (board_rows)) {
                b = board[row+1][col].GetItem();
                if (!b) {
                    AddBubble(row+1, col, bubbleColor, defaultBubbleGrowthFactor);
                } else {
                    b.growthFactor += energyLost*energySpawlLostFactor;
                }
            }
            
            // Right
            if (col-1 >= 0) {
                b = board[row][col-1].GetItem();
                if (!b) {
                    AddBubble(row, col-1, bubbleColor, defaultBubbleGrowthFactor);
                } else {
                    b.growthFactor += energyLost*energySpawlLostFactor;
                }
            }

            console.log('You popped a bubble at ' + row + ' ' + col);
        }

        function CheckCell(row, col) {
            
        }

        function AddStartingBubble() {
            let center = Math.floor(board_rows*0.5);
  
            AddBubble(center, center, bubbleColor, defaultBubbleGrowthFactor * 2)
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

        this.HandleMouseDown = function(e, callback) {
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