class App {
    constructor(canvasId) {    
        var WIDTH, HEIGHT;
        var GAME_ROWS = 11;
        var GAME_CELL_WIDTH = 80;
        var BACKGROUND_COLOR = '#f8fbff';
        var BUBBLE_COLOR = '#379af7';

        var animationLoopTimeInterval;
        var game;
        var canvas, context;

        console.log("App object is being constructed.");

        function Main() {
            SetupCanvas();

            game = new Game(0, 0, WIDTH, HEIGHT, GAME_ROWS, GAME_CELL_WIDTH, BUBBLE_COLOR);

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