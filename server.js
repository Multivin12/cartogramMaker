//express is for handling requests
const express = require('express');
const ArrayList = require('arraylist');
const app = express();
//this is how to use express in conjunction with socket.io
const server = app.listen("3000");
//the library to send events onto client side javascript
const io = require('socket.io')(server,{'pingInterval': 20000000, 'pingTimeout': 500000000});
//passing template variables into html
const nunjucks = require('nunjucks');
//formidable is for handling file uploads
const formidable = require('formidable');
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
var xsize = 64;
var ysize = 64;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//homepage
app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/index.html'));
});

//first build Cartogram page
app.get('/buildCart',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/buildCart.html'));
})

//the cartogram uses page
app.get('/cartUse',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/uses.html'));
})

//the resources page
app.get('/resources',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/resources.html'));
})

app.get('/buildCart2',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/buildCart2.html'));
})

//method for handling the file uploads
app.post('/fileUpload',(req,res) =>{

    var form = new formidable.IncomingForm();
    var success = null;
    var errorMessage = "";
    
    form.parse(req);

    //The event that is run when a new file has been detected
    form.on('fileBegin', (name, file) => {
        var fileExt = path.extname(file.name);

        if(name == "mapfiletoupload") {
            if (file.name === "" || fileExt !== ".svg") {
                success = false;
                errorMessage += "Map file not present or file type not supported.";
            } else {
                file.path = __dirname + '/uploads/' + "mapFile.svg";
                success = true;
            }
        }
        
        if(name == "datafiletoupload") {
            if (file.name === "" || fileExt !== ".csv") {
                success = false;
                errorMessage += "Data file not present or file type not supported.\n";
            } else {
                file.path = __dirname + '/uploads/' + "dataFile.csv";
                success = true;
            }
        }
    });

    //The event that is run when the file upload has been completed
    form.on('end', () => {

        if(success) {
            try{
                svgLoader.readSVGFile("/../uploads/mapFile.svg");
                svgLoader.collectMapData();
                //check CSV file
                var dataBuffer = fs.readFileSync(path.join(__dirname + "/uploads/dataFile.csv"));
                var data = dataBuffer.toString();

                if(checkCSVFile(data)) {
                    if( checkSVGFile(svgLoader.JSONData)) {
                        //means the CSV file is okay
                        //xsize and ysize passed for drawing the grid just tp get a visualization
                        svgLoader.drawMapToPNG(xsize,ysize,path.join(__dirname + '/public/images/map.png'));
                        res.render(__dirname + '/views/buildCart2.html');
                    } else {
                        io.emit('Error',err.message);
                        res.render(__dirname + '/views/buildCart.html');
                    }
                } else {
                    io.emit('Error',err.message);
                    res.render(__dirname + '/views/buildCart.html');
                }
                
            }catch(err) {
                io.emit('Error',err.message);
                res.render(__dirname + '/views/buildCart.html');
            }
        } else {
            if(success == null) {
                res.render(__dirname + '/views/buildCart.html');
            } else {
                res.render(__dirname + '/views/buildCart.html');
                io.emit('Error',errorMessage);
            }
        }
    });
})

app.get("/buildCart3",(req,res) => {
    res.render(__dirname + "/views/buildCart3.html");
})

app.get("/buildCart4",(req,res) => {
    res.render(__dirname+"/views/buildCart4.html");
})

app.get("/downloadMap",(req,res) => {
    var file = path.join(__dirname + '/uploads/mapFile.svg');
    res.download(file,'mapFile.svg');
})

app.get("/downloadCart",(req,res) => {
    var file = path.join(__dirname + '/cartogramFile.svg');
    res.download(file,'cartogram.svg');
})

app.get("/downloadMapTemp",(req,res) => {
    var file = path.join(__dirname + '/examples/mapFileExample.svg');
    res.download(file,'mapTemplate.svg');
})

app.get("/downloadDataTemp",(req,res) => {
    var file = path.join(__dirname + '/examples/dataFileExample.csv');
    res.download(file,'dataTemplate.csv');
})

/**
 * Function for checking that the CSV file uploaded is in the correct format.
 * 
 * @param {String} data 
 */
function checkCSVFile(data) {

    var lines = data.split("\r\n");

    for(var i=0;i<lines.length;i++) {

        if(!lines[i].includes(",")) {
            throw new Error("Error in datafile");
        }
        var elements = lines[i].split(",");

        if (elements.length != 2) {
            throw new Error("Must only have one comma for each line in datafile");
        }

        var number = +elements[1];

        if(isNaN(number)) {
            throw new Error("Statistical value can only contain numbers.")
        }
    }
    
    return true;
}

/**
 * Method for checking whether the SVG file is valid.
 * @param {String} SVGData 
 */
function checkSVGFile(SVGData) {

    var regions = SVGData.svg.path;

    var listOfNames = new ArrayList();

    //Gather the names of all regions in the SVG file
    for(var i=0;i<regions.length;i++) {
        listOfNames.push(regions[i].name);
    }

    var indexOfMissingNames = new ArrayList();
    for(var i=0;i<regions.length;i++) {
        if(typeof(listOfNames[i]) === "undefined") {
            indexOfMissingNames.push((i+1));
        }
    }

    if(indexOfMissingNames.length !== 0) {

        var errorString = "";

        for(var i=0;i<indexOfMissingNames.length;i++) {

            if(i === (indexOfMissingNames.length-1)) {
                errorString += indexOfMissingNames[i] + ".";
            } else {
                errorString += indexOfMissingNames[i] + ",";
            }
        }

        throw new Error("Regions with missing names present. Region Location: " + errorString);
    }

    //Need to check whether there is a statistic for every region in the SVG file.
    //gather CSV file data.
    var dataBuffer = fs.readFileSync(path.join(__dirname + "/uploads/dataFile.csv"));
    var data = dataBuffer.toString();

    var lines = data.split("\r\n");

    var CSVNames = new Set();

    //put the list of names from the CSV file
    for(var i=0;i<lines.length;i++) {
        var line = lines[i].split(",");

        CSVNames.add(line[0]);
    }

    //then gather the list of SVG names and check if any of them don't have a data value.
    var regions = svgLoader.JSONData.svg.path;
    var missingNames = new Set();

    for(var i=0;i<regions.length;i++) {
        var regionName = regions[i].name[0];

        if(!(CSVNames.has(regionName))) {
            missingNames.add(regionName);
        }
    }

    var setArray = Array.from(missingNames);

    if(setArray.length !== 0) {
        var errorString = "";
        for(var i=0;i<setArray.length;i++) {
            
            if(i === (setArray.length-1)) {
                errorString += setArray[i];
            } else {
                errorString += setArray[i] + ",";
            }
        }
        throw new Error("Regions " + errorString + " have no data present.")
    }
    return true;
}

function createSVGFile(svgLoad) {

    //assign everything to its correct object as javascript just converts it
    //to an ordinary object
    svgLoad = Object.assign(new SVGLoader,svgLoad);
    svgLoad.map = Object.assign(new Map, svgLoad.map);
    svgLoad.map.regions = Object.assign(new ArrayList, svgLoad.map.regions);
    
    for(var i=0;i<svgLoad.map.regions.length;i++) {
        var region = svgLoad.map.regions.get(i);
        region = Object.assign(new Region,svgLoad.map.regions.get(i));
        svgLoad.map.regions.set(i,region);

        svgLoad.map.regions.get(i).coordinates = Object.assign(new ArrayList,svgLoad.map.regions.get(i).coordinates);
    }

    svgLoad.drawMapToSVG(path.join(__dirname + "/cartogramFile.svg"));
}


/********************************************************************************************************************/

//All the cartogram methods.

/********************************************************************************************************************/

//function for handling the data gathering from the SVG file
function gatherData() {
    svgLoader.readSVGFile("/../uploads/mapFile.svg");
    svgLoader.collectMapData();  
    return svgLoader;
}

//function to calculate the densities for all regions
//returns the density array for every region with the last element
//equalling the mean density of the entire map.
function calculateDensities(svgLoad) {

    //assign everything to its correct object as javascript just converts it
    //to an ordinary object
    svgLoad = Object.assign(new SVGLoader,svgLoad);
    svgLoad.map = Object.assign(new Map, svgLoad.map);
    svgLoad.map.regions = Object.assign(new ArrayList, svgLoad.map.regions);
    
    for(var i=0;i<svgLoad.map.regions.length;i++) {
        var region = svgLoad.map.regions.get(i);
        region = Object.assign(new Region,svgLoad.map.regions.get(i));
        svgLoad.map.regions.set(i,region);

        svgLoad.map.regions.get(i).coordinates = Object.assign(new ArrayList,svgLoad.map.regions.get(i).coordinates);
    }

    

    //An array for storing the areas of every region in the map
    var areas = new Array(svgLoad.map.regions.length);


    for(var i=0;i<areas.length;i++) {
        areas[i] = svgLoad.map.regions.get(i).getArea();
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

    //cycle through to check if all the info is okay
    //find the minimum data and check if it is negative
    var values = dataInfo.values();
    var min = Number.MAX_VALUE;
    for(var i=0;i<values.length;i++) {
        if(isNaN(values[i])){
            throw new Error("Data File corrupted. Index: " + i);
        }
        if(values[i] < min) {
            min = values[i];
        }
    }

    if(min < 0) {
        //if there is any negative values present then make everything positive
        for(var i=0;i<values.length;i++) {
            values[i] += (-min + 1);
        }
        var keys = Object.keys(dataInfo._data);
        dataInfo.clear();
        for(var i=0;i<keys.length;i++) {
            var tempKey = keys[i].replace(/[^a-zA-Z0-9\s]/g,'');
            dataInfo.set(tempKey,values[i]);
        }
    }
    //Now need to change the value stored in the hashmap to be the density for that region.

    //Density is defined as the data value for a certain region divided by it's original area.
    var densityInfo = new HashMap();
    var totalDensityValue = 0;
    for(var i=0;i<svgLoad.map.regions.length;i++) {
        var region = svgLoad.map.regions.get(i);
        var popValue = dataInfo.get(region.name);
        var densityValue = popValue;

        //if a region has no statistic referenced to it
        if(typeof(densityValue) == "undefined"){
            densityValue = 0.0;
        }
        totalDensityValue += densityValue;
    }

    var meanDensityValue = totalDensityValue/svgLoad.map.regions.length;

    densityInfo.set("Sea",1.0);

    for(var i=0;i<svgLoad.map.regions.length;i++) {
        var region = svgLoad.map.regions.get(i);
        var popValue = dataInfo.get(region.name);

        //to keep a region the same size if the data file does not have
        //a statistic for it.
        if(popValue === 0 || typeof(popValue) === "undefined") {
            popValue = meanDensityValue;
        }

        densityInfo.set(region.name,popValue/meanDensityValue);
    }

    console.log(densityInfo);
    return densityInfo;
}

/*
 * Method for calculating the density grid given the density array.
 * This is what is needed by the algorithm to generate the cartogram.
*/
function createDensityGrid(densityHashMap) {

    densityHashMap = Object.assign(new HashMap,densityHashMap);
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
                if(percentTotal >= 1) {
                    break;
                }
            }

            //to add in the sea part of a grid square
            
            if(percentTotal ===0) {
                densityGrid[i][j] = densityHashMap.get("Sea");
            } else {
                densityGrid[i][j] = densityTotal;
            }

            if((j+i*grid.gridSquares[i].length) % 100 == 0) {
                console.log(j+i*grid.gridSquares[i].length);
            }
            
            //densityGrid [i][j] += (1-percentTotal)*densityHashMap.get("Sea");
        }
    }

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
    }
    svgLoader.drawMapToPNG(xsize,ysize,path.join(__dirname + '/public/images/cartogram.png'),newGridPoints);
    return svgLoader;
}

console.log("Running at Port 3000");

//Event listeners from the client side javascript
io.on('connection', function(socket){
    console.log('User Connected');
    //list of events to listen to from the client:

    //For when the client side javascipt needs the data from the CSV file on buildCart2.html
    socket.on('requestData',() => {
        //gather the data from the data file for each region
        var dataBuffer = fs.readFileSync(path.join(__dirname + "/uploads/dataFile.csv"));
        var data = dataBuffer.toString();

        //to remove all newline characters in a string
        var dataArray = data.split("\r\n");

        socket.emit('dataRecieved',dataArray);
    })

    //For handling each stage of the cartogram build process
    socket.on('Build', () => {
        var svg = gatherData();
        io.emit("gatheredData",(svg));
    })

    socket.on('buildDensityArray',(data) => {
        var svgLoad = data;
        var densityHashMap = calculateDensities(svgLoad);
        io.emit("builtDensityArray",(densityHashMap));
    })

    socket.on("buildDensityGrid",(data) => {
        var densityHashMap = data;
        var densityGrid = createDensityGrid(densityHashMap);
        io.emit("builtDensityGrid",(densityGrid));
    })

    socket.on("Run algorithm",(data) => {
        var densityGrid = data;
        var newGridPoints = gastnerNewmann(densityGrid);
        io.emit("Ran algorithm",(newGridPoints));
    })

    socket.on("Update Grid Points",(data) => {
        var newGridPoints = data;
        var svgLoader = updateCoordinates(newGridPoints);
        io.emit("Updated points",(svgLoader));
    })

    socket.on("Draw to SVG",(data) =>{
        var svgLoad = data;
        createSVGFile(svgLoad);
        io.emit("Finished!");
    })

});

/*
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
*/
