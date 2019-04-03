const path = require('path');
//Classes for handling map files
const {SVGLoader,SVGCoordinate,Coordinate,Region,Map,Grid,GridSquare} = require('./mapLoad/loadSVGFile.js');
//fs is for handling accesses to the local file system
const fs = require('fs');
const HashMap = require('hashmap');
//Classes for handling the gastner-newmann algorithm.
const DCT2 = require('./Algorithm/GastnerNewmann/DCT2.js');
const gastnerNewmann = require('./Algorithm/GastnerNewmann/main.js');
const Interpreter = require('./Algorithm/GastnerNewmann/interp.js');
var util = require('util');

//variable for handling the SVG and storing all the map data
var svgLoader = new SVGLoader();

var commandLineArgs = process.argv;
//Values for the matrix of densities.
//corresponds to the number of density values NOT the grid size.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var xsize = commandLineArgs[2];
var ysize = commandLineArgs[3];
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

buildCartogram();


//Function that handles the cartogram generation
function buildCartogram() {
    //gather the data from the SVG file and store it into the SVG Loader
    //gatherData();
    //calculate the densities of the map using the map and data file
    //var densityHashMap = calculateDensities();
    //calculate the density grid with these values
    //var densityGrid = createDensityGrid(densityHashMap);
    var densityGrid = DCT2.initialize2DArray(xsize,ysize);

    var fileName = "Grid_"+xsize+"_"+ysize+".txt";
    fs.writeFileSync(__dirname+"/Algorithm/Real-World-Data-Test/"+fileName, util.inspect(densityGrid) , 'utf-8');
}


/********************************************************************************************************************/

//All the cartogram methods.

/********************************************************************************************************************/

//function for handling the data gathering from the SVG file
function gatherData() {
    svgLoader.readSVGFile("/../Algorithm/Real-World-Data-Test/map.svg");
    svgLoader.collectMapData();
}

//function to calculate the densities for all regions
//returns the density array for every region with the last element
//equalling the mean density of the entire map.
function calculateDensities() {
    //An array for storing the areas of every region in the map
    var areas = new Array(svgLoader.map.regions.length);


    for(var i=0;i<areas.length;i++) {
        areas[i] = svgLoader.map.regions.get(i).getArea();
    }

    //gather the data from the data file for each region
    var dataBuffer = fs.readFileSync(path.join(__dirname + "/Algorithm/Real-World-Data-Test/EU-referendum-LEAVE.csv"));
    var data = dataBuffer.toString();

    //to remove all newline characters in a string
    var dataArray = data.split("\r\n");

    //need to put all the data into a hashmap with key the Region name and population the value.
    var dataInfo = new HashMap();

    for(var i=0;i<dataArray.length;i++) {
        var line = dataArray[i].split(",");
        dataInfo.set(line[0],parseFloat(line[1]));
    }

    //cycle through to check if all the info is okay
    var values = dataInfo.values();
    for(var i=0;i<values.length;i++) {
        if(isNaN(values[i])){
            throw new Error("Data File corrupted. Index: " + i);
        }
    }


    //Now need to change the value stored in the hashmap to be the density for that region.

    //Density is defined as the data value for a certain region divided by it's original area.
    var densityInfo = new HashMap();
    var totalDensityValue = 0;
    for(var i=0;i<svgLoader.map.regions.length;i++) {
        var region = svgLoader.map.regions.get(i);
        var popValue = dataInfo.get(region.name);

        var area = region.getArea();
        if(area === 0) {
            area = 1;
        }

        var densityValue = popValue/area;

        if(isNaN(densityValue)){
            console.log("WARNING: DATA VALUE MISSING FOR MAP REGION NAME: " + region.name);
            densityValue = area;
        }
        densityInfo.set(region.name,densityValue);

        totalDensityValue += densityValue;
    }

    var meanDensityValue = totalDensityValue/svgLoader.map.regions.length;

    densityInfo.set("Sea",meanDensityValue);

    return densityInfo;
}

/*
 * Method for calculating the density grid given the density array.
 * This is what is needed by the algorithm to generate the cartogram.
*/
function createDensityGrid(densityHashMap) {
    //now generate the grid
    var grid = new Grid(xsize,ysize,svgLoader.map.xsize,svgLoader.map.ysize);

    //This is the density grid to be passed into the algorithm
    var densityGrid = DCT2.initialize2DArray(xsize,ysize);
    

    for(var i=0;i<grid.gridSquares.length;i++) {
        for(var j=0;j<grid.gridSquares[i].length;j++) {
            //now for each grid square calculate a certain density
            //Firstly calculate what regions are in the grid square, calculate their density in that grid square and store it here
            var densityTotal = 0;

            //Need to record the percentage of a grid square that is covered by land
            var percentTotal = 0;

            for(var k=0;k<svgLoader.map.regions.length;k++) {
                
                var curPercentTotal = grid.gridSquares[i][j].getPercentage(svgLoader.map.regions.get(k));
                percentTotal += curPercentTotal;
                densityTotal += curPercentTotal*densityHashMap.get(svgLoader.map.regions.get(k).name);

                console.log(k,svgLoader.map.regions.length);
            }

            //to add in the sea part of a grid square
            
            if(percentTotal ===0) {
                densityGrid[i][j] = densityHashMap.get("Sea");
            } else {
                densityGrid[i][j] = densityTotal;
            }

            console.log(j,grid.gridSquares[i].length);

            //densityGrid [i][j] += (1-percentTotal)*densityHashMap.get("Sea");
        }
    }

    return densityGrid;
}
