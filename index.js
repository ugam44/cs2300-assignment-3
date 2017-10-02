var PNGImage = require('pngjs-image');

var image = PNGImage.createImage(1000, 1000);

// Get width and height 
console.log(image.getWidth());
console.log(image.getHeight());

function isHit(num, numType) {
    if (numType === "floor") {
        return num < 0.85;
    }
    else if (numType === "ceil") {
        return num > -0.55
    }
    return false;
}

function drawLine(image, slope, startingPoint) {
    for (var x = 0; x <= image.getWidth(); x+=0.1) {
        var y = slope * x + startingPoint; // y = mx + b
        var floor = Math.floor(y);
        var ceil = Math.ceil(y);
        if (isHit(floor, "floor")) {
            // maxY - y, which transforms along the X axis
            image.setAt(x, image.getHeight() - floor, { red: 255, green: 0, blue: 0, alpha: 255});
        }
        if (isHit(ceil, "ceil")) {
            // maxY - y, which transforms along the X axis
            image.setAt(x, image.getHeight() - ceil, { red: 255, green: 0, blue: 0, alpha: 255});
        }
    }
}

drawLine(image, -0.707106, 1000);

// // Get index of coordinate in the image buffer 
// var index = image.getIndex(20, 30);

// // Print the red color value 
// console.log(image.getRed(index));

// Get image data in array
//console.log(image.getBlob());

// Get low level image object with buffer from the 'pngjs' package 
var pngjs = image.getImage();

image.writeImage('./test.png', function (err) {
   if (err) throw err;
   console.log('Written to the file');
});