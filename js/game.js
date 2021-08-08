console.log("Game class being imported.");

class Game {
    constructor(top, left, board_rows, cell_width, bubbleColor) {
        var board;

        this.Start = function () {
            console.log("Game starting.");
        };

        this.Render = function (context) {

            for (let i=0; i<board_rows; i++) {
                for (let j=0; j<board_rows; j++) {
                    let x = top + (j * cell_width) + (cell_width*0.5);
                    let y = left + (i * cell_width) + (cell_width*0.5);
                    board[i][j].Render(x, y, context);
                }
            }
        };

        function CreateBoard() {
            board = []
            for (let i=0; i<board_rows; i++) {
                let row = [];
                for (let j=0; j<board_rows; j++) {
                    row.push(new Cell());
                }
                board.push(row);
            }
        }

        function AddStartingBubble() {
            let center = Math.floor(board_rows*0.5);
  
            board[center][center].addItem(new Bubble(cell_width, bubbleColor));
            board[board_rows-1][board_rows-1].addItem(new Bubble(cell_width, bubbleColor));
            board[0][0].addItem(new Bubble(cell_width, bubbleColor));
            board[0][board_rows-1].addItem(new Bubble(cell_width, bubbleColor));
            board[board_rows-1][0].addItem(new Bubble(cell_width, bubbleColor));
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
    constructor() {
        this.items = [];

        this.Render = function (x, y, context) {
            for (let i=0; i<this.items.length; i++) {
                this.items[i].Render(x, y, context);
            }
        };

        this.addItem = function(item) {
            this.items.push(item);
        };
    }
}

class Bubble {
    constructor(size, color) {
        this.color = color;
        this.size = size;

        this.Render = function (x, y, context) {
            context.fillStyle = this.color;
            context.beginPath();
            context.moveTo(x, y);
            context.arc(x, y, this.size*0.5, 0, Math.PI * 2, true);
            context.fill();
        };
    }
}