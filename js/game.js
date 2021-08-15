console.log("Game class being imported.");

class Game {
    constructor(left, top, board_rows, cell_width, bubbleColor) {
        var EVENT_LOOP_MS = 100;
        var MAX_CASCADE = 1;
        
        var board, eventLoop;
        var minBubblePopGrowthFactor = 0.2;
        var defaultBubbleGrowthFactor = 0.4;
        var bubbleGrowthFactorMax = 1;

        var RESOURCE_NODE_COLOR = '#48ee48';
        var VIRUS_BUBBLE_COLOR = '#ff0000';

        var bubblesMax = board_rows * board_rows;
        var bubblesCount = 0;
        var virusCount = 0;

        var MAX_ITEMS = 5000;
        var MAX_ITEMS_PER_CELL = Math.floor(MAX_ITEMS/bubblesMax);

        var startTime = null;
        var currentTime = null;
        var endTime = null;
        var gameStarted = false;
        var gameOver = false;

        this.top = top;
        this.left = left;
        this.cell_width = cell_width;

        var poppedAlready = {};

        this.GetScore = function () {
            if (!startTime) {
                return 0;
            }
            if (endTime) {
                return ((endTime - startTime)/1000).toFixed(2);
            }
            return ((currentTime - startTime)/1000).toFixed(2);
        };

        this.Start = function () {
            console.log("Game starting.");

            gameStarted = true;
            startTime = Date.now();
            currentTime = startTime;
            eventLoop = setInterval(EventLoop, EVENT_LOOP_MS);

            AddStartingBubble();

            AddStartingResourceNodes();

            AddBubble(board_rows-1, board_rows-1, VIRUS_BUBBLE_COLOR, 0.8, true);
        };

        this.End = function () {
            EndGame();
        }

        this.GameOver = function () {
            return gameOver;
        }

        this.Render = function (context) {
            for (let i=0; i<board_rows; i++) {
                for (let j=0; j<board_rows; j++) {
                    let x = this.left + (j * this.cell_width) + (this.cell_width*0.5);
                    let y = this.top + (i * this.cell_width) + (this.cell_width*0.5);

                    let smallCell = false;
                    if (board[i][j].items[0] && board[i][j].items[0].growthFactor < minBubblePopGrowthFactor) {
                        smallCell = true;
                    }
                    board[i][j].Render(x, y, this.cell_width, context, {'smallCell': smallCell});
                }
            }
        };

        this.HandleMouseDown = function(x, y) {
            if (!gameStarted) { return; }
            
            let relx = x - this.left;
            let rely = y - this.top;

            if (relx < 0 || rely < 0) {
                return;
            }

            let celx = Math.floor(relx / this.cell_width);
            let cely = Math.floor(rely / this.cell_width);

            if (poppedAlready.hasOwnProperty(cely+','+celx) == true) {
                console.log('Already popped a bubble at ' + cely + ' ' + celx);
                console.log(poppedAlready);
                return;
            }

            board[cely][celx].HandleMouseDown(x, y, PopBubble);
        }

        this.HandleMouseUp = function() {
            if (!gameStarted) { return; }
            
            poppedAlready = {};
        }

        function EndGame() {
            console.log("Game ending.");
            clearInterval(eventLoop);
            gameOver = true;
            gameStarted = false;
        }

        function EventLoop() {
            currentTime += EVENT_LOOP_MS;

            let victory = true;
            for (let i=0; i<board_rows; i++) {
                for (let j=0; j<board_rows; j++) {
                    let item = board[i][j].items[0];
                    if (item) {
                        if (item.Grow) {
                            let resourceItem = board[i][j].items[1];
                            let growthRate = bubbleGrowthFactorMax-(bubblesCount/bubblesMax);

                            if (item.virus) {
                                growthRate = bubbleGrowthFactorMax-(virusCount/bubblesMax);
                            }

                            if (resourceItem && resourceItem.Resource) {
                                growthRate = bubbleGrowthFactorMax * 20;

                                if (item.growthFactor < bubbleGrowthFactorMax || item.virus) {
                                    victory = false;
                                }
                            }
                            item.Grow(bubbleGrowthFactorMax, growthRate);

                            if (item.virus) {
                                if (item.growthFactor >= bubbleGrowthFactorMax) {
                                    PopBubble(i, j, 1, true);
                                }
                            }
                        } else if (item.Resource) {
                            victory = false;
                        }
                    }
                }
            }
            if (victory == true) {
                endTime = Date.now();
                console.log("You won.");
                EndGame();
            }
        }

        function CreateBoard() {
            board = []
            for (let i=0; i<board_rows; i++) {
                let row = [];
                for (let j=0; j<board_rows; j++) {
                    row.push(new Cell(i, j, MAX_ITEMS_PER_CELL));
                }
                board.push(row);
            }
        }

        function PopBubble(row, col, depth, isVirus) {
            if (!depth) { depth = 1; }
            if (depth > MAX_CASCADE) { return; }

            if (poppedAlready.hasOwnProperty(row+','+col) == true) {
                return;
            } else {
                poppedAlready[row+','+col] = true;
            }

            let b = board[row][col].GetItem();

            if (!b.Pop) { return; }
            
            if (b.virus && !isVirus) { return; }

            if (b.growthFactor < minBubblePopGrowthFactor) {
                return;
            }
            
            console.log('You popped a bubble at ' + row + ' ' + col);

            let energySpawlLostFactor = 0.9;
            let energyLost = b.growthFactor*0.7;
            let newBubbleEnergy =  energyLost*energySpawlLostFactor;
            let color = bubbleColor;

            if (isVirus) {
                color = VIRUS_BUBBLE_COLOR;
            } else {
                CreateBubbleAnimation(row, col, energyLost, color);
            }

            // Up
            CreateBubble(row-1, col, newBubbleEnergy, depth, isVirus, color);
            // Right
            CreateBubble(row, col+1, newBubbleEnergy, depth, isVirus, color);
            // Down
            CreateBubble(row+1, col, newBubbleEnergy, depth, isVirus, color);
            // Left
            CreateBubble(row, col-1, newBubbleEnergy, depth, isVirus, color);

            if (b.growthFactor >= bubbleGrowthFactorMax) {
                newBubbleEnergy = newBubbleEnergy * 1.1;
                // Top Right
                CreateBubble(row+1, col+1, newBubbleEnergy, depth, isVirus, color);
                // Top Left
                CreateBubble(row+1, col-1, newBubbleEnergy, depth, isVirus, color);
                // Bottom Right
                CreateBubble(row-1, col+1, newBubbleEnergy, depth, isVirus, color);
                // Bottom Left
                CreateBubble(row-1, col-1, newBubbleEnergy, depth, isVirus, color);
            }

            b.growthFactor -= energyLost;
        }

        function CreateBubbleAnimation(row, col, energy, color) {
            board[row][col].AddItem(new BubblePopAnimation(energy, color));
        }

        function CreateBubble(row, col, energy, depth, virus, color) {
            if (!depth) {depth=1;}
            if (row >= board_rows) { return; }
            if (row < 0) { return; }
            if (col >= board_rows) { return; }
            if (col < 0) { return; }

            let b = board[row][col].GetItem();
            if (!b || !b.Pop) {
                AddBubble(row, col, color, energy, virus);
            } else {
                if (b.growthFactor >= bubbleGrowthFactorMax) {
                    //PopBubble(row, col, depth+1, virus);
                }

                b.growthFactor += energy*(1/6);
                if (b.growthFactor >= bubbleGrowthFactorMax) {
                    b.growthFactor = bubbleGrowthFactorMax;
                }
            }
            CreateBubbleAnimation(row, col, energy, color);
        }

        function AddStartingBubble() {
            let center = Math.floor(board_rows*0.5);
  
            AddBubble(center, center, bubbleColor, defaultBubbleGrowthFactor)
        }

        function AddStartingResourceNodes() {
            // Level 1
            if (board_rows == 3) {
                AddResourceNode(2, 2, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
                AddResourceNode(2, 0, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
                AddResourceNode(0, 0, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
                AddResourceNode(0, 2, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
            }

            if (board_rows == 5) {
                AddResourceNode(0, 0, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
            }

            if (board_rows > 5) {
                AddResourceNode(board_rows-Math.floor(board_rows*0.5), board_rows-Math.floor(board_rows*0.5), RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5)
            }
            
            if (board_rows >= 9) {
                AddResourceNode(2, 2, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5)
            }

            if (board_rows >= 13) {
                AddResourceNode(Math.floor(board_rows*0.8), Math.floor(board_rows*0.5), RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
            }

            if (board_rows >= 15) {
                AddResourceNode(Math.floor(board_rows*0.3), Math.floor(board_rows*0.5), RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
            }

            if (board_rows >= 19) {
                AddResourceNode(Math.floor(board_rows*0.5) - 1, board_rows-Math.floor(board_rows*0.3)-3, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
                AddResourceNode(Math.floor(board_rows*0.5) - 2, board_rows-Math.floor(board_rows*0.3)-2, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);
            }
        }

        function AddBubble(x, y, color, growthFactor, virus) {
            board[x][y].AddItem(new Bubble(color, growthFactor, virus), true);

            if (!virus) {
                bubblesCount += 1;
            } else {
                virusCount += 1;
            }
        }
        
        function AddResourceNode(x, y, color, size) {
            board[x][y].AddItem(new ResourceNode(color, size));
        }


        function Setup() {
            console.log("Game object being constructed.");
            CreateBoard();
        }
        Setup();
    
    }
}


class Cell {
    constructor(row, col, maxItemsPerCell) {
        this.items = [];
        this.row = row;
        this.col = col;
        this.maxItemsPerCell = maxItemsPerCell;

        this.Render = function (x, y, size, context, data) {
            for (let i=0; i<this.items.length; i++) {
                this.items[i].Render(x, y, size, context, data);
                if (this.items[i].animationFinished) {
                    this.items.splice(i, 1);
                }
            }

            if (this.items.length > 0) {
                // Render the top item last
                //this.items[0].Render(x, y, size, context, data);
            }
        };

        this.GetItem = function() {
            return this.items[0];
        }

        this.AddItem = function(item, first) {
            if (this.items.length >= this.maxItemsPerCell) {
                return;
            }
            if (first) {
                this.items.unshift(item);
            } else {
                this.items.push(item);
            }
        };

        this.HandleMouseDown = function(x, y, callback) {
            if (this.items.length > 0) {
                callback(this.row, this.col);
            }
        }
    }
}


class Bubble {
    constructor(color, growthFactor, virus) {
        this.color = color;
        this.growthRateMin = 0.01;
        this.growthRateMax = 0.5;
        this.growthFactor = growthFactor;
        this.growthFactorMax = growthFactor+1;
        this.virus = virus;

        this.Render = function (x, y, size, context, data) {
            let arcSize = size*0.5*this.growthFactor;

            let fillColor = '#FFFFFF';
            let edgeColor = color;
            if (data.smallCell) {
                fillColor = '#C9C9C9';
                edgeColor = '#437289';
            }

            context.beginPath();
            context.arc(x, y, arcSize, 0, Math.PI * 2, true);
            context.fillStyle = edgeColor;
            context.fill();

            if (this.growthFactor < this.growthFactorMax) {
                context.beginPath();
                arcSize = arcSize-((arcSize*0.25)+(arcSize*0.10*(this.growthFactor/this.growthFactorMax)));

                context.arc(x, y, arcSize, 0, Math.PI * 2, true);
                context.fillStyle = fillColor;
                context.fill();
            }
        };


        this.Grow = function (maxSize, dimFactor) {
            this.growthFactorMax = maxSize;

            if (this.growthFactor < this.growthFactorMax) {
                this.growthFactor += (this.growthRateMin * this.growthFactor * dimFactor);
            }

            if (this.growthFactor > this.growthFactorMax) {
                this.growthFactor = this.growthFactorMax;
            }
        };

        this.Pop = function () { return true; };
    }
}


class BubblePopAnimation {
    constructor(dissolveSize, color) {
        var dropletCount = 3;
        var droplets = [];
        var minDropletSize = 0.005;

        this.animationFinished = false;

        while( droplets.length < dropletCount ) {
            droplets.push(new Droplet(0, 0, Math.random()*(dissolveSize*0.5), color));
        }

        this.Render = function (x, y, size, context, data) {
            let disappearedDroplets = 0;
            for (let i=0; i<droplets.length; i++) {
                if (droplets[i].size > minDropletSize) {
                    droplets[i].Render(x, y, size, context, data);
                } else {
                    disappearedDroplets += 1;
                }
            }
            if (disappearedDroplets == droplets.length) {
                this.animationFinished = true;
                this.Cleanup();
            }
        };

        this.Cleanup = function () {
            while (droplets.pop()) {}
        };
    }
}


class Droplet {
    constructor(x, y, size, color) {
        this.color = color;
        this.x = x;
        this.y = y;
        this.size = size;
        this.velocity = new Vector((Math.random()*size*70)-(size*50), -(Math.random()*size*50));

        this.Render = function (x, y, size, context, data) {
            this.x += this.velocity.x;
            this.y += this.velocity.y;
            this.velocity.x /= 1.1;
            this.velocity.y += 0.4;
            this.size /= 1.1;

            context.fillStyle = this.color;
            context.beginPath();
            context.moveTo(x+this.x, y+this.y);
            context.arc(x+this.x, y+this.y, this.size*size, 0, Math.PI * 2, true);
            context.fill();
        };
    }
}


class Vector {
    constructor (x, y) {
        this.x = x;
        this.y = y;
    }
}


class ResourceNode {
    constructor(color, size) {
        this.color = color;
        this.size = size;

        this.Render = function (x, y, size, context, data) {
            let arcSize = this.size*size*0.5;

            context.beginPath();
            context.arc(x, y, arcSize, 0, Math.PI * 2, true);
            context.fillStyle = this.color;
            context.fill();
        };

        this.Resource = function() { return true; };
    }
}