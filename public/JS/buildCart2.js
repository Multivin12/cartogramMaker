
var socket = io();

function loadMap() {
	$("#container").empty();
	
    var imgToAdd = $("<img/>");
    
    imgToAdd.attr("src","images/map.png");
    $("#container").append(imgToAdd);
}

function loadData() {
    socket.emit('requestData');
}

socket.on('dataRecieved',(data) => {
    $("#container").empty();

    var table = $("<table/>");
    table.addClass("table table-striped");
    //create the table head
    var thead = $("<thead/>");
    var tr = $("<tr/>");
    var th1 = $("<th/>");
    th1.attr("scope","col");
    th1.text("Region");
    var th2 = $("<th/>");
    th2.attr("scope","col");
    th2.text("Population");
    //append the elements together
    tr.append(th1);
    tr.append(th2);
    table.append(thead).append(tr);

    //now for the table body
    var tbody = $("<tbody/>");
    for(var i=0;i<data.length;i++) {
        var line = data[i].split(",");
        var tr = $("<tr/>");
        
        var td1 = $("<td/>");
        td1.attr("scope","row");
        td1.text(line[0]);

        var td2 = $("<td/>");
        td2.text(line[1]);

        tr.append(td1);
        tr.append(td2);

        tbody.append(tr);
    }

    table.append(tbody);
    //add the elements to the container
    $("#container").append(table);
})