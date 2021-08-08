console.log("Game class being imported.");

class Game {
    constructor(left, top, board_rows, cell_width, bubbleColor) {
        var board;

        this.top = top;
        this.left = left;
        this.cell_width = cell_width;

        this.Start = function () {
            console.log("Game starting.");
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

            board[celx][cely].HandleMouseDown(e, PopBubble);
        }

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

        function PopBubble() {
            console.log('You popped a bubble');
        }

        function AddStartingBubble() {
            let center = Math.floor(board_rows*0.5);
  
            board[center][center].addItem(new Bubble(bubbleColor));
            board[board_rows-1][board_rows-1].addItem(new Bubble(bubbleColor));
            board[0][0].addItem(new Bubble(bubbleColor));
            board[0][board_rows-1].addItem(new Bubble( bubbleColor));
            board[board_rows-1][0].addItem(new Bubble(bubbleColor));
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

        this.Render = function (x, y, size, context) {
            for (let i=0; i<this.items.length; i++) {
                this.items[i].Render(x, y, size, context);
            }
        };

        this.addItem = function(item) {
            this.items.push(item);
        };

        this.HandleMouseDown = function(e, callback) {
            if (this.items.length > 0) {
                callback();
            }
        }
    }
}

class Bubble {
    constructor(color) {
        this.color = color;

        this.Render = function (x, y, size, context) {
            context.fillStyle = this.color;
            context.beginPath();
            context.moveTo(x, y);
            context.arc(x, y, size*0.5, 0, Math.PI * 2, true);
            context.fill();
        };
    }
}