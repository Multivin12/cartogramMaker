//express is for handling requests
const express = require('express');

//formidable is for handling file uploads
const formidable = require('formidable');

const app = express();
const path = require('path');

app.use(express.static(__dirname + '/public'));

//homepage
app.get('/',(req,res) => {
    res.sendFile(path.join(__dirname+'/public/index.html'));
});

//method for uploading a file
app.post('/fileupload',(req,res) =>{

    var form = new formidable.IncomingForm();
    var success = null;

    
    form.parse(req);

    //The event that is run when a new file has been detected
    form.on('fileBegin', (name, file) => {
        if (file.name === "") {
            success = false;
        } else {
            file.path = __dirname + '/uploads/' + file.name;
            success = true;
        }
    });

    //The event that is run when the file upload has been completed
    form.on('end', () => {
        if(success) {
            res.sendFile(__dirname + '/public/uploadSuc.html');
        } else {
            res.sendFile(__dirname + '/public/index.html')
        }
    })
});

app.listen(3000);

console.log("Running at Port 3000");