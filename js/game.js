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
        var PROJECTILE_COLOR = '#a837ff';

        var bubblesMax = board_rows * board_rows;
        var bubblesCount = 0;
        var virusCount = 0;

        var MAX_ITEMS = 1000;
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

            
            let endRow = board_rows-2;
            let endCol = 2;
            let endX = this.left + (endCol * this.cell_width) + (this.cell_width*0.5);
            let endY = this.top + (endRow * this.cell_width) + (this.cell_width*0.5);


            //AddResourceNode(endRow, endCol, RESOURCE_NODE_COLOR, defaultBubbleGrowthFactor*0.5);

            AddBubble(endRow, endCol, VIRUS_BUBBLE_COLOR, 0.8, true);
            

            board[0][0].AddItem(new Projectile(PROJECTILE_COLOR, defaultBubbleGrowthFactor, new Vector(1, 1), endX, endY, endCol, endRow, 1, 10, HandleExplosion));
/*


            endRow = board_rows*0.5;
            endCol = board_rows*0.5;
            endX = this.left + (endCol * this.cell_width) + (this.cell_width*0.5);
            endY = this.top + (endRow * this.cell_width) + (this.cell_width*0.5);
*/
            let center = Math.floor(board_rows*0.5);
            board[center][center].AddItem(new Projectile(PROJECTILE_COLOR, defaultBubbleGrowthFactor, new Vector(1, 1), endX, endY, endCol, endRow, 1, 10, HandleExplosion));

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

                if (!thisVirus) { continue; }

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
                    for (let h=0; h<board_rows; h++) {
                        let item = board[i][j].items[h];
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

                                    if ((item.growthFactor < bubbleGrowthFactorMax && !resourceItem.MaxLevel())|| item.virus) {
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

        function HandleExplosion(row, col) {
            DamageCell(row, col, false);

            

            let b = board[row][col].GetItem();
            let destroyCell = false;
            if (b && b.growthFactor < (minBubblePopGrowthFactor)) {
                destroyCell = true;
            }

            DamageCell(row-1, col-1, true);
            DamageCell(row-1, col, true);
            DamageCell(row-1, col+1, true);
            DamageCell(row, col-1, true);
            
            DamageCell(row, col+1, true);
            DamageCell(row+1, col-1, true);
            DamageCell(row+1, col, true);
            DamageCell(row+1, col+1, true);

            // Destory the impact cell at the end
            if (destroyCell) {
                RemoveBubble(row, col);
            }
            
        }

        function DamageCell(row, col, destory) {
            if (!board[row] || !board[row][col]) { return; }
            CreateBubbleAnimation(row, col, 0.25, '#000000');
            CreateBubbleAnimation(row, col, 0.5, PROJECTILE_COLOR);

            let b = board[row][col].GetItem();

            if (!b || !b.Pop) { return; }

            b.growthFactor -= (b.growthFactor * 0.5);

            if (destory && b && b.growthFactor < (minBubblePopGrowthFactor)) {
                RemoveBubble(row, col);
                return;
            }

            let isVirus = b.virus;

            PopBubble(row, col, 1, isVirus);
        }

        function PopBubble(row, col, depth, isVirus) {
            if (!depth) { depth = 1; }
            if (depth > MAX_CASCADE) { return; }

            if (poppedAlready.hasOwnProperty(row+','+col) == true) {
            //    return;
            } else {
                //poppedAlready[row+','+col] = true;
            }

            for (let i=0; i<board[row][col].items.length; i++) {
                //let b = board[row][col].GetItem();
                let b = board[row][col].items[i];

                if (b.launched == false) {
                    


                    let changeX = b.destinationX-b.x;
                    let changeY = b.destinationY-b.y;
    
                    let slope = changeY/changeX;

                    
                    b.destinationCol = virusCells[0].y;
                    b.destinationRow = virusCells[0].x;
                    b.destinationX = left + (b.destinationCol * cell_width) + (cell_width*0.5);
                    b.destinationY = top + (b.destinationRow * cell_width) + (cell_width*0.5);

                    b.Launch(slope);
                }
    
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
        }

        function CreateBubbleAnimation(row, col, energy, color) {
            if (board[row] && board[row][col]) {
                board[row][col].AddItem(new BubblePopAnimation(energy, color));
            }
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
                        RemoveBubble(row, col);
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

        function RemoveBubble(row, col) {
            let b = board[row][col].items[0];
            
            if (!b || !b.Pop) { return; }

            if (b.virus) {
                RemoveVirusCell(row, col);
            }
            board[row][col].items.splice(0, 1);
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
                AddResourceNode(board_rows-Math.floor(board_rows*0.5), board_rows-Math.floor(board_rows*0.5), RESOURCE_NODE_COLOR, resourceNodeSize);
                AddResourceNode(0, board_rows-1, RESOURCE_NODE_COLOR, resourceNodeSize);
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
        
        function AddResourceNode(row, col, color, size) {
            board[row][col].AddItem(new ResourceNode(color, size));
        }

        function RemoveVirusCell(row, col) {
            for(let i=0;i<virusCells.length;i++) {
                if (virusCells[i].x == row && virusCells[i].y == col) {
                    virusCells.splice(i, 1);
                    return;
                }
            }
        }

        function FindTarget(row, col) {
            let proximityThreat = 1;
            let sizeThreat = 1;

            for(let i=0;i<virusCells.length;i++) {
                if (virusCells[i].x == row && virusCells[i].y == col) {
                    virusCells.splice(i, 1);
                    return;
                }
            }
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
    constructor (x, y, velocityX, velocityY) {
        this.x = x;
        this.y = y;
        this.velocityX = velocityX;
        this.velocityY = velocityY;
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

class Projectile {
    constructor(color, size, vector, destinationX, destinationY, destinationCol, destinationRow, power, level, destinationAction) {
        this.color = color;
        this.size = size;
        this.vector = vector;
        this.destinationX = destinationX;
        this.destinationY = destinationY;
        this.destinationCol = destinationCol;
        this.destinationRow = destinationRow;
        this.power = power;
        this.level = level;
        this.traveled = new Vector(0, 0, 0, 0);
        this.spin = 25;
        this.x = 0;
        this.y = 0;
        this.arrived = false;
        this.launched = false;
        
        var constructionProgress = 100;
        var maxConstructionProgress = 100;
        var timeTicks = 0;

        this.Render = function (x, y, size, context, data) {
            if (this.arrived) {
                return;
            }

            let objectSize = this.size*size*(constructionProgress/maxConstructionProgress);
            
            let arcSize = this.size*size*0.5;

            //context.beginPath();
            //context.arc(x + this.traveled.x, y + this.traveled.y, arcSize, 0, Math.PI * 2, true);
            //context.arc(x, y, arcSize, 0, Math.PI * 2, true);


            //context.arc(x - (objectSize*0.5) + this.traveled.x, y - (objectSize*0.5) + this.traveled.y, arcSize, 0, Math.PI * 2, true);
            //context.fillStyle = '#ffffff';
            //context.fill();
            

            
            let xOfflet = x - (size*0.5);
            let yOfflet = y - (size*0.5);

            

            // Non-rotated rectangle
            //context.fillStyle = 'gray';
            //context.fillRect(xOfflet, yOfflet, size, size);

            // Rotated rectangle
            
            //context.fillStyle = 'red';
            //context.fillRect(100, 0, 80, 20);

            //context.moveTo(x - (objectSize*0.5) + this.traveled.x, y - (height*0.5) + this.traveled.x);
            //context.arc(0, 0, 5, 0, 2 * Math.PI);

            //context.rotate((45 + this.traveled.x) * Math.PI / 180);

            // Matrix transformation
/*                        
            context.translate(x - (objectSize*0.5) + this.traveled.x, y - (height*0.5) + this.traveled.y);
            context.rotate((this.traveled.x + 10) * Math.PI / 180);
            context.translate(-(x - (objectSize*0.5) + this.traveled.x), -(y - (height*0.5) + this.traveled.y));

            context.beginPath();
            context.moveTo(x - (objectSize*0.5) + this.traveled.x, y - (height*0.5) + this.traveled.y);
            context.lineTo(x + (objectSize*0.5) + this.traveled.x, y - (height*0.5) + this.traveled.y);
            context.lineTo(x + this.traveled.x, y + (height * 0.5) + this.traveled.y);
            context.closePath();
*/
            
            let movingX = x + this.traveled.x;
            let movingY = y + this.traveled.y;

            this.x = movingX;
            this.y = movingY;

            let length = objectSize;
            let height = length * Math.cos(Math.PI / 6);
            
            let diff = (length-height)*0.5;

            xOfflet = movingX - (length*0.5);
            yOfflet = movingY - (height*0.5);
            

            let translateX = movingX; //(length*0.5);
            let translateY = movingY - diff; //(height*0.5);

            //context.moveTo(movingX, movingY);

            
            context.translate(translateX, translateY);
            //context.rotate(((this.traveled.x + this.traveled.y) * this.spin) * Math.PI / 180);
            context.rotate((timeTicks * this.spin) * Math.PI / 180);
            //context.rotate((10) * Math.PI / 180);
            context.translate(-(translateX), -(translateY));          
            


            
/*
            context.translate(movingX - (length*0.5), movingY - (height*0.5));
            context.rotate((this.traveled.x * 10) * Math.PI / 180);
            //context.rotate((10) * Math.PI / 180);
            context.translate(-(movingX - (length*0.5)), -(movingY - (height*0.5)));
*/

            context.beginPath();
            context.moveTo(xOfflet, yOfflet);
            context.lineTo(xOfflet + length, yOfflet);
            context.lineTo(movingX, yOfflet+height);
            //context.lineTo(movingX - (length*0.5), movingY + (height*0.5));
            context.closePath();


            if (constructionProgress < maxConstructionProgress) {
                context.fillStyle = '#ffffff';
                context.fill();

                context.strokeStyle = this.color;
                context.lineWidth = 2;
                context.stroke();


            } else {
                context.fillStyle = this.color;
                context.fill();
            }

            //context.fillStyle = this.color;
            //context.fill();


            //context.translate(x, y);
            //
            //context.translate(-x, -y);

            

            // Matrix transformation
            //context.translate(x, y);
            //context.rotate(this.traveled.x * Math.PI / 180);
            //context.translate(-x, -y);
/*
            context.beginPath();
            context.moveTo(x - (objectSize*0.5) + this.traveled.x, y - (height*0.5) + this.traveled.y);
            context.lineTo(x + (objectSize*0.5) + this.traveled.x, y - (height*0.5) + this.traveled.y);
            context.lineTo(x + this.traveled.x, y + (height * 0.5) + this.traveled.y);
            context.closePath();

            // Rotated rectangle
            context.fillStyle = 'red';
            context.fillRect(x-(objectSize*0.5), y-(objectSize*0.5), objectSize, objectSize);
*/



            













            /*
            let height = objectSize * Math.cos(Math.PI / 6);
            
            let movingX = x; // + this.traveled.x;
            let movingY = y; // + this.traveled.y;


            


            context.translate(movingX - (objectSize*0.5), movingY - (objectSize*0.5));
            //context.rotate((this.traveled.x * 10) * Math.PI / 180);
            context.rotate((10) * Math.PI / 180);
            context.translate(-(movingX - (objectSize*0.5)), -(movingY - (objectSize*0.5)));


            context.beginPath();
            context.moveTo(movingX - (objectSize*0.5), movingY - (objectSize*0.5));
            context.lineTo(movingX + (objectSize*0.5), movingY - (objectSize*0.5));
            context.lineTo(movingX, movingY + (objectSize * 0.5));
            context.closePath();
            */


            context.setTransform(1, 0, 0, 1, 0, 0);
        };


        this.Launch = function(slope) {
            this.slope = slope;
            this.launched = true;
        }

        this.Grow = function() {
            timeTicks += 1;

            if (constructionProgress < maxConstructionProgress) {
                constructionProgress += 1;
            }

            if (!this.launched || this.arrived) {
                return;
            }
            let changeX = this.destinationX-this.x;
            let changeY = this.destinationY-this.y;

            if (changeX+changeY<0) {
                this.arrived = true;
                destinationAction(this.destinationRow, this.destinationCol);
                return;
            }
//if (Math.abs(changeX)+Math.abs(changeY)<this.size) {

            /// keep radians, don't convert to degrees
            //projectiles[pindex]['angle'] = Math.atan2(y - 200, x - 300); // * 180 / Math.PI;
            let angle = Math.atan2(this.y-this.destinationY, this.x-this.destinationX);

            this.traveled.x -= 10 * Math.cos(angle);
            this.traveled.y -= 10 * Math.sin(angle);

            return;

            let slope = changeY/changeX;

            slope = this.slope;

            

            this.traveled.velocityX = (this.power + this.level);
            this.traveled.velocityY = this.slope*(this.power + this.level);




            //this.traveled.velocityX = destinationX-x;
            //this.traveled.velocityY = destinationY-y;


            this.traveled.x += this.traveled.velocityX;
            this.traveled.y += this.traveled.velocityY;
        };
    }
} 