/**
 * This file has classes all to do with handling when the map file is loaded such as the coordinates 
 * and storing the regions and coordinates in appropriate objects.
 */
const ArrayList = require('arraylist');
const path = require('path');
//This module is for converting the svg file to a JSON format.
const xml2js = require('xml2js');
const fs = require('fs');
const {createCanvas, loadImage} = require('canvas');

/**
 * Class for handling the process of loading SVG files. Has a field JSON Data which is the
 * JSON equivalent of the loaded SVG file as well as a field for storing the map data.
 */
class SVGLoader {

    constructor() {
        this.JSONData = null;
        this.map = null;
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
                throw new Error;
            } else {
                //Convert it into a JSON file
                var JSONData = JSON.stringify(result,null,1);
                JSONData = JSON.parse(JSONData);
                json = JSONData;
            }
        });

        this.JSONData = json;
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

        var heightNumber = height.replace(/\D/g, "");
        var widthNumber = width.replace(/\D/g, "");

        this.map = new Map(heightNumber,widthNumber);

        //Collect the coordinates of all the regions in the map file
        var arrayOfRegions = this.JSONData.svg.g[0].path;
        for(var i=0;i<arrayOfRegions.length;i++) {
            //get the element corresonding to the coordinates of the region
            var coordinateString = arrayOfRegions[i]["$"].d;

            //put this into an array
            //stores the Z charater as the last element in the array
            var coordinateArray = coordinateString.split(" ");
            var newRegion = new Region();

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
                var xycoordinate = coordinateArray[j].match(/\d+\.\d/g);
                var drawChar = coordinateArray[j][0];
                var newCoordinate = new SVGCoordinate(drawChar,xycoordinate[0],xycoordinate[1],isEnd);

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
    drawMapToFile(filePath) {

        const canvas = createCanvas(parseInt(this.map.xsize),parseInt(this.map.ysize));
        const context = canvas.getContext('2d');

        //Draw the rectangle with a blue background
        context.beginPath();
        context.lineWidth = 3;
        context.rect(0,0,canvas.width,canvas.height);
        context.strokeStyle = 'rgb(0,0,0)';
        context.fillStyle = 'rgb(35, 106, 169)';
        context.fill();
        context.stroke();

        //Draw the SVG Data into the rectangle
        context.strokeStyle = 'rgb(0,0,0)';
        context.fillStyle = 'green';
        context.lineWidth = 3;

        for(var i=0;i<this.map.regions.length;i++) {
            context.beginPath();
            for(var j=0;j<this.map.regions[i].coordinates.length;j++) {
                var coordinate = this.map.regions[i].coordinates[j];
                if(coordinate.drawChar === 'M') {
                    context.moveTo(coordinate.x,coordinate.y);
                } else {
                    context.lineTo(coordinate.x,coordinate.y);
                }

                if(coordinate.ZPresent) {
                    context.stroke();
                    
                    //Corresponds to the Z character in the path attribute
                    context.fill();
                }
            }
        }
        
        //Save the canvas onto an external png file
        var out = fs.createWriteStream(filePath);
        var stream = canvas.pngStream();

        stream.on('data', function(chunk){out.write(chunk); });

        stream.on('end', function(){console.log('saved png'); });
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
    constructor() {
        this.coordinates = new ArrayList();
    }

    /**
     * Method for adding a Coordinate object to the collection.
     * @param {Coordinate} c 
     */
    addCoordinate(c) {
        this.coordinates.add(c);
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
            if(this.coordinates.get(i).ZPresent) {
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
                totalArea += currentArea;
            }
        }
        return totalArea;
    }
}

/**
 * Class for hadling the map, stores an arraylist of Regions, a and y size as its fields.
 */
class Map {

    /**
     * Constructor that takes in an empty argument.
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


//tests
/*
var svgLoad = new SVGLoader();
svgLoad.readSVGFile("/../SVGFiles/africa.svg");
svgLoad.collectMapData();

console.log(svgLoad.map.regions.get(0).getArea());
//svgLoad.drawMapToFile(path.join(__dirname + "/../public/images/map.png"));
*/
module.exports = { SVGLoader: SVGLoader,
                   SVGCoordinate: SVGCoordinate,
                   Region: Region,
                   Map: Map }