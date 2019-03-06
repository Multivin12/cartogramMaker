function init() {
	var windowHeight = $(window).height();
	var headerHeight = $("#header").height();
	var img = $("#galleryImage");
	alert(windowHeight);
	alert(headerHeight);
	img.height = windowHeight - headerHeight;
	alert(img.height);
}