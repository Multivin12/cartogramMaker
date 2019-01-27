window.onload = function () { 
    var textFile = "file://../test.txt";

    $('#result').load(textFile, function(result) {
        var variable = $('#result').html();
        alert(variable);
    });
}