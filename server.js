//express is for handling requests
const express = require('express');
//passing template variables into html
const nunjucks = require('nunjucks');
//formidable is for handling file uploads
const formidable = require('formidable');
const app = express();
const path = require('path');
//and this is set to public
nunjucks.configure('views', { autoescape: true, express: app });
//nunjucks works when this is set to views
app.use(express.static(__dirname + 'public'));


//homepage
app.get('/',(req,res) => {
    var a = "cheese";
    res.render(path.join(__dirname+'/public/index.html'),{foo : a});
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
                file.path = __dirname + '/uploads/' + file.name;
                success = true;
            }
        }
        
        if(name == "datafiletoupload") {
            if (file.name === "" || fileExt !== ".csv") {
                success = false;
            } else if((success === false)) {
                //do nothing as it had failed elsewhere
            } else {
                file.path = __dirname + '/uploads/' + file.name;
                success = true;
            }
        }
    });

    //The event that is run when the file upload has been completed
    form.on('end', () => {
        if(success) {
            res.sendFile(__dirname + '/public/displayMapFile.html');
            //launch file handle class
        } else {
            res.sendFile(__dirname + '/public/index.html');
        }
    });
});

app.listen(3000);

console.log("Running at Port 3000");