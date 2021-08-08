
function App() {
    var animationLoopTimeInterval;
    var game;

    console.log("App object is being constructed.");

    function Main() {
        game = new Game();

        animationLoopTimeInterval = setInterval(AnimationLoop, 500);
    }
    
    function AnimationLoop() {
        game.Render();
    }
    
    Main();

    game.Start();
}

console.log("app.js Starting up.");
var app = new App();