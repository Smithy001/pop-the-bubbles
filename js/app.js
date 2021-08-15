class App {
    constructor(canvasId) {
        var level = getStartingLevel();

        var WIDTH = window.innerWidth;
        var HEIGHT = window.innerHeight;
        var GAME_ROWS = (level * 2) + 1;
        var GAME_CELL_WIDTH, GAME_SIZE, GAME_X, GAME_Y;
        var GAME_MARGIN = 75;
        var BORDER_WIDTH = 5;
        var BACKGROUND_COLOR = '#4b6a79' // '#cbeeff';
        var BACKGROUND_COLOR_SECONDARY = '#1b3744' // '#afe4ff';
        var TEXT_COLOR = '#fff';
        var MARGIN_COLOR = '#fff';
        var BORDER_COLOR = '#6c6c6c';
        var BUBBLE_COLOR = '#00c8ff';

        var animationLoopTimeInterval;
        var game;
        var canvas, context;
        var mouseDown = false;
        var mouseMoveLimit = false;

        var currentTouches = [];

        console.log("App object is being constructed.");

        function Main() {
            SetupCanvas();
            SetupGame();
    
            animationLoopTimeInterval = setInterval(AnimationLoop, 50);
        }

        function StartGame() {
            let message = document.getElementById('message');
            message.style.display = "flex";
            QueueCountdown(message);

            message.removeEventListener('mousedown', StartGame);

        }

        function EndGame() {
            clearInterval(animationLoopTimeInterval);
                
            context.fillStyle = TEXT_COLOR;
            context.font = "3em Arial";
            context.textAlign = "center";
            context.fillText('You won in ' + game.GetScore() + ' seconds!', WIDTH*0.5, HEIGHT*0.5)

            context.strokeStyle = BACKGROUND_COLOR_SECONDARY;
            context.lineWidth = 1; 
            context.strokeText('You won in ' + game.GetScore() + ' seconds!', WIDTH*0.5, HEIGHT*0.5);

            document.getElementById('next_level_button').style.display = "block";
        }

        function QueueCountdown(message) {
            
            message.textContent = '3';

            setTimeout(function() { 
                message.textContent = '2';
            }, 1000);

            setTimeout(function() { 
                message.textContent = '1';
            }, 2000);

            setTimeout(function() { 
                message.textContent = '';
                message.style.display = 'none';
                game.Start();
            }, 3000);
        }
        
        function SetupCanvas() {
            let message = document.getElementById('message');
            message.addEventListener('mousedown', StartGame);

            let nextLevelButton = document.getElementById('next_level_button');
            nextLevelButton.addEventListener('mousedown', HandleNextLevelMouseDown);

            canvas = document.getElementById(canvasId);

            if (canvas && canvas.getContext) {
                context = canvas.getContext('2d');
                console.log('Initialized canvas');
            }

            canvas.addEventListener('touchstart', HandleTouchStart);
            canvas.addEventListener('touchend', HandleTouchEnd);
            canvas.addEventListener('touchcancel', HandleTouchCancel);
            canvas.addEventListener('touchmove', HandleTouchMove);

            canvas.addEventListener('mousedown', HandleMouseDown);
            canvas.addEventListener('mouseup', HandleMouseUp);
            canvas.addEventListener('mousemove', HandleMouseMove);

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


            var gradientFill = context.createLinearGradient(GAME_X,GAME_Y,GAME_SIZE,GAME_SIZE);
			gradientFill.addColorStop(0,BACKGROUND_COLOR);
            gradientFill.addColorStop(1,BACKGROUND_COLOR_SECONDARY);

            context.fillStyle = gradientFill;
            
            context.fillRect(
                GAME_X, 
                GAME_Y, 
                GAME_SIZE, 
                GAME_SIZE);


            game.Render(context, WIDTH, HEIGHT);
            let score = document.getElementById('score');
            score.textContent = 'Time: ' + game.GetScore();

            document.getElementById('level').textContent = 'Level: ' + level;

            if (game.GameOver()) {
                EndGame();
            }
        }
        
        function HandleNextLevelMouseDown(e) {
            document.getElementById('next_level_button').style.display = "none";
            level += 1;
            GAME_ROWS = (level * 2) + 1;
            Main();

            StartGame();

        }

        function HandleMouseDown(e) {
            if (mouseDown) {
                console.log('You can only click one at a time');
                return;
            }
            mouseDown = true;
            CheckGameEvent(e.x, e.y);
        }

        function HandleMouseUp(e) {
            mouseDown = false;
            mouseMoveLimit = false;
            game.HandleMouseUp();
        }

        function HandleMouseMove(e) {
            if (!mouseDown) { return; }
            if (mouseMoveLimit == true) { return; }

            mouseMoveLimit = true
            setTimeout(function() {mouseMoveLimit = false;}, 50);
            CheckGameEvent(e.x, e.y);   
        }

        function HandleTouchStart(e) {
            e.preventDefault();
            console.log("touchstart.");
            var touches = e.changedTouches;
          
            console.log(touches);

            for (var i = 0; i < touches.length; i++) {
              console.log("touchstart:" + i + "...");
              currentTouches.push(copyTouch(touches[i]));
              CheckGameEvent(touches[i].clientX, touches[i].clientY);
            }
        }
        
            
        function HandleTouchEnd(e) {
            e.preventDefault();
            console.log("touchend");
            
            var touches = e.changedTouches;

            for (var i = 0; i < touches.length; i++) {
            
                var idx = currentTouchIndexById(touches[i].identifier);

                if (idx >= 0) {
                    currentTouches.splice(idx, 1);  // remove it; we're done
                } else {
                    console.log("can't figure out which touch to end");
                }
            }
            game.HandleMouseUp();
        }

        function HandleTouchCancel(e) {
            e.preventDefault();
            console.log("touchcancel.");
            var touches = e.changedTouches;

            for (var i = 0; i < touches.length; i++) {
                var idx = currentTouchIndexById(touches[i].identifier);
                currentTouches.splice(idx, 1);  // remove it; we're done
            }
            game.HandleMouseUp();
        }

        function HandleTouchMove(e) {
            e.preventDefault();
            
            var touches = e.changedTouches;

            for (var i = 0; i < touches.length; i++) {
                var idx = currentTouchIndexById(touches[i].identifier);

                if (idx >= 0) {
                    console.log("continuing touch "+idx);
                    CheckGameEvent(touches[i].clientX, touches[i].clientY)
                } else {
                    console.log("can't figure out which touch to continue");
                }
            }
        }

        function CheckGameEvent(x, y) {
            if (x > GAME_X && 
                y > GAME_Y && 
                x < (GAME_X + GAME_SIZE) && 
                y < (GAME_Y + GAME_SIZE)) {
                    console.log('You clicked within the game area');
                    game.HandleMouseDown(x, y);
                }
        }

        function currentTouchIndexById(idToFind) {
            for (var i = 0; i < currentTouches.length; i++) {
                var id = currentTouches[i].identifier;
            
                if (id == idToFind) {
                return i;
                }
            }
            return -1;    // not found
        }

        function copyTouch({ identifier, pageX, pageY }) {
            return { identifier, pageX, pageY };
        }

        function getURLHash(defaultValue) {
            let hash = location.hash.substr(1);

            if (hash == "") {
                return defaultValue;
            }
            return hash;
        }

        function getStartingLevel() {
            let level = parseInt(getURLHash(1));
            if (isNaN(level)) {
                return 1;
            }
            return level;
        }

        Main();
    }
}

console.log("app.js Starting up.");
var app = new App('world');