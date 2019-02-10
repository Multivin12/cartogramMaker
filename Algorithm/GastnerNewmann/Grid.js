const {SVGLoader,SVGCoordinate,Coordinate,Region,Map } = require('../../mapLoad/loadSVGFile.js');

class Grid {

    /**
     * 
     * @param {int} xsizeGrid - X size of the grid
     * @param {int} ysizeGrid - Y size of the grid
     * @param {int} ysizeCanvas - Number of pixels in the x direction in the canvas
     * @param {int} ysizeCanvas  - Number of pixels in the y direction in the canvas
     */
    constructor(xsizeGrid,ysizeGrid,xsizeCanvas,ysizeCanvas) {
        this.xsizeGrid = xsizeGrid;
        this.ysizeGrid = ysizeGrid;
        this.xsizeCanvas = xsizeCanvas;
        this.ysizeCanvas = ysizeCanvas;

        //Create an array for storing the grid squares
        this.gridSquares = new Array(ysizeGrid);
        for(var i=0;i<this.gridSquares.length;i++) {
            this.gridSquares[i] = new Array(xsizeGrid);
        }

        //create the grid square objects and store it into this array
        var Xinc = xsizeCanvas/xsizeGrid;
        var Yinc = ysizeCanvas/ysizeGrid;

        var topLeft = new Coordinate(0,0);

        for(var i=0;i<this.gridSquares.length;i++) {
            for(var j=0;j<this.gridSquares[i].length;j++) {
                this.gridSquares[i][j] = new GridSquare(topLeft,new Coordinate(topLeft.x+Xinc,topLeft.y),new Coordinate(topLeft.x+Xinc,topLeft.y+Yinc),
                                new Coordinate(topLeft.x,topLeft.y+Yinc));
                var oldX = topLeft.x;
                var oldY = topLeft.y;
                topLeft = new Coordinate(oldX+Xinc,oldY);
            }
            var oldY = topLeft.y;
            topLeft = new Coordinate(0,oldY+Yinc);
        }
    }


}

class GridSquare {

    /**
     * Constructor for creating a new grid square 
     * 
     * @param {Coordinate} topLeft 
     * @param {Coordinate} topRight 
     * @param {Coordinate} bottomRight 
     * @param {Coordinate} bottomLeft 
     */
    constructor(topLeft,topRight,bottomRight,bottomLeft) {
        this.topLeft = topLeft;
        this.topRight = topRight;
        this.bottomRight = bottomRight;
        this.bottomLeft = bottomLeft;
    }

    /**
     * Method for getting the amount of area that is within the grid square.
     * Expressed as a decimal.
     * 
     * @param {Region} region 
     */
    getAreaPercent(region) {

    }
}

var grid = new Grid(3,2,700,700);
var testRegion = new Region();
testRegion.addCoordinate(new Coordinate(1,2));
testRegion.addCoordinate(new Coordinate(2,2));
testRegion.addCoordinate(new Coordinate(2,1));
testRegion.addCoordinate(new Coordinate(1,1));

/*
//Print out the coordinates of each grid square
for(var i=0;i<grid.gridSquares.length;i++) {
    for(var j=0;j<grid.gridSquares[i].length;j++) {
        console.log(grid.gridSquares[i][j]);
    }
    console.log("---------------------------");
}*/

console.log(grid.gridSquares[0][0].getAreaPercent(testRegion));