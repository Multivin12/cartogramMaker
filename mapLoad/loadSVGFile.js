/**
 * This file has classes all to do with handling when the map file is loaded such as the coordinates 
 * and storing the regions and coordinates in appropriate objects.
 */
const ArrayList = require('arraylist');
const path = require('path');
//This module is for converting the svg file to a JSON format.
const xml2js = require('xml2js');
const fs = require('fs');

class SVGLoad {

    /** 
    * This method is for reading in the coordinates for all the regions and putting them 
    * into the appropriate objects.
    */
    static readSVGFile(filePath) {
        //Read in the SVG file
        var parser = new xml2js.Parser();
        fs.readFile(path.join(__dirname + filePath), function(err, data) {
            parser.parseString(data, function (err, result) {
                //Convert it into a JSON file
                var result = JSON.stringify(result,null,1);
                SVGLoad.readJSON(result);
            });
        });
    }

    static readJSON(JSONData) {
        console.log(JSONData);
    }

    static drawMap() {

    }
}

class Coordinate {

    /**
     * Constructor for this class that takes two ints as an argument
     * corresponding to the x,y of the coordinate.
     */
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

var x1 = new Coordinate(2,3);
var r1 = new Region();
r1.addCoordinate(x1);
r1.addCoordinate(x1);
//console.log(r1);

SVGLoad.readSVGFile("/../uploads/mapFile.svg")

module.exports = { SVGLoad: SVGLoad,
                   Coordinate: Coordinate,
                   Region: Region,
                   Map: Map }