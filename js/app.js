class App {
    constructor(canvasId) {    
        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight;
        var GAME_ROWS = 9;
        var GAME_CELL_WIDTH;
        var GAME_MARGIN = 75;
        var BACKGROUND_COLOR = '#f8fbff';
        var BUBBLE_COLOR = '#379af7';

        var animationLoopTimeInterval;
        var game;
        var canvas, context;

        console.log("App object is being constructed.");

        function Main() {
            SetupCanvas();
            SetupGame();
    
            animationLoopTimeInterval = setInterval(AnimationLoop, 50);
        }
        
        function SetupCanvas() {
            canvas = document.getElementById(canvasId);

            if (canvas && canvas.getContext) {
                context = canvas.getContext('2d');
                console.log('Initialized canvas');
            }

            window.addEventListener('resize', ResizeCanvas, true);
            ResizeCanvas();
        }

        function SetupGame() {
            if (WIDTH > HEIGHT) {
                GAME_CELL_WIDTH = (HEIGHT - GAME_MARGIN*2) / GAME_ROWS;
            } else {
                GAME_CELL_WIDTH = (WIDTH - GAME_MARGIN*2) / GAME_ROWS;
            }
            let gameBoardSize = GAME_CELL_WIDTH * GAME_ROWS;
            let gameBoardX = WIDTH*0.5 - gameBoardSize*0.5;
            let gameBoardY = HEIGHT*0.5 - gameBoardSize*0.5;

            game = new Game(gameBoardX, gameBoardY, GAME_ROWS, GAME_CELL_WIDTH, BUBBLE_COLOR);
        }

        function ResizeCanvas() {
            WIDTH = window.innerWidth;
            HEIGHT = window.innerHeight;

            canvas.width = WIDTH;
            canvas.height = HEIGHT;
        }

        function AnimationLoop() {
            context.fillStyle = BACKGROUND_COLOR;
            context.fillRect(0, 0, WIDTH, HEIGHT);

            game.Render(context, WIDTH, HEIGHT);
        }
        
        Main();

        game.Start();
    }
}

console.log("app.js Starting up.");
var app = new App('world');