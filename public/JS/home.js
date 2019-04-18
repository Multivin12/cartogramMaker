

function init(status) {

	var windowHeight = $(window).height();
	var newHeight = windowHeight - $("#header").height()-40;

	$("#gallery img.opaque").attr("style","position:absolute;z-index:-5;left:0%;bottom:0%;width:100%;height:" + newHeight + "px;");

	//This is only ran when the html is firstly loaded, status 0 means the screen has been resized, status 1 means it's been loaded
	if(status === 1) {
		addHTML(0);
	}
	
	//For the selector buttons at the bottom
	$(document).ready(function() {
		$("#gallery_controls").on('click', 'button', function() {
			//Remove all classes from the gallery image
			$("#gallery img").removeClass("opaque");
			
			//get the new image to display
			var newImage = $(this).index();
	
			$("#gallery img").removeAttr("style");
			//set the class of the image to display to opaque
			$("#gallery img").eq(newImage).addClass("opaque");

			//change the size of the gallery
			var windowHeight = $(window).height();
			var newHeight = windowHeight - $("#header").height()-40;
			$("#gallery img").eq(newImage).attr("style","position:absolute;z-index:-5;left:0%;bottom:0%;width:100%;height:" + newHeight + "px;");
	
			$("#gallery_controls button").removeClass("selected");
			$(this).addClass("selected");

			addHTML(newImage);
		});
	});
}

/*This function is called whenever the left button is pressed */
function translatePictureLeft() {
	var index = $(".opaque").index();

	//Remove all classes from the gallery image
	$("#gallery img").removeClass("opaque");

	index -= 3;
	

	if( index === -1) {
		index = 2;
	} 
	
	$("#gallery img").removeAttr("style");
	//set the class of the image to display to opaque
	$("#gallery img").eq(index).addClass("opaque");

	//change the size of the gallery
	var windowHeight = $(window).height();
	var newHeight = windowHeight - $("#header").height()-40;
	$("#gallery img").eq(index).attr("style","position:absolute;z-index:-5;left:0%;bottom:0%;width:100%;height:" + newHeight + "px;");

	$("#gallery_controls button").removeClass("selected");
	$("#gallery_controls button").eq(index).addClass("selected");

	addHTML(index);
}

/*This function is called whenever the right button is pressed */
function translatePictureRight() {
	var index = $(".opaque").index();


	//Remove all classes from the gallery image
	$("#gallery img").removeClass("opaque");

	index -= 1;
	

	if( index === 3) {
		index = 0;
	} 
	
	$("#gallery img").removeAttr("style");
	//set the class of the image to display to opaque
	$("#gallery img").eq(index).addClass("opaque");

	//change the size of the gallery
	var windowHeight = $(window).height();
	var newHeight = windowHeight - $("#header").height()-40;
	$("#gallery img").eq(index).attr("style","position:absolute;z-index:-5;left:0%;bottom:0%;width:100%;height:" + newHeight + "px;");

	$("#gallery_controls button").removeClass("selected");
	$("#gallery_controls button").eq(index).addClass("selected");

	addHTML(index);
}

/**
 * Function to add HTML to the image gallery
 * 
 * @param  element 
 */
function addHTML(imgIndex) {
	
	//picInfo is the div containing the buttons and text to be projected onto the image
	$("#picInfo").remove();
	$("body").append($("<div/>").attr("id","picInfo"));
	
	var p = $("<p/>");
	var h1 = $("<h1/>");
	var a = $("<a/>");

	switch(imgIndex) {
		case 0:
			$("#picInfo").append(h1);
			$("#picInfo h1").append("B-Cart: Online Cartogram Maker.");

			$("#picInfo").append(p);
			$("#picInfo p").append("Build Cartograms now just by clicking here.");

			$("#picInfo").append(a);
			$("#picInfo a").attr("href","/buildCart");

			$("#picInfo a").append($("<button/>").attr("style","position:absolute;z-index:5;").append("Build Cartogram"));
			$("#picInfo button").attr("class","btn btn-primary");
			break;
		case 1:
			$("#picInfo").append(h1);
			$("#picInfo h1").append("Resources Used");

			$("#picInfo").append(p);
			$("#picInfo p").append("This Software uses Gastner and Newman's algorithm" +
			" to produce a cartogram.");

			$("#picInfo").append(a);
			$("#picInfo a").attr("href","/resources");

			$("#picInfo a").append($("<button/>").attr("style","position:absolute;z-index:5;").append("Resources"));
			$("#picInfo button").attr("class","btn btn-primary");
			$("#picInfo button").attr("id","cartogramUse");
			break;
		default:
			$("#picInfo").append(h1);
			$("#picInfo h1").append("What are cartograms?");

			$("#picInfo").append(p);
			$("#picInfo p").append("They are maps where regions are scaled according to a given statistic.");

			$("#picInfo").append(a);
			$("#picInfo a").attr("href","/cartUse");

			$("#picInfo a").append($("<button/>").attr("style","position:absolute;z-index:5;").append("Use of Cartograms"));
			$("#picInfo button").attr("class","btn btn-primary");
			$("#picInfo button").attr("id","cartogramUse");
	}
}