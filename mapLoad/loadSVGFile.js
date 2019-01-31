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
const canvas = createCanvas(1000,500);
const context = canvas.getContext('2d');

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

            for(var j=0;j<coordinateArray.length-1;j++) {

                var xycoordinate = coordinateArray[j].match(/\d+\.\d/g);
                var drawChar = coordinateArray[j][0];

                //At this point you've got the final coordinate of the region 
                //not coordinateArray.length-1 as the Z charater is stored herew
                if(j === coordinateArray.length-2) {
                    //set to true because this is the last coordinate
                    var newCoordinate = new SVGCoordinate(drawChar,xycoordinate[0],xycoordinate[1],true);
                } else {
                    var newCoordinate = new SVGCoordinate(drawChar,xycoordinate[0],xycoordinate[1],false);
                }
                newRegion.addCoordinate(newCoordinate);
            }
            this.map.addRegion(newRegion);
        }
    }

    drawMapToFile(fileName) {
        var color  = "rgb("+63+","+0+","+0+")";

        
    }
}

class SVGCoordinate {

    /**
     * Constructor for this class that takes two ints as an argument
     * corresponding to the x,y of the coordinate, the drawType character which is a 
     * SVG letter corresponding to M or L meaning move to and draw line to respectively
     * and a boolean to mark if the coordinate is the last one in the region.
     */
    constructor(drawChar,x,y,ZPresent) {
        this.drawChar = drawChar;
        this.x = x;
        this.y = y;
        this.ZPresent = ZPresent;
    }

    /**
     * Method for printing out the coordinates to the console.
     */
    printCoordinate() {
        console.log("(" + this.x + ","+ this.y + ")");
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

    addCoordinate(c) {
        this.coordinates.add(c);
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
var svgLoad = new SVGLoader();
svgLoad.readSVGFile("/../uploads/mapFile.svg");
svgLoad.collectMapData();
svgLoad.drawMap();

module.exports = { SVGLoader: SVGLoader,
                   SVGCoordinate: SVGCoordinate,
                   Region: Region,
                   Map: Map }