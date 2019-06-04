/**
 * This file has classes all to do with handling when the map file is loaded such as the coordinates 
 * and storing the regions and coordinates in appropriate objects.
 */
const ArrayList = require('arraylist');
const Queue = require('queue');
const DCT2 = require('../Algorithm/GastnerNewmann/DCT2.js');
const path = require('path');
//This module is for converting the svg file to a JSON format.
const xml2js = require('xml2js');
const fs = require('fs');
const {createCanvas, loadImage} = require('canvas');
const polygonClipping = require('polygon-clipping');


var canvasSizeX = 700;
var canvasSizeY = 700;

/**
 * Class for handling the process of loading SVG files. Has a field JSON Data which is the
 * JSON equivalent of the loaded SVG file as well as a field for storing the map data.
 */
class SVGLoader {

    constructor(obj) {
        this.JSONData = null;
        this.map = null;

        if(obj) {
            Object.assign(this,obj);
        }
    }

    /** 
    * This method is for reading in the coordinates for all the regions and putting them 
    * into the appropriate objects.
    */
    readSVGFile(filePath) {
        //Read in the SVG file
        var parser = new xml2js.Parser();
        var json = null;
        
        var data = fs.readFileSync(path.join(__dirname + filePath));
        parser.parseString(data, (err, result) => {
            if(err){
                console.log(err);
                return;
            } else {
                //Convert it into a JSON file
                var JSONData = JSON.stringify(result,null,1);
                JSONData = JSON.parse(JSONData);
                json = JSONData;
            }
        });
        this.JSONData = json;
        //preprocess the SVG to a set format
        this.svgLoaderPreprocessor();
    }

    /**
     * Method to convert any SVG to the format that the system requires.
     * Read SVG File must be called before calling this method.
     * NOTE: the path must contain only line segments as circle paths are not supported.
     * 
     */
    svgLoaderPreprocessor() {

        try{
            var regions = this.JSONData.svg.path;
        } catch(err) {
            throw new Error("File Load Error: File Corrupted. Read SVG in browser for more information.");
        }

        //to remove the preceding g tags
        if(typeof(regions) === "undefined") {
            var temp = this.JSONData.svg;
            this.JSONData.svg = temp;

            regions = this.JSONData.svg.path;

            if(typeof(regions) == "undefined") {

                if(this.JSONData.svg.g.length == 1) {
                    var temp = this.JSONData.svg.g[0];

                    //is the amCharts map file
                    if (typeof(temp["$"]) == "undefined") {
                        this.JSONData.svg = temp;

                        regions = this.JSONData.svg.path;
                    }
                    //for the other highcharts maps
                    else {
                        temp = this.JSONData.svg.g[0].path;

                        this.JSONData.svg.path = temp;

                        regions = this.JSONData.svg.path;
                    }
                }
                //For the Highcharts map collection (France)
                else {
                    var temp = this.JSONData.svg.g[0].path;

                    this.JSONData.svg.path = temp;
                    regions = this.JSONData.svg.path;

                }
            }
        }
        //This part is to find regions enclosed in <g> tags
        //and add these to the set of regions to be loaded
        var currentElement = this.JSONData.svg.g;
        //test if the document actually has any g tags
        if(typeof(currentElement) !== "undefined") {
            var listToEvaluate = new Queue();

            for(var i=0;i<currentElement.length;i++) {
                listToEvaluate.push(currentElement[i]);
            }
            //essentially an implemetation of the breadth first search
            //as DOM is a tree data structure.
            while(listToEvaluate.length !== 0) {
                currentElement = listToEvaluate.pop();

                //if this happens it's not a region element
                if(typeof(currentElement.path) === "undefined") {
                    var childElements = currentElement.g;

                    //Means there are no regions present in the g tag
                    if(typeof(childElements) === "undefined") {
                    } else {
                        for(var i=0;i<childElements.length;i++) {
                            listToEvaluate.push(childElements[i]);
                        }
                    }
                } else {
                    //else add it to the collection of regions
                    var jsonToAdd = currentElement.path[0];
                    var jsonToAddTo = this.JSONData.svg.path;
                    
                    jsonToAddTo.push(jsonToAdd);
                }
            }
        }

        //Now need to format the path attribute string
        for(var i=0;i<regions.length;i++) {
            var regionData = regions[i]['$'].d;
            //String replace prototype function
            String.prototype.replaceAt=function(index, replacement) {
                return this.substr(0, index) + replacement+ this.substr(index + replacement.length);
            };
            if(regionData.match(/[HVSQTAhvsqta]+/)) {
                throw new Error("SVG Path can only contain Line Segments (L), Circular lines(C), Move to (M) or Close path (Z) Characters. Path Attribute Number= " + (i+1) +".");
            }
            
            //Need to convert the circular paths to line segments.
            //Firstly find the index of all C chars
            var regex = /(?<=[0-9])(\s|[Cc]|[Mm]|[Ll])(?=[0-9])/g, result, indices = [];
            //variable to record whether you replace the character or not
            var doReplace = false;
            var j = 0;
            while ( (result = regex.exec(regionData)) ) {
                indices.push(result.index);
                //to test that an M character has been matched
                if(regionData[result.index] == "M") {
                    regionData = regionData.replaceAt(indices[j]-1," M");
                    doReplace = false;
                }else if(regionData[result.index] == "L") {
                    regionData = regionData.replaceAt(indices[j]-1," L");
                    doReplace = false;
                }else if(doReplace) {
                    regionData = regionData.replaceAt(indices[j]-1," L");
                    doReplace = false;
                } else {
                    regionData = regionData.replaceAt(indices[j],",");
                    doReplace = true;
                }
                j++;
            }   
            

            //if it doesn't contain the Z Character then just add it on the end
            if(!(regionData.includes("Z"))) {
                regionData += " Z";
            }

            //must include this at the bottom as Strings are immutable
            this.JSONData.svg.path[i]['$'].d = regionData;
        }
        //next is to combine regions together as the path attributes are seperate if a Region spans accross multiple islands
        //for the wikipedia SVG File
        //This is done by checking if a region has a name then adding following paths to that region if they don't have a name.
        //any paths that are defined before one without a name tag are ignored.
        var regions = this.JSONData.svg.path;
        var currentRegionName = null;

        var numRegions = regions.length;
        for(var j=0;j<regions.length;j++) {

            var flag = false;
            var flag2 = false;

            try{
                currentRegionName = regions[j].name[0]._;
            } catch(err) {
                if(typeof(regions[j].desc) === "undefined") {
                    //Means the region has no name at all
                    //therefore add the name of the previous region to this one.
                    this.JSONData.svg.path[j].name = currentRegionName;
                    flag = true;
                } else {
                    currentRegionName = regions[j].desc[0].name;
                    flag2 = true;
                }
            }
            
            
            if(!flag) {
                //Means regionName has an id attribute
                if(typeof(currentRegionName) === "string") {
                    this.JSONData.svg.path[j].name = [regions[j].name[0]._];
                } else {
                    if(flag2) {
                        this.JSONData.svg.path[j].name = [regions[j].desc[0].name[0]];
                    } else {
                        this.JSONData.svg.path[j].name = [regions[j].name[0]];
                    }
                }
                currentRegionName = this.JSONData.svg.path[j].name;
            }
        }


        //next is to test if the name of a region is stored in an attribute (like it is for AM Charts)
        var regions = this.JSONData.svg.path;
        for(var i=0;i<regions.length;i++) {
            var title = regions[i]["$"].title;
            if(typeof(title) !== "undefined") {
                this.JSONData.svg.path[i].name = [title];
            }
        }

        if(this.JSONData.svg.path[numRegions-1].name == null) {
            throw new Error("Reached end of file with no name info present.");
        }

    }

    /**
     * This method uses the gathered JSON data to create a map object.
     */
    collectMapData() {
        if(this.JSONData === null) {
            throw new Error ("JSON Data has not been loaded yet.");
        } 

        //Gather the height and width of the map file
        var height = this.JSONData.svg["$"].height;
        var width = this.JSONData.svg["$"].width;

        this.map = new Map(parseFloat(height),parseFloat(width));

        //Collect the coordinates of all the regions in the map file
        var arrayOfRegions = null;
        
        arrayOfRegions = this.JSONData.svg.path;


        var ScaleX = canvasSizeX / this.map.ysize;
        var ScaleY = canvasSizeY / this.map.xsize;

        for(var i=0;i<arrayOfRegions.length;i++) {
            //get the element corresonding to the coordinates of the region
            var coordinateString = arrayOfRegions[i]["$"].d;

            //put this into an array
            //stores the Z charater as the last element in the array
            var coordinateArray = coordinateString.split(" ");

            var newRegion = new Region();

            //Under the standard format that the algorithm is expecting, this is where the
            //name of each region should be stored.
            try{
                var regionName = arrayOfRegions[i].name[0];
                newRegion.setName(regionName);
            } catch(err) {
                
            }

            var divider = 1;
            if(coordinateArray.length > 10000) {
                divider = parseInt(Math.round(coordinateArray.length/10000));
            }

            var count = 0;
            for(var j=0;j<coordinateArray.length;j++) {


                var isEnd = false;
                //nextj is just for telling the loop which index to go to next.
                var nextj = j;
                //You know this is the final coordinate of a certain region
                if(coordinateArray[(j+1)] === "Z") {
                    isEnd = true;
                    //skip over the Z because obviously this is not a coordinate
                    nextj = j+1;
                }
                var xycoordinate = coordinateArray[j].match(/\d+\.?\d+/g);
                var drawChar = coordinateArray[j][0];

                var newCoordinate = new SVGCoordinate(drawChar,parseFloat(xycoordinate[0]*ScaleX),parseFloat(xycoordinate[1]*ScaleY),isEnd);
                //to roughly remove coordinates of very large SVG 
                //as a very accuracte SVG will slow down the algorithm heavily
                if(newCoordinate.drawChar === "M" || newCoordinate.ZPresent) {
                    newRegion.addCoordinate(newCoordinate);
                } else {
                    count++;
                }
                if(count%divider === 0) {
                    newRegion.addCoordinate(newCoordinate);
                }
                newRegion.addCoordinate(newCoordinate);
                j = nextj;
            }
            this.map.addRegion(newRegion);
        }
    }


    /** 
     * Method for drawing the map onto a png file which can then be loaded into
     * by the html. 
    */
    drawMapToPNG(xsize,ysize,filePath,newGridPoints) {


        //const canvas = createCanvas(parseFloat(this.map.xsize),parseFloat(this.map.ysize));
        const canvas = createCanvas(canvasSizeX,canvasSizeY);
        const context = canvas.getContext('2d');

        //Draw the rectangle containing the map
        /*
        context.beginPath();
        context.lineWidth = 5;
        context.rect(0,0,canvas.width,canvas.height);
        context.strokeStyle = 'rgb(0,0,0)';
        context.stroke();
        */

        //Draw the SVG Data into the rectangle
        context.strokeStyle = 'rgb(0,0,0)';
        context.lineWidth = 1;


        //Draw the map
        for(var i=0;i<this.map.regions.length;i++) {

            context.fillStyle = 'orange';
            context.beginPath();
            for(var j=0;j<this.map.regions[i].coordinates.length;j++) {

                var coordinate = this.map.regions[i].coordinates[j];
                
                if(coordinate.drawChar === 'M') {
                    context.moveTo(coordinate.x,coordinate.y);
                } else {
                    context.lineTo(coordinate.x,coordinate.y);
                }

                if(coordinate.ZPresent) {
                    //Corresponds to the Z character in the path attribute
                    context.stroke();
                    context.fill();
                    context.closePath();

                    context.beginPath();
                }
            }
        }

        var scaleX = this.map.xsize / xsize;
        var scaleY = this.map.ysize / ysize;

        context.strokeStyle = 'rgb(0,0,0)';
        context.lineWidth = 3;

        /*
        //Code for drawing the set of grid points created by the algorithm module
        if(typeof(newGridPoints) !== "undefined") {
            //iterate through horizontally
            for(var i=0;i<newGridPoints.length-1;i++) {
                if((i+1) % (xsize+1) === 0) {
                    
                } else {
                    context.beginPath();
                    context.moveTo(newGridPoints[i][0]*scaleX,newGridPoints[i][1]*scaleY);
                    context.lineTo(newGridPoints[(i+1)][0]*scaleX,newGridPoints[(i+1)][1]*scaleY);
                    context.stroke();      
                }    
            }

            //now need to iterate vertically
            console.log("----------------------");
            for(var i=0;i<newGridPoints.length-1;i++) {
                var actualIndex = parseInt(i/(ysize+1)) + (i%(ysize+1))*(ysize+1);
                var nextActualIndex = parseInt((i+1)/(ysize+1)) + ((i+1)%(ysize+1))*(ysize+1);

                if((i+1) % (ysize+1) === 0) {
                    
                } else {
                    context.beginPath();
                    context.moveTo(newGridPoints[actualIndex][0]*scaleX,newGridPoints[actualIndex][1]*scaleY);
                    context.lineTo(newGridPoints[nextActualIndex ][0]*scaleX,newGridPoints[nextActualIndex][1]*scaleY);
                    context.stroke();   
                }  
            }
        }
        */

        //Draw the grid
        //variables for scaling the grid number to the actual canvas coordinates
        //mainly for debugging purposes
        /*
        var scaleX = this.map.xsize / xsize;
        var scaleY = this.map.ysize / ysize;

        context.strokeStyle = 'rgb(0,0,0)';
        context.lineWidth = 3;

        //draw the vertical grids
        for(var i=0;i<xsize;i++) {
            context.beginPath();
            context.moveTo(i*scaleX,0);
            context.lineTo(i*scaleX,this.map.ysize);
            context.stroke();
        }

        //draw the horizontal grids
        for(var i=0;i<ysize;i++) {
            context.beginPath();
            context.moveTo(0,i*scaleY);
            context.lineTo(this.map.xsize,i*scaleY);
            context.stroke();
        }
        */
        
        //Save the canvas onto an external png file
        var out = fs.createWriteStream(filePath);
        var stream = canvas.pngStream();

        stream.on('data', function(chunk){out.write(chunk); });

        stream.on('end', function(){console.log('saved png'); });
    }

    drawMapToSVG(filePath) {
        var svg = '';
        svg += '<!DOCTYPE svg>\n'
        //The extra bits after the svg version are all styling links
        svg += '<svg width="' + 700 + 'px" height="' + 700 + 'px" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n';


        var regions = this.map.regions;
        for(var i=0;i<regions.length;i++) {
            var path = '';
            var region = regions.get(i);
            svg += '<path fill="#CEE3F5" stroke="#6E6E6E" stroke-width="0.4" d="'
            for(var j=0;j<region.coordinates.length;j++) {
                var coordinate = region.coordinates.get(j);
                if(coordinate.drawChar === 'M') {
                    svg += 'M' + (coordinate.x) + ',' + (coordinate.y) + ' ';
                } else {
                    svg += 'L' + (coordinate.x) + ',' + (coordinate.y) + ' ';
                }
                if(coordinate.ZPresent) {
                    svg += 'Z';
                }
                
            }
            svg += '">\n';
            svg += '<name>';
            svg += regions.get(i).name;
            svg += '</name>\n';
            svg += '</path>\n';
        }
        svg += '</svg>\n';

        fs.writeFile(filePath, svg, function(err) {
            if(err) {
                console.log(err);
            }
        
        }); 
    }
}

/**
 * Class for a general Coordinate. This is what is used in HTML canvas.
 */
class Coordinate {

    constructor(x,y) {
        this.x = x;
        this.y = y;
    }

    /**
     * Method for printing out the coordinates to the console.
     */
    printCoordinate() {
        console.log("(" + this.x + ","+ this.y + ")");
    }
}

/**
 * Class for handling the SVG Coordinate system
 */
class SVGCoordinate extends Coordinate{

    /**
     * Constructor for this class that takes two ints as an argument
     * corresponding to the x,y of the coordinate, the drawType character which is a 
     * SVG letter corresponding to M or L meaning move to and draw line to respectively
     * and a boolean to mark if the coordinate is the last one in the region.
     */
    constructor(drawChar,x,y,ZPresent) {
        super(x,y);
        this.drawChar = drawChar;
        this.ZPresent = ZPresent;
    }

}

/**
 * Class for hadling a certain region, stores an arraylist of coordinates as its field.
 */
class Region {

    /**
     * Constructor that takes in an empty argument.
     */
    constructor(obj) {
        this.coordinates = new ArrayList();
        this.colour = null;
        this.name = null;
    }

    /**
     * Method for adding a Coordinate object to the collection.
     * @param {SVGCoordinate} c 
     */
    addCoordinate(c) {
        this.coordinates.add(c);
    }

    /**
     * Method for setting the name of a particular region.
     * @param {String} regionName 
     */
    setName(regionName) {
        this.name = regionName;
    }

    /**
     * Method for adding a colour to the region. This field is optional.
     * Must be in this format #777777 or #eeeeee for example where these are
     * hexadecimal numbers.
     */
    setColour(colour) {
        this.colour = colour;
    }

    getArea() {
        if(this.coordinates.length === 0) {
            return 0;
        }

        //Have to convert to a set of cartesian coordinates
        var arrCoordinates = new Array(this.coordinates.length);
        var totalArea = 0;
        //Variable to record the start position of the polygon
        var firstVertexIndex = 0;

        for(var i=0;i<this.coordinates.length;i++) {

            //If the draw character is M it means it's the start of the polygon
            if(this.coordinates.get(i).drawChar === 'M') {
                firstVertexIndex = i;
            }

            var x = this.coordinates.get(i).x;
            var y = this.coordinates.get(i).y;
            arrCoordinates[i] = new Coordinate(x,y);

            //If the Z is present means it is the end of the polygon
            if(this.coordinates.get(i).ZPresent || this.coordinates.get(i+1).drawChar === 'M') {
                //Since this is the end you then calculate the area
                var currentArea = 0;

                for(var j=firstVertexIndex;j<=i;j++) {
                    if(j === i) {
                        currentArea += (arrCoordinates[j].x*arrCoordinates[firstVertexIndex].y - arrCoordinates[j].y*arrCoordinates[firstVertexIndex].x);
                    } else {
                        currentArea += (arrCoordinates[j].x*arrCoordinates[(j+1)].y - arrCoordinates[j].y*arrCoordinates[(j+1)].x);
                    }
                }
                currentArea = Math.abs(currentArea);
                currentArea = currentArea/2;
                if(isNaN(currentArea)){
                    continue;
                }
                totalArea += currentArea;
            }
        }
        return totalArea;
    }

    /**
     * Method for getting all the sub regions within a certain region
     * 
     * @returns region[] representing the sub regions.
     */
    getSubRegions() {
        var subRegions = new ArrayList();
        var subRegion = new Region();
        for(var i=0;i<this.coordinates.length;i++) {
            subRegion.addCoordinate(this.coordinates.get(i));
            if(this.coordinates.get(i).ZPresent || this.coordinates.get(i+1).drawChar === 'M') {
                subRegions.add(subRegion);
                subRegion = new Region();
            }
        }
        return subRegions;
    }

    /**
     * Method for getting the amount of area within a grid square.
     * Returns a floating point number corresponding to the area of the region
     * inside the grid square.
     * 
     * @param {GridSquare} g - the grid square
     */
    getAreaInGridSquare(g) {

        var subRegions = this.getSubRegions();
        var totArea = 0;

        for(var i=0;i<subRegions.length;i++) {
            var subRegion = subRegions[i];
            var regionArray = [];
            regionArray[0] = [[]];

            
            //firstly need to convert the region and grid square to an unconventional format
            //that is used by the polygon clipping library.
            for(var j=0;j<subRegion.coordinates.length;j++) {
                regionArray[0][j] = [subRegion.coordinates.get(j).x,subRegion.coordinates.get(j).y];
            }

            //and then the same for the gridSquare
            var gridArray = [];
            gridArray[0] = [4];
            gridArray[0][0] = [g.topLeft.x,g.topLeft.y];
            gridArray[0][1] = [g.topRight.x,g.topRight.y];
            gridArray[0][2] = [g.bottomRight.x,g.bottomRight.y];
            gridArray[0][3] = [g.bottomLeft.x,g.bottomLeft.y];
            
            //Now need to convert this intersection back to a region
            var intersectionFull = null;
            try{
                intersectionFull = polygonClipping.intersection(regionArray, gridArray);
            } catch (err) {
                intersectionFull = [];
            }

            if(intersectionFull.length !== 0) {

                var intersection = intersectionFull[0][0];

                var newRegion = new Region();


                //Only to the penultimate coordinate as it repeats the first coordinate again at the end
                for(var k=0;k<intersection.length-1;k++) {
                    if(k ==0) {
                        var newCoordinate = new SVGCoordinate("M",intersection[k][0],intersection[k][1],false);
                    } else if (k == (intersection.length-2)) {
                        var newCoordinate = new SVGCoordinate("L",intersection[k][0],intersection[k][1],true);
                    } else {
                        var newCoordinate = new SVGCoordinate("L",intersection[k][0],intersection[k][1],false);
                    }
                    newRegion.addCoordinate(newCoordinate);
                }


                totArea += newRegion.getArea();
            } else {
                totArea += 0.0;
            }
        }
        return totArea;
    }
}

/**
 * Class for hadling the map, stores an arraylist of Regions, a and y size as its fields.
 */
class Map {

    /**
     * Constructor that takes in an argument corresponding to the size of the map in pixels.
     */
    constructor(xsize,ysize) {
        this.regions = new ArrayList();
        this.xsize = xsize;
        this.ysize = ysize;
    }

    addRegion(r) {
        this.regions.add(r);
    }
}

/**
 * Class for handling the grid that is projected onto the map before being processed by the algorithm
 */
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

/**
 * Class for handling each individual grid square on the grid
 */
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
     * Get the percentage of the grid square that is taken by the given region.
     * Returned is a floating point number inbetween 0 and 1.
     * @param {Region} region 
     */
    getPercentage(region) {
        var areaRegion = region.getAreaInGridSquare(this);

        var height = this.bottomLeft.y - this.topLeft.y;
        var width = this.bottomRight.x - this.bottomLeft.x;

        var gridSquareArea = height*width;

        return areaRegion/gridSquareArea;
    }

}


//tests
/*
var xsize = 4;
var ysize = 2;
var svgLoader = new SVGLoader();
svgLoader.readSVGFile("/../SVGFiles/DifferentFormats/highchartsUK.svg");
svgLoader.readSVGFile("/../SVGFiles/DifferentFormats/wikiUk.svg");

svgLoader.collectMapData();
svgLoader.drawMapToPNG(xsize,ysize,path.join(__dirname, "/../public/images/map.png"));

//now generate the grid
var grid = new Grid(xsize,ysize,svgLoader.map.xsize,svgLoader.map.ysize);


for(var i=0;i<grid.gridSquares.length;i++) {
    for(var j=0;j<grid.gridSquares[i].length;j++) {

        for(var k=0;k<svgLoader.map.regions.length;k++) {
            
            if(k==1) {
                var curPercentTotal = grid.gridSquares[i][j].getPercentage(svgLoader.map.regions.get(k));
                console.log(curPercentTotal);
            }
        }
    }
}
*/
module.exports = { SVGLoader: SVGLoader,
                   SVGCoordinate: SVGCoordinate,
                   Coordinate: Coordinate,
                   Region: Region,
                   Map: Map,
                   Grid:Grid,
                   GridSquare:GridSquare};