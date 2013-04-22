/**
 * Create an image gallery
 *
 * @method create
 * @param properties The object to configure the library
 * @param properties.parentWindow (optional) The parent window of this gallery.
 * @param properties.photos An Array containg the image objects
 * @param properties.photos[].path The path of the image to be loaded
 * @param properties.photos[].caption The image caption
 * @param properties.allowFullscreen [true,false] On iOS, will expand to full-screen on click or scroll
 * @return {Titanium.UI.ScrollView} Returns a ScrollView
 */

// some phones are slower than others, so delay redraws accordingly
var redrawDelay = Ti.Platform.displayCaps.platformHeight === 568 || Ti.Android ? 250:500;

var PhotoGallery = function(properties) {
    /**
     * @property _parentWindow
     * @type Titanium.UI.Window
     */
    _parentWindow = properties.parentWindow,

    /**
     * @property _photos
     * @type Array
     */
    _photos = properties.photos || [],

    /**
     * @property _allowFullscreen
     * @type string
     */
    _allowFullscreen = properties.allowFullscreen,

    /**
     * @property _isFullscreen
     * @type Boolean
     */
    _isFullscreen = false,

    /**
     * @property _viewArray
     * @type Array
     */
    _viewArray = [],

    /**
     * @property _scrollView
     * @type Titanium.UI.ScrollView
     */
    _scrollView = null;

    photosView = Ti.UI.createScrollableView({
        showPagingControl: false,
        pagingControlColor: 'transparent',
    });

    // keep an array of all the scrollview pages
    var aImageViews = [];

    // the relayout() method redraws a specific scrollview page to best fit
    var relayout = function(imageView, h, w) {
        imageView.descriptionLabel.visible = !_isFullscreen; // only show the caption if we are not full-screen

        var rawHeight = imageView.rawHeight;
        var rawWidth = imageView.rawWidth;

        var ratio = Math.round(Math.min((h / rawHeight), (w / rawWidth))*1000)/1000;

        if (!Ti.Android) {
            imageView.img1Wrapper.remove(imageView.square);
            
            imageView.square.height = Math.round(h / ratio);
            imageView.square.width = Math.round(w / ratio);
            imageView.height = rawHeight;
            imageView.width = rawWidth;

            imageView.img1Wrapper.minZoomScale = ratio;
            imageView.img1Wrapper.zoomScale = ratio;
            
            imageView.img1Wrapper.add(imageView.square);
        } else {
            ratio = Math.min((h / rawHeight), (w / rawWidth));
            imageView.square.height = h;
            imageView.square.width = w;
            imageView.height = Math.round(rawHeight * ratio);
            imageView.width = Math.round(rawWidth * ratio);
        }
    };
        
    // redraw all images to best fit
    var redrawAllImages = function() {
        var height = _isFullscreen ? Ti.Platform.displayCaps.platformHeight : photosView.size.height;
        var width = _isFullscreen ? Ti.Platform.displayCaps.platformWidth : photosView.size.width;

        for (var i in aImageViews) {
            relayout(aImageViews[i], height, width);
        }
    };
        
    // placeholder for the loadImage function.
    var loadImage;
        
    // we are going to use XHR to load remote images more reliably
    var imagesData = [];
    var imagesXHR = Ti.Network.createHTTPClient({
        timeout:45000,
        onload:function(e){
            var currentIndex = imagesData.length;
            var imgBlob = this.responseData;
            
            // cache image
            var _location = this.location;
            // we save all images with ".png" or TiBlob won't detect the file is an image later
            var filename = Ti.Utils.md5HexDigest(_location)+'.png';
            var fileref = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, filename);
            fileref.write(imgBlob);
            fileref.remoteBackup = false; // don't want to cross apple
            Ti.API.debug('Cached '+_location+' as: '+fileref.nativePath);
            
            // save data
            imagesData.push(fileref.getNativePath());
            aImageViews[currentIndex].image = imgBlob;
            aImageViews[currentIndex].rawHeight = imgBlob.height;
            aImageViews[currentIndex].rawWidth = imgBlob.width;
            
            // draw image
            var height = _isFullscreen ? Ti.Platform.displayCaps.platformHeight : photosView.size.height;
            var width = _isFullscreen ? Ti.Platform.displayCaps.platformWidth : photosView.size.width;
            relayout(aImageViews[currentIndex], height, width);
            
            // next image
            loadImage();
        },
        onerror:function(e){
            // try loading the image again
            loadImage();
        }
    });

    // loadImage() gets the next image from the array and loads it accordingly
    loadImage = function() {
        if (imagesData.length !== _photos.length) {
            var filename,fileref;
            var isLocal = false;
            var thisImage = _photos[imagesData.length].path;
            var rawFile = Ti.Filesystem.getFile(Ti.Filesystem.resourcesDirectory,thisImage);
            var currentIndex = imagesData.length;

            // is this a local file or a remote file?
            if (rawFile.exists()) {
                // local file, proceed
                isLocal = true;
                filename = thisImage;
                fileref = rawFile;
            } else {
                // this is a remote image, check the cache
                filename = Ti.Utils.md5HexDigest(thisImage)+'.png';
                fileref = Ti.Filesystem.getFile(Ti.Filesystem.tempDirectory, filename);
            }

            if(fileref.exists()) {
                Ti.API.debug('Image '+filename+' alread exists');
                
                // read the file, and save the full height & width
                var imgBlob = fileref.read();
                imagesData.push(fileref.getNativePath());
                aImageViews[currentIndex].image = isLocal ? filename:imgBlob;
                aImageViews[currentIndex].rawHeight = imgBlob.height;
                aImageViews[currentIndex].rawWidth = imgBlob.width;
                
                // draw image
                var height = _isFullscreen ? Ti.Platform.displayCaps.platformHeight : photosView.size.height;
                var width = _isFullscreen ? Ti.Platform.displayCaps.platformWidth : photosView.size.width;
                relayout(aImageViews[currentIndex], height, width);
                
                // next image
                loadImage();
            } else {
                Ti.API.debug('File '+fileref.nativePath+' does not exist');
                Ti.API.debug('Fetching '+thisImage);
                imagesXHR.open('GET',thisImage);
                imagesXHR.send();
            }
        }
    };
        
    var baseHeight,baseWidth;

    for (var i = 0, b = _photos.length; i < b; i++) {
        var view = Ti.UI.createImageView({
            height:'30dip',
            height:'30dip',
        });

        if (Ti.Android) {
            // android ScrollViews do not support scrolling in both directions, so they're pretty useless here
            view.img1Wrapper = Ti.UI.createView({
                x:0,
                y:0,
                height:Ti.UI.FILL,
                width:Ti.UI.FILL,
                image: _photos[i].path,
            });
        } else {
            view.img1Wrapper = Ti.UI.createScrollView({
                x:0,
                y:0,
                height:Ti.UI.FILL,
                width:Ti.UI.FILL,
                maxZoomScale: 3.0,
                image: _photos[i].path,
            });
        }
        
        view.img1Wrapper.addEventListener('doubletap', function(e) {
            if (Ti.Android) {
                // for android, if the user double-taps, open the image viewer
                var intent = Ti.Android.createIntent({
                    action: Ti.Android.ACTION_VIEW,
                    type: "image/*",
                    data: e.source.image
                });

                try {
                    Ti.Android.currentActivity.startActivity(intent);
                } catch (error) {
                    Ti.API.debug(error);
                    alert('Cannot open image.');
                }
            } else {
                // for iOS, if the user double-taps, zoom in/out
                if (this.getZoomScale() > this.getMinZoomScale()) {
                    this.setZoomScale(this.getMinZoomScale());
                } else {
                    this.setZoomScale(1);
                }
            }
        });

        // we put the ImageView in a square container so that you can zoom/scroll to see any part of the image, even the edges
        view.square = Ti.UI.createView({
            x: 0,
            y: 0,
        });
        view.square.add(view);

        view.img1Wrapper.add(view.square);
        
        // add this imageView to our array
        aImageViews.push(view);


        view.descriptionLabel = Ti.UI.createLabel({
            text: _photos[i].caption,
            top: 0,
            width: Ti.UI.FILL,
            height: Ti.UI.SIZE,
            backgroundColor: '#66000000',
            textAlign: 'center',
            font: {
                fontSize: '16dip',
                fontWeight: 'bold'
            },
            color: '#FFF',
            zIndex: 2,
            visible: _photos[i].caption && _photos[i].caption.length,
        });
        
        if (Ti.Android) {
            // only use the minimum amount of containers neccessary
            view.img1Wrapper.add(view.descriptionLabel);
            _viewArray.push(view.img1Wrapper);
        } else {
            // **CRITICAL** on iOS do NOT add scrollviews directly to a scrollableview. We have to wrap in another container
            var fixWrapper = Ti.UI.createView({
                height:Ti.UI.FILL,
                width:Ti.UI.FILL,
            });
            fixWrapper.add(view.img1Wrapper);
            fixWrapper.add(view.descriptionLabel);
            
            _viewArray.push(fixWrapper);
        }
    }
    
    // add our pages to the ScrollableView
    photosView.views = _viewArray;

    // listen for an orentation change, and redraw all images to best fit the container
    Ti.Gesture.addEventListener('orientationchange', function() {
        setTimeout(function(){
            redrawAllImages();
        }, redrawDelay);
    });

    if (!Ti.Android && _allowFullscreen) {
        photosView.addEventListener('singletap', function() {
            if (_isFullscreen) {
                // Exit fullscreen
                Ti.UI.iPhone.showStatusBar();
                if (_parentWindow) {
                    _parentWindow.showNavBar();
                }
            } else {
                // Go fullscreen
                Ti.UI.iPhone.hideStatusBar();
                if (_parentWindow) {
                    _parentWindow.hideNavBar();
                }
            }

            _isFullscreen = !_isFullscreen;

            // redraw all images
            setTimeout(function(){
                redrawAllImages();
            }, redrawDelay);
       });
    }
    
    var handleScroll = function(e) {
        // if iOS, try to go full screen.
        if (_allowFullscreen) {
            if (!Ti.Android && !_isFullscreen) {
                Ti.UI.iPhone.hideStatusBar();
                if (_parentWindow) {
                    _parentWindow.hideNavBar();
                }

                _isFullscreen = !_isFullscreen;

                setTimeout(function(){
                    redrawAllImages();
                }, redrawDelay);
            }
        }
    };

    photosView.addEventListener('scrollend',handleScroll);
    
    var openHandler = function(){
        // only do this when we are drawn
        photosView.removeEventListener('postlayout',openHandler);
        // start loading images
        loadImage();
    };

    photosView.addEventListener('postlayout',openHandler);

    return photosView;
};

module.exports = PhotoGallery;