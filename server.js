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
const SVGFileHandle = require('./mapLoad/loadSVGFile.js');
const SVGLoader = SVGFileHandle.SVGLoader;
const fs = require('fs');

//Values for the matrix of densities.
//corresponds to the number of density values NOT the grid size.
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
var xsize = 2;
var ysize = 2;
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
            
            var svgLoader = new SVGLoader();
            svgLoader.readSVGFile("/../uploads/mapFile.svg");
            svgLoader.collectMapData();
            //xsize and ysize passed for drawing the grid just tp get a visualization
            svgLoader.drawMapToFile(xsize,ysize,path.join(__dirname + '/public/images/map.png'));
            
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

//Method for generating the cartogram
app.get("/makeCartogram",(req,res) => {

    //Collect the map data again from the map file
    var svgLoader = new SVGLoader();
    svgLoader.readSVGFile("/../uploads/mapFile.svg");
    svgLoader.collectMapData();

    //An array for storing the areas of every region in the map
    var areas = new Array(svgLoader.map.regions.length);

    for(var i=0;i<areas.length;i++) {
        areas[i] = svgLoader.map.regions.get(i).getArea();
    }

    //gather the data from the data file for each region
    var dataBuffer = fs.readFileSync(path.join(__dirname + "/uploads/dataFile.csv"));
    var data = dataBuffer.toString();

    var dataArray = data.split(",");

    //density array with the final element being the average density of the map
    //as the sea is required to be the average density
    var densityArray = new Array(areas.length+1);

    //Create a density array: Density is defined as the data value for a certain region / area of the region.
    var total = 0;
    for(var i=0;i<areas.length;i++) {
        densityArray[i] = parseInt(areas[i]/parseInt(dataArray[i]));
        total += densityArray[i];
    }
    var averageDensity = total / areas.length;
    densityArray[areas.length] = averageDensity;



    



    res.render(__dirname + "/views/displayCartogramWait.html");
});

app.listen(3000);

console.log("Running at Port 3000");