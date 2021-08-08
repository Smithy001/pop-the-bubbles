console.log("Game class being imported.");

function Game() {
    console.log("Game object being constructed.")

    this.Start = function() {
        console.log("Game starting.");
    }

    this.Render = function() {
        console.log("Nothing to render yet.");
    }
}
