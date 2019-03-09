function init() {

	var windowHeight = $(window).height();
	var newHeight = windowHeight - $("#header").height()-40;

	$("#gallery img.opaque").attr("style","position:absolute;z-index:-5;left:0%;bottom:0%;width:100%;height:" + newHeight + "px;");

	addHTML(0);
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
		index = 3;
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

/*This function is called whenever the left button is pressed */
function translatePictureRight() {
	var index = $(".opaque").index();


	//Remove all classes from the gallery image
	$("#gallery img").removeClass("opaque");

	index -= 1;
	

	if( index === 4) {
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
	switch(imgIndex) {
		case 0:
			$("body").append($("<button/>").attr("style","position:absolute;z-index:5;").append("0"));
			break;
		case 1:
			$("body").append($("<button/>").attr("style","position:absolute;z-index:5;").append("1"));
			break;
		case 2:
			$("body").append($("<button/>").attr("style","position:absolute;z-index:5;").append("2"));
			break;
		default:
			$("body").append($("<button/>").attr("style","position:absolute;z-index:5;").append("3"));
	}
}