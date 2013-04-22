// init PhotoGallery module
var PhotoGallery = require('com.appersonlabs.photogallery');

// create photo array dummy data
var photoArray = [];
for (i=1;i<14;i++) {
	if (i === 2) {
		// insert a sample remote image
		photoArray.push({
			path:'http://upload.wikimedia.org/wikipedia/commons/e/e9/Felis_silvestris_silvestris_small_gradual_decrease_of_quality.png',
			caption:'WikiJpeg',
		});
	}
	if (i === 4) {
		// insert a sample remote image
		photoArray.push({
			path:'http://docs.appcelerator.com/titanium/3.0/images/download/attachments/29004930/table_grouped_rows.png',
			caption:'Grouped Rows on iOS',
		});
	}
	photoArray.push({
		path:'/images/glass_'+i+'.jpg',
		caption:'Beer Glass '+i,
	});
}

// open a single window
var win = Ti.UI.createWindow({
	backgroundColor:'white',
	title:'Photos!',
});

// add gallery to window
var gallery = new PhotoGallery({
	photos:photoArray,
	parentWindow:win,
	allowFullscreen:true,
});
win.add(gallery);

if (Ti.Android) {
	win.orientationModes = [Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_RIGHT, Ti.UI.LANDSCAPE_LEFT];
	win.open();
} else {
	var container = Ti.UI.createWindow({
		orientationModes:[Ti.UI.PORTRAIT, Ti.UI.LANDSCAPE_RIGHT, Ti.UI.LANDSCAPE_LEFT],
	});
	var navGroup = Ti.UI.iPhone.createNavigationGroup({
		window:win,
	});
	container.add(navGroup);
	container.open();
}
