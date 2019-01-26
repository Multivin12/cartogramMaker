function loadData() {
    var file = "file://../test.txt";
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function () {
        if(this.readyState === 4) {
            if(this.status === 200 || this.status == 0) {
                drawMap(this);
            }
        }
    }
    xhttp.open("GET", file, true);
    xhttp.send();
}
function drawMap(data) {
    alert(data.responseXML);
}