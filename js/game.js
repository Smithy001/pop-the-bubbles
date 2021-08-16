console.log("Game class being imported.");

class Game {
    constructor(left, top, board_rows, cell_width, bubbleColor) {
        var EVENT_LOOP_MS = 100;
        var MAX_CASCADE = 1;
        
        var virusChoicePower;
        var virusCells;
        var board, eventLoop;
        var aiLoop;
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
            aiLoop = setInterval(AiLoop, EVENT_LOOP_MS);

            virusChoicePower = 0;

            AddStartingBubble();

            AddStartingResourceNodes();

            if (board_rows > 14) {
                AddBubble(board_rows-1, board_rows-1, VIRUS_BUBBLE_COLOR, 0.8, true);
            }
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
            clearInterval(aiLoop);
            gameOver = true;
            gameStarted = false;
        }

        function AiLoop() {
            if (virusCells.length > 0) {
                let virusChoicePowerGain = Math.floor((Math.random() * 10) + 1);
                let timeFactor = EVENT_LOOP_MS / 100;
                virusChoicePowerGain += 25 //(board_rows - 16) / 3;
                virusChoicePowerGain *= timeFactor;

                virusChoicePower += virusChoicePowerGain;

                if (virusChoicePower >= 200)
                {
                    virusChoicePower = 0;
                    VirusPopBubble();
                }
            }
        }

        function VirusPopBubble() {
            let virusToPop;
            let highestPopValue = 2;

            console.log("Virus choosing a bubble to pop");

            for (let index = 0; index < virusCells.length; index++) {
                let thisVirus = virusCells[index];

                if (thisVirus.growthFactor > minBubblePopGrowthFactor) {
                    let northX = thisVirus.x + 1;
                    let southX = thisVirus.x - 1;
                    let eastX = thisVirus.x;
                    let westX = thisVirus.x;
                    
                    let northY = thisVirus.y;
                    let southY = thisVirus.y;
                    let eastY = thisVirus.y + 1;
                    let westY = thisVirus.y - 1;

                    //console.log("north " + northX + "," + northY);
                    //console.log("south " + southX + "," + southY);
                    //console.log("east " + eastX + "," + eastY);
                    //console.log("west " + westX + "," + westY);

                    let popValue = 0;
                    let northValue = GetVirusPopValueBasedOnNeighbor(northX, northY, thisVirus.x, thisVirus.y);
                    let southValue = GetVirusPopValueBasedOnNeighbor(southX, southY, thisVirus.x, thisVirus.y);
                    let eastValue = GetVirusPopValueBasedOnNeighbor(eastX, eastY, thisVirus.x, thisVirus.y);
                    let westValue = GetVirusPopValueBasedOnNeighbor(westX, westY, thisVirus.x, thisVirus.y);

                    let neighborCount = 0;
                    if (northValue > 0) { neighborCount += 1; }
                    if (southValue > 0) { neighborCount += 1; }
                    if (eastValue > 0) { neighborCount += 1; }
                    if (westValue > 0) { neighborCount += 1; }

                    popValue += (northValue + southValue + eastValue + westValue) / neighborCount;

                    //popValue += Math.floor((Math.random() * 3));
                    popValue *= thisVirus.growthFactor * 2;

                    if (thisVirus.growthFactor == thisVirus.growthFactorMax) { 
                        popValue *= 2;
                    }

                    if (popValue > highestPopValue) {
                        virusToPop = thisVirus;
                        console.log("Virus picking " + thisVirus.x + "," + thisVirus.y + " at value " + popValue + ". Prior value " + highestPopValue);
                        highestPopValue = popValue;
                    }
                }
            }

            if (virusToPop) {
                console.log("Virus popping " + virusToPop.x + "," + virusToPop.y);
                PopBubble(virusToPop.x, virusToPop.y, 1, true);
            }
            else {
                console.log("Virus is not popping a bubble at this time, highest value " + highestPopValue);
            }
        }

        function GetVirusPopValueBasedOnNeighbor(x, y, sourceX, sourceY) {
            // console.log("Virus is checking " + x + "," + y + " for growth");
            let row = board[x];
            let value = 0;

            if (row) {
                let cell = board[x][y];

                if (cell) {
                    let item = cell.items[0];
                    
                    if (item) {
                        if (item.virus) {
                            value = 0.1;
                        }
                        else if (item.Resource) {
                            value = 50;
                        }
                        else {
                            let resourceItem = cell.items[1];
                            let valueFactor = 20;

                            if (resourceItem && resourceItem.Resource) {
                                valueFactor += 40;
                            }
                            
                            // There's a player there, CAN grow
                            value = item.growthFactorMax - item.growthFactor;
                            value *= valueFactor;
                        }
                    }
                    else {
                        // There's nothing there, can grow
                        value =  1;
                    }
                }
                else {
                    // This column doesn't exist
                    value =  0;
                }
            }
            else {
                // This row doesn't exist
                value = 0;
            }

            if (value > 0) {
                let centerX = board_rows / 2;
                let centerY = board_rows / 2;
                let currentDifference = GetDistanceBetweenTwoPoints(centerX, centerY, sourceX, sourceY);
                let newDifference = GetDistanceBetweenTwoPoints(centerX, centerY, x, y);
                let diffValue = currentDifference - newDifference;
    
                diffValue *= 3;
    
                if (diffValue > 0)
                {
                    value += diffValue;
                }
            }

            return value;
        }

        function GetDistanceBetweenTwoPoints(targetX, targetY, startX, startY) {
            let xDiff = Math.abs(targetX - startX) * 2;
            let yDiff = Math.abs(targetY - startY) * 2;
            let difference = Math.sqrt(xDiff + yDiff);

            return difference;
        }

        function EventLoop() {
            currentTime += EVENT_LOOP_MS;

            let newBubbleCount = 0;
            let newVirusCount = 0;

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
                                newVirusCount += 1;
                            } else {
                                newBubbleCount += 1;
                            }

                            if (resourceItem && resourceItem.Resource) {
                                growthRate = (bubbleGrowthFactorMax * 10)*resourceItem.PercentToMax();

                                if (resourceItem.MaxLevel() && item.growthFactor >= bubbleGrowthFactorMax) {
                                    PopBubble(i, j, 1, false);
                                }

                                if (item.growthFactor < bubbleGrowthFactorMax || item.virus) {
                                    victory = false;
                                }
                            }
                            item.Grow(bubbleGrowthFactorMax, growthRate);                            
                        } else if (item.Resource) {
                            victory = false;
                        }
                    }
                }
            }

            bubblesCount = newBubbleCount;
            virusCount = newVirusCount;

            if (victory == true) {
                endTime = Date.now();
                console.log("You won.");
                EndGame();
            }
        }

        function CreateBoard() {
            board = [];
            virusCells = [];

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
            //    return;
            } else {
                //poppedAlready[row+','+col] = true;
            }

            let b = board[row][col].GetItem();

            if (!b.Pop) { return; }
            
            if (b.virus && !isVirus) { return; }

            if (b.growthFactor < minBubblePopGrowthFactor) {
                return;
            }
            
            if (!isVirus) {
                console.log('You popped a bubble at ' + row + ' ' + col);
            }

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
                let r = board[row][col].items[1];

                if (r && r.Resource && r.LevelUp) {
                    r.LevelUp();
                }

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
                energy *= 0.9;
                AddBubble(row, col, color, energy, virus);
            } else {
                //There's already a bubble, but is it on the same side as the one that just popped?
                
                if ((virus && !b.virus) || (!virus && b.virus)) {
                    if (b.growthFactor < minBubblePopGrowthFactor) {
                        b.growthFactor = 0;
                    }
                    else {
                        b.growthFactor -= energy * 1.2;
                    }

                    if (b.growthFactor <= 0) {
                        //Remove this bubble
                        board[row][col].items.splice(0);
                        if (b.isVirus) {
                            let virusIndex = virusCells.indexOf(b);
                            virusCells.splice(virusIndex);
                        }
                    }
                }
                else {
                    if (b.growthFactor >= bubbleGrowthFactorMax) {
                        //PopBubble(row, col, depth+1, virus);
                    }
    
                    b.growthFactor += energy*(1/5);
                    if (b.growthFactor >= bubbleGrowthFactorMax) {
                        b.growthFactor = bubbleGrowthFactorMax;
                    }
                }
            }
            CreateBubbleAnimation(row, col, energy, color);
        }

        function AddStartingBubble() {
            let center = Math.floor(board_rows*0.5);
  
            AddBubble(center, center, bubbleColor, defaultBubbleGrowthFactor)
        }

        function AddStartingResourceNodes() {
            let resourceNodeSize = defaultBubbleGrowthFactor*0.75;
            // Level 1
            if (board_rows == 3) {
                AddResourceNode(2, 2, RESOURCE_NODE_COLOR, resourceNodeSize);
                AddResourceNode(2, 0, RESOURCE_NODE_COLOR, resourceNodeSize);
                AddResourceNode(0, 0, RESOURCE_NODE_COLOR, resourceNodeSize);
                AddResourceNode(0, 2, RESOURCE_NODE_COLOR, resourceNodeSize);
            }

            if (board_rows == 5) {
                AddResourceNode(0, 0, RESOURCE_NODE_COLOR, resourceNodeSize);
            }

            if (board_rows > 5) {
                AddResourceNode(board_rows-Math.floor(board_rows*0.5), board_rows-Math.floor(board_rows*0.5), RESOURCE_NODE_COLOR, resourceNodeSize)
            }
            
            if (board_rows >= 9) {
                AddResourceNode(2, 2, RESOURCE_NODE_COLOR, resourceNodeSize)
            }

            if (board_rows >= 13) {
                AddResourceNode(Math.floor(board_rows*0.8), Math.floor(board_rows*0.5), RESOURCE_NODE_COLOR, resourceNodeSize);
            }

            if (board_rows >= 15) {
                AddResourceNode(Math.floor(board_rows*0.3), Math.floor(board_rows*0.5), RESOURCE_NODE_COLOR, resourceNodeSize);
            }

            if (board_rows >= 19) {
                AddResourceNode(Math.floor(board_rows*0.5) - 1, board_rows-Math.floor(board_rows*0.3)-3, RESOURCE_NODE_COLOR, resourceNodeSize);
                AddResourceNode(Math.floor(board_rows*0.5) - 2, board_rows-Math.floor(board_rows*0.3)-2, RESOURCE_NODE_COLOR, resourceNodeSize);
            }
        }

        function AddBubble(x, y, color, growthFactor, virus) {
            let bubble = new Bubble(color, growthFactor, virus, x, y);

            if (virus) {
                console.log("Added bubble at " + x + "," + y);
                virusCells.push(bubble);
            }

            board[x][y].AddItem(bubble, true);

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
    constructor(color, growthFactor, virus, x, y) {
        this.color = color;
        this.growthRateMin = 0.01;
        this.growthRateMax = 0.5;
        this.growthFactor = growthFactor;
        this.growthFactorMax = growthFactor+1;
        this.virus = virus;
        this.x = x;
        this.y = y;

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
        this.level = 5;
        var maxLevel = 10;

        this.Render = function (x, y, size, context, data) {
            let arcSize = (this.size*(this.PercentToMax()))*size;

            context.beginPath();
            context.arc(x, y, arcSize, 0, Math.PI * 2, true);
            context.fillStyle = this.color;
            context.fill();
        };

        this.Resource = function() { return true; };

        this.MaxLevel = function() { return (this.level >= maxLevel); }

        this.PercentToMax = function() {
            return this.level/maxLevel;
        }

        this.LevelUp = function() { 
            if (this.level < maxLevel) {
                this.level += 1;
            }
        }
    }
}