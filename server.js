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
        var value = [1,2,3,4,5];
        if(success) {
            res.render(__dirname + '/views/displayMapFile.html',{data :{array:value}});
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