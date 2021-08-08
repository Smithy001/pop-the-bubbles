
function App(canvasId) {
    var WIDTH, HEIGHT;

    var animationLoopTimeInterval;
    var game;
    var canvas, context;

    console.log("App object is being constructed.");

    function Main() {
        SetupCanvas();

        game = new Game();

        animationLoopTimeInterval = setInterval(AnimationLoop, 500);
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
        context.fillStyle = '#c6e0ff';
        context.fillRect(0, 0, WIDTH, HEIGHT);

        game.Render();
    }
    
    Main();

    game.Start();
}

console.log("app.js Starting up.");
var app = new App('world');