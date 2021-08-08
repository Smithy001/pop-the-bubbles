console.log("Game class being imported.");

class Game {
    constructor(width, height, board_rows, cell_width, bubbleColor) {
        var board;

        this.Start = function () {
            console.log("Game starting.");
        };

        this.Render = function (context) {

            for (let i=0; i<board_rows; i++) {
                for (let j=0; j<board_rows; j++) {
                    for (let c=0; c<board[i][j].length; c++) {
                        let b = board[i][j][c];
                        b.Render(b.x, b.y, context);
                    }
                }
            }
        };

        function CreateBoard() {
            board = []
            for (let i=0; i<board_rows; i++) {
                let row = [];
                for (let j=0; j<board_rows; j++) {
                    row.push([]);
                }
                board.push(row);
            }
        }

        function AddStartingBubble() {
            let center = Math.floor(board_rows*0.5);
            board[center][center].push(new Bubble(Math.floor(width * 0.5), Math.floor(height * 0.5), cell_width, bubbleColor));
        }

        function Setup() {
            console.log("Game object being constructed.");
            CreateBoard();
            AddStartingBubble();
        }
        Setup();
    
    }
}

class Bubble {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;

        this.Render = function (x, y, context) {
            context.fillStyle = this.color;
            context.beginPath();
            context.moveTo(x, y);
            context.arc(x, y, this.size, 0, Math.PI * 2, true);
            context.fill();
        };
    }
}