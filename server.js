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
const {SVGLoad, Coordinate,Region,Map} = require('./mapLoad/loadSVGFile.js');
//Modules required for drawing maps onto the canvas
const {createCanvas, loadImage} = require('canvas');
const canvas = createCanvas(1000,500);
const context = canvas.getContext('2d');

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

            //Draw a blackbox into a png file
            var color = "rgb("+63+","+0+","+0+")";

            var width = canvas.width / 2;
            var height = canvas.height / 2;

            // draw a red circle
            var radius = 100;
            context.fillStyle = 'red';
            context.beginPath();
            //Corresponds to the M character in the path attribute
            context.moveTo(156.8,344.0);
            //Corresponds to the L character
            context.lineTo(187.5,326.9);
            context.lineTo(216.8,307.8);
            context.lineTo(244.5,302.4);
            context.lineTo(267.8,293.1);
            context.lineTo(292.4,293,5);
            context.lineTo(279.0,314.8);
            context.lineTo(256.9,336.0);
            context.lineTo(246.5,349.5);
            context.lineTo(234.6,370.9);
            context.lineTo(218.1,398.0);
            context.lineTo(194.7,411.3);
            context.lineTo(178.6,420.8);
            context.lineTo(167.2,408.9);
            context.lineTo(160.4,383.3);
            context.lineTo(159.2,367.6);
            //Corresponds to the Z character in the path attribute
            context.fill();

            //Save the canvas onto an external png file

            var out = fs.createWriteStream(__dirname + '/public/images/text.png');
            var stream = canvas.pngStream();

            stream.on('data', function(chunk){out.write(chunk); });

            stream.on('end', function(){console.log('saved png'); });

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