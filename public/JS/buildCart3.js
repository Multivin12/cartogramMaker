
var socket = io();

function startBuild(){

    //set up everything
    var progressBar = $(".progress-bar");
    var label = $("#Info");
    var labelError = $("#Error");

    var i=5;
    progressBar.empty();
    progressBar.attr("style","width:" + i +"%");
    progressBar.append(i + "%");
    progressBar.removeClass("bg-danger");
    label.empty();
    label.append("Status: Gathering Data");
    labelError.empty();

    $("#next").removeAttr("href");
    socket.emit("Build");
}

socket.on("gatheredData", (data) => {
    var progressBar = $(".progress-bar");
    var label = $("#Info");

    label.empty();
    label.append("Status: Calculating area of each Region.")

    var i = 10;

    progressBar.empty();
    progressBar.attr("style","width:" + i +"%")
    progressBar.append(i + "%");

    socket.emit("buildDensityArray",data);
});

socket.on("builtDensityArray" ,(data) => {
    var progressBar = $(".progress-bar");
    var label = $("#Info");

    label.empty();
    label.append("Status: Calculating density grid.")

    var i = 20;

    progressBar.empty();
    progressBar.attr("style","width:" + i +"%")
    progressBar.append(i + "%");

    socket.emit("buildDensityGrid",data);
})

socket.on("builtDensityGrid",(data) =>{
    var progressBar = $(".progress-bar");
    var label = $("#Info");

    label.empty();
    label.append("Status: Running Algorithm.")

    var i = 40;

    progressBar.empty();
    progressBar.attr("style","width:" + i +"%")
    progressBar.append(i + "%");
    socket.emit("Run algorithm",data);
})

socket.on("Ran algorithm",(data) => {
    var progressBar = $(".progress-bar");
    var label = $("#Info");

    label.empty();
    label.append("Status: Updating Grid Points.")

    var i = 75;

    progressBar.empty();
    progressBar.attr("style","width:" + i +"%")
    progressBar.append(i + "%");
    socket.emit("Update Grid Points",data);
})

socket.on("Updated points",(data) => {
    var progressBar = $(".progress-bar");
    var label = $("#Info");

    label.empty();
    label.append("Status: Creating SVG File.")

    var i = 95;

    progressBar.empty();
    progressBar.attr("style","width:" + i +"%")
    progressBar.append(i + "%");
    socket.emit("Draw to SVG",data);
})

socket.on("Finished!",() => {
    var progressBar = $(".progress-bar");
    var label = $("#Info");
    var button = $(".btn.btn-primary")

    label.empty();
    label.append("Status: Finished!")

    var i = 100;

    progressBar.empty();
    progressBar.attr("style","width:" + i +"%")
    progressBar.append(i + "%");

    button.empty();
    button.append("Next");

    $("#next").removeAttr("href");
    $("#next").attr("href","buildCart4");
})


var i;
var timeOut = 1000;
var pauseStatus = false;

function simulateSuccess() {
    //set up everything
    var progressBar = $(".progress-bar");
    var label = $("#Info");
    var labelError = $("#Error");
    var button = $(".btn.btn-primary");
    i=0;
    progressBar.attr("style","width:" + i +"%");
    progressBar.removeClass("bg-danger");
    label.empty();
    label.append("Status:Initialization");
    labelError.empty();
    button.empty();
    button.append("Pause");
    $("#next").removeAttr("href");
    $("#next").attr("href","javascript:pause()");


    
    animateBar();
}
function simulateFailure() {
    //set up everything
    var progressBar = $(".progress-bar");
    var label = $("#Info");
    var labelError = $("#Error");
    var button = $(".btn.btn-primary");
    i=0;
    progressBar.attr("style","width:" + i +"%");
    progressBar.removeClass("bg-danger");
    label.empty();
    label.append("Status:Initialization");
    labelError.empty();
    button.empty();
    button.append("Pause");
    $("#next").removeAttr("href");
    $("#next").attr("href","javascript:pause()");



    animateBarFailure();
}
function pause() {
    if(pauseStatus) {
        pauseStatus = false;
    } else {
        pauseStatus = true;
    }
}
function animateBar() {
    var progressBar = $(".progress-bar");
    var label = $("#Info");
    var button = $(".btn.btn-primary")

    //to pause the simulation
    if(pauseStatus) {
        label.empty();
        label.append("Status: Paused");
        button.empty();
        button.append("Resume");
        setTimeout("animateBar()",50);
        return;
    } else {
        //to reupdate the status once the program has been released from pause
        button.empty();
        button.append("Pause");
        if(i <= 10) {
            label.empty();
            label.append("Status: Gathering Data");
        }
    
        if(i<=30) {
            label.empty();
            label.append("Status: Building Density Grid.");
        }
    
        if(i>=50) {
            label.empty();
            label.append("Status: Building Cartogram.");
        }
    }

    //Main Part of the animation
    if(i < 100){
        i = i + 10; 
        progressBar.empty();
        progressBar.attr("style","width:" + i +"%")
        progressBar.append(i + "%");
    } else {
        label.empty();
        label.append("Status: Finished!");
        button.empty();
        button.append("Next");

        $("#next").removeAttr("href");
        $("#next").attr("href","buildCart4.html");
        return;
    }

    if(i == 10) {
        label.empty();
        label.append("Status: Gathering Data");
    }

    if(i==30) {
        label.empty();
        label.append("Status: Building Density Grid.");
    }

    if(i==50) {
        label.empty();
        label.append("Status: Building Cartogram.");
    }


    // Wait for sometime before running this script again
    setTimeout("animateBar()", timeOut);
}
function animateBarFailure() {
    var progressBar = $(".progress-bar");
    var label = $("#Info");
    var labelError = $("#Error");
    var button = $(".btn.btn-primary")

    //to pause the simulation
    if(pauseStatus) {
        label.empty();
        label.append("Status: Paused");
        button.empty();
        button.append("Resume");
        setTimeout("animateBar()",50);
        return;
    } else {
        //to reupdate the status once the program has been released from pause
        button.empty();
        button.append("Pause");
        if(i <= 10) {
            label.empty();
            label.append("Status: Gathering Data");
        }
    
        if(i<=30) {
            label.empty();
            label.append("Status: Building Density Grid.");
        }
    
        if(i>=50) {
            label.empty();
            label.append("Status: Building Cartogram.");
        }
    }

    if(i < 80){
        i = i + 10; 
        progressBar.empty();
        progressBar.attr("style","width:" + i +"%")
        progressBar.append(i + "%");
    } else {
        //so an Error has been picked up at 80%
        label.empty();
        label.append("Status: Sorry the system ran into an Error!");
        labelError.append("Error Message: Map Data Corrupted");
        progressBar.removeAttr("class");
        progressBar.attr("class","progress-bar progress-bar-striped bg-danger progress-bar-animated");
        button.empty();
        button.append("Go Back");
        $("#next").removeAttr("href");
        $("#next").attr("href","buildCart2.html");
        return;
    }

    if(i == 10) {
        label.empty();
        label.append("Status: Gathering Data");
    }

    if(i==30) {
        label.empty();
        label.append("Status: Building Density Grid.");
    }

    if(i==50) {
        label.empty();
        label.append("Status: Building Cartogram.");
    }


    // Wait for sometime before running this script again
    setTimeout("animateBarFailure()", timeOut);
}