console.log("Game class being imported.");

function Game(width, height) {
    var bubble;

    this.Start = function() {
        console.log("Game starting.");
    }

    this.Render = function(context) {
        bubble.Render(context);
    }

    function Setup() {
        console.log("Game object being constructed.")
        bubble = new Bubble(Math.floor(width*0.5), Math.floor(height*0.5), 30);
    }
    Setup();
}

function Bubble(x, y, size) {
    var color = '#379af7';

    this.x = x;
    this.y = y;
    this.size = size;

    this.Render = function(context) {
        context.fillStyle = color;
        context.beginPath();
        context.moveTo(this.x, this.y);
        context.arc(this.x, this.y, this.size, 0, Math.PI*2, true);
        context.fill();
    }
}