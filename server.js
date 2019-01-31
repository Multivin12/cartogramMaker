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
const fs = require('fs');

//Classes for handling map files
const SVGFileHandle = require('./mapLoad/loadSVGFile.js');
const SVGLoader = SVGFileHandle.SVGLoader;
//Modules required for drawing maps onto the canvas

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
            svgLoader.drawMapToFile(path.join(__dirname + '/public/images/map.png'));
            
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

app.listen(3000);

console.log("Running at Port 3000");