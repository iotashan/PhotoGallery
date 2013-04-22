# PhotoGallery Module

## Description

Simple Photo Gallery CommonJS module

## Accessing the PhotoGallery Module

To access this module from JavaScript, you would do the following:

	var PhotoGallery = require("org.appersonlabs.photogallery");

The PhotoGallery variable is a reference to the Module object.	

## Reference

### PhotoGallery.parentWindow 
(optional) Ti.UI.Window
The parent window of this gallery.

### PhotoGallery.photos
Array
An Array containg the image objects:

	{path:'/path/to/local/or/remote/image',caption:'The image caption'}

### PhotoGallery.allowFullscreen
(optional) bool
On iOS, will expand to full-screen on click or scroll

## Usage

	var gallery = new PhotoGallery({
		photos:photoArray,
		parentWindow:win,
		allowFullscreen:true,
	});
	win.add(gallery);
