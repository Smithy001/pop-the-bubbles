class App {
    constructor(canvasId) {    
        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight;
        var GAME_ROWS = 9;
        var GAME_CELL_WIDTH, GAME_SIZE, GAME_X, GAME_Y;
        var GAME_MARGIN = 75;
        var BORDER_WIDTH = 5;
        var BACKGROUND_COLOR = '#f8fbff';
        var MARGIN_COLOR = '#fff';
        var BORDER_COLOR = '#6c6c6c';
        var BUBBLE_COLOR = '#379af7';

        var animationLoopTimeInterval;
        var game;
        var canvas, context;
        var mouseDown = false;
        var mouseMoveLimit = false;

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

            canvas.addEventListener('mousedown', HandleMouseDown);
            canvas.addEventListener('touchstart', HandleMouseDown);
            canvas.addEventListener('mouseup', HandleMouseUp);
            canvas.addEventListener('touchend', HandleMouseUp);
            canvas.addEventListener('mousemove', HandleMouseMove);
            canvas.addEventListener('touchmove', HandleMouseMove);

            //document.addEventListener('touchstart', function touchstart(e) {e.preventDefault()});
            //document.addEventListener('touchmove', function touchstart(e) {e.preventDefault()});
            
            window.addEventListener('resize', ResizeCanvas, true);
            ResizeCanvas();
        }

        function SetupGame() {
            game = new Game(GAME_X, GAME_Y, GAME_ROWS, GAME_CELL_WIDTH, BUBBLE_COLOR);
        }

        function ResizeCanvas() {
            WIDTH = window.innerWidth;
            HEIGHT = window.innerHeight;

            canvas.width = WIDTH;
            canvas.height = HEIGHT;

            if (WIDTH > HEIGHT) {
                GAME_CELL_WIDTH = (HEIGHT - GAME_MARGIN*2) / GAME_ROWS;
            } else {
                GAME_CELL_WIDTH = (WIDTH - GAME_MARGIN*2) / GAME_ROWS;
            }
            GAME_SIZE = GAME_CELL_WIDTH * GAME_ROWS;
            GAME_Y = HEIGHT*0.5 - GAME_SIZE*0.5;
            GAME_X = WIDTH*0.5 - GAME_SIZE*0.5;

            if (game) {
                game.left = GAME_X;
                game.top = GAME_Y;
                game.cell_width = GAME_CELL_WIDTH;
            }
            
        }

        function AnimationLoop() {
            context.fillStyle = MARGIN_COLOR;
            context.fillRect(0, 0, WIDTH, HEIGHT);

            context.fillStyle = BORDER_COLOR;
            context.fillRect(
                GAME_X-BORDER_WIDTH, 
                GAME_Y-BORDER_WIDTH, 
                GAME_SIZE+BORDER_WIDTH*2, 
                GAME_SIZE+BORDER_WIDTH*2);

            context.fillStyle = BACKGROUND_COLOR;
            context.fillRect(
                GAME_X, 
                GAME_Y, 
                GAME_SIZE, 
                GAME_SIZE);

            game.Render(context, WIDTH, HEIGHT);
            let score = document.getElementById('score');
            score.textContent = 'Score: ' + game.GetScore();
        }
        
        function HandleMouseDown(e) {
            if (mouseDown) {
                console.log('You can only click one at a time');
                return;
            }
            mouseDown = true;
            CheckGameEvent(e);
        }

        function HandleMouseUp(e) {
            mouseDown = false;
            mouseMoveLimit = false;
            game.HandleMouseUp(e);
        }

        function HandleMouseMove(e) {
            if (!mouseDown) { return; }
            if (mouseMoveLimit == true) { return; }

            mouseMoveLimit = true
            setTimeout(function() {mouseMoveLimit = false;}, 50);
            CheckGameEvent(e);   
        }

        function CheckGameEvent(e) {
            if (e.x > GAME_X && 
                e.y > GAME_Y && 
                e.x < (GAME_X + GAME_SIZE) && 
                e.y < (GAME_Y + GAME_SIZE)) {
                    console.log('You clicked within the game area');
                    game.HandleMouseDown(e);
                }
        }

        Main();

        game.Start();
    }
}

console.log("app.js Starting up.");
var app = new App('world');