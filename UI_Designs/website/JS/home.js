function init() {
	try {
		document.getElementById("gallery").removeChild(document.getElementById("gallery").childNodes[document.getElementById("gallery").childNodes.length-1]);
	} catch (err) {
	}
	
	var img = new Image();
	var url = "images/FAQImage.png";

	img.onload = function () {
		var windowHeight = $(window).height();
		this.height = windowHeight - 89;
		this.width = $(window).width();

		this.setAttribute("style","position:relative;z-index:-1;bottom:240px;");
		this.setAttribute("id","galleryImage");
		document.getElementById("gallery").appendChild(this);
	};

	img.src = url;
}