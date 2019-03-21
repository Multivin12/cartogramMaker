//express is for handling requests
const express = require('express');
//passing template variables into html
const nunjucks = require('nunjucks');
//formidable is for handling file uploads
const formidable = require('formidable');
const app = express();
const path = require('path');
//set the directory to look for templates
nunjucks.configure('views', { autoescape: true, express: app });
//set the directory to look for static files
app.use(express.static(path.join(__dirname , '/public')));
//Classes for handling map files
const {SVGLoader,SVGCoordinate,Coordinate,Region,Map,Grid,GridSquare} = require('./mapLoad/loadSVGFile.js');
//fs is for handling accesses to the local file system
const fs = require('fs');
const HashMap = require('hashmap');

//Classes for handling the gastner-newmann algorithm.
const DCT2 = require('./Algorithm/GastnerNewmann/DCT2.js');
const gastnerNewmann = require('./Algorithm/GastnerNewmann/main.js');
const Interpreter = require('./Algorithm/GastnerNewmann/interp.js');
//variable for handling the SVG and storing all the map data
var svgLoader = new SVGLoader();

//Values for the matrix of densities.
//corresponds to the number of density values NOT the grid size.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var xsize = 20;
var ysize = 20;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//homepage
app.get('/',(req,res) => {
    res.render(path.join(__dirname+'/views/index.html'));
});

//method for uploading a file
app.post('/fileUpload',(req,res) =>{

    var form = new formidable.IncomingForm();
    var success = null;
    
    form.parse(req);

    //The event that is run when a new file has been detected
    form.on('fileBegin', (name, file) => {
        var fileExt = path.extname(file.name);

        if(name == "mapfiletoupload") {
            if (file.name === "" || fileExt !== ".svg") {
                success = false;
            } else if((success === false)) {
                //do nothing as it had failed elsewhere
            } else {
                file.path = __dirname + '/uploads/' + "mapFile.svg";
                mapFileName = file.path;
                success = true;
            }
        }
        
        if(name == "datafiletoupload") {
            if (file.name === "" || fileExt !== ".csv") {
                success = false;
            } else if((success === false)) {
                //do nothing as it had failed elsewhere
            } else {
                file.path = __dirname + '/uploads/' + "dataFile.csv";
                success = true;
            }
        }
    });

    //The event that is run when the file upload has been completed
    form.on('end', () => {

        if(success) {
            
            svgLoader.readSVGFile("/../uploads/mapFile.svg");
            svgLoader.collectMapData();
            //xsize and ysize passed for drawing the grid just tp get a visualization
            svgLoader.drawMapToPNG(xsize,ysize,path.join(__dirname + '/public/images/map.png'));
            
            res.render(__dirname + '/views/displayMapFile.html');
        } else {
            if(success == null) {
                res.render(__dirname + '/views/index.html');
            } else {
                var statusError = "Sorry something went wrong please try again.";
                res.render(__dirname + '/views/index.html',{ status : statusError});
            }
        }
    });
});

//Method for handling the file download
app.get("/downloadFile",(req,res) => {
    var file = path.join(__dirname + '/cartogram.svg');
    res.download(file,'cartogram.svg');
});

//Method that is called for generating the cartogram
app.get("/makeCartogram",(req,res) => {
    buildCartogram();
    res.render(__dirname + '/views/displayCartogram.html'); 
});

//Function that handles the cartogram generation
function buildCartogram() {
    //gather the data from the SVG file and store it into the SVG Loader
    gatherData();
    //calculate the densities of the map using the map and data file
    var densityHashMap = calculateDensities();
    //calculate the density grid with these values
    var densityGrid = createDensityGrid(densityHashMap);
    //get the new set of grid points from the Gastner-Newman algorithm
    var newGridPoints = gastnerNewmann(densityGrid);
    //use bilinear interpolation to update the map
    //generate the png as a result.
    updateCoordinates(newGridPoints);
    //Method for building the SVG File of the cartogram
    createSVGFile();
}

function createSVGFile() {
    svgLoader.drawMapToSVG(path.join(__dirname + "/cartogramFile.svg"));
}





/********************************************************************************************************************/

//All the cartogram methods.

/********************************************************************************************************************/





//function for handling the data gathering from the SVG file
function gatherData() {
    svgLoader.readSVGFile("/../uploads/mapFile.svg");
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
    var dataBuffer = fs.readFileSync(path.join(__dirname + "/uploads/dataFile.csv"));
    var data = dataBuffer.toString();

    //to remove all newline characters in a string
    var dataArray = data.split("\r\n");

    //need to put all the data into a hashmap with key the Region name and population the value.
    var dataInfo = new HashMap();

    for(var i=0;i<dataArray.length;i++) {
        var line = dataArray[i].split(",");
        dataInfo.set(line[0],parseFloat(line[1]));
    }

    //Now need to change the value stored in the hashmap to be the density for that region.

    //Density is defined as the data value for a certain region divided by it's original area.
    var totalDensityValue = 0;
    for(var i=0;i<svgLoader.map.regions.length;i++) {
        var region = svgLoader.map.regions.get(i);
        var popValue = dataInfo.get(region.name);

        var densityValue = popValue/region.getArea();

        dataInfo.set(region.name,densityValue);

        totalDensityValue += densityValue;
    }

    var meanDensityValue = totalDensityValue/svgLoader.map.regions.length;

    dataInfo.set("Sea",meanDensityValue);

    return dataInfo;
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
            }

            //to add in the sea part of a grid square
            
            if(percentTotal ===0) {
                densityGrid[i][j] = densityHashMap.get("Sea");
            } else {
                densityGrid[i][j] = densityTotal;
            }

            //densityGrid [i][j] += (1-percentTotal)*densityHashMap.get("Sea");
        }
    }
    console.log(densityGrid);
    return densityGrid;
}

// Method to update the region coordinates with the newly generated grid points
function updateCoordinates(newGridPoints) {
    //use an interpreter to convert the region grid points onto the new grid
    var interp = new Interpreter(newGridPoints,xsize,ysize);

    //go through the entire map and change the grid points
    var regions = svgLoader.map.regions;

    for(var i=0;i<regions.length;i++) {

        var region = regions.get(i);

        for(var j=0;j<region.coordinates.length;j++) {
            var oldCoordinate = region.coordinates.get(j);

            //have to convert it from an SVG Coordinate to a grid point coordinate
            //i.e if grid is 10x10 with 700 pixel size, if SVG Coordinate = (350,350),
            //then grid coordinate = (5,5);
            var x = (oldCoordinate.x/svgLoader.map.xsize) * xsize;
            var y = (oldCoordinate.y/svgLoader.map.ysize) * ysize;

            var tup = interp.interpData(x,y);

            //Now convert these back to SVG Coordinates in terms of pixels
            x = (tup[0]*svgLoader.map.xsize)/xsize;
            y = (tup[1]*svgLoader.map.ysize)/ysize;


            var newCoordinate = new SVGCoordinate(oldCoordinate.drawChar,x,y,oldCoordinate.ZPresent);

            region.coordinates[j] = newCoordinate;
        }
        //console.log(region.getArea());
    }
    svgLoader.drawMapToPNG(xsize,ysize,path.join(__dirname + '/public/images/cartogram.png'));
}

app.listen(3000);

console.log("Running at Port 3000");