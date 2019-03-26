//express is for handling requests
const express = require('express');
const app = express();
//this is how to use express in conjunction with socket.io
const server = app.listen("3000");
//the library to send events onto client side javascript
const io = require('socket.io').listen(server);
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
var xsize = 20;
var ysize = 20;
//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//homepage
app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/index.html'));
    //event sent to client side javascript
    //io.emit('Catrina','Chicken');
});

//first build Cartogram page
app.get('/buildCart',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/buildCart.html'));
})

//the cartogram uses page
app.get('/cartUse',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/index.html'));
})

//the resources page
app.get('/resources',(req,res) => {
    res.sendFile(path.join(__dirname+'/views/index.html'));
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
                mapFileName = file.path;
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
            
            svgLoader.readSVGFile("/../uploads/mapFile.svg");
            svgLoader.collectMapData();
            
            //xsize and ysize passed for drawing the grid just tp get a visualization
            svgLoader.drawMapToPNG(xsize,ysize,path.join(__dirname + '/public/images/map.png'));
            
            res.render(__dirname + '/views/buildCart2.html');
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
console.log("Running at Port 3000");

io.on('connection', function(socket){
    console.log('User Connected');

    //list of events to listen to:

    //For when the client side javascipt needs the data from the CSV file on buildCart2.html
    socket.on('requestData',() => {
        //gather the data from the data file for each region
        var dataBuffer = fs.readFileSync(path.join(__dirname + "/uploads/dataFile.csv"));
        var data = dataBuffer.toString();

        //to remove all newline characters in a string
        var dataArray = data.split("\r\n");

        socket.emit('dataRecieved',dataArray);
    })
});



