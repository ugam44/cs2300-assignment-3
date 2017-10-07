var PNGImage = require('pngjs-image');
var fs = require('fs'), filename = process.argv[2];

/* -------------------------------
Check for proper program usage
------------------------------- */
if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' <filename>');
  process.exit(1);
}

/* -------------------------------
Read in file
Assign Parameter Variables
------------------------------- */
fs.readFile(filename, 'utf8', function(err,data) {
    if(err) throw err;

    console.log('Loaded: ' + filename);
    
    lineArr = data.split("\n");
    parameterLine = lineArr[0];
    parameterArr = parameterLine.split(",")
    
    grids = parseInt(parameterArr[0])
    lines = parseInt(parameterArr[1]) 
    lineWidth = parseInt(parameterArr[2])
    projectileRadius = parseFloat(parameterArr[3])/2
    gridSpacing = parseInt(parameterArr[4])
    
    for(var x = 1;x < lineArr.length; x++){
        line = lineArr[x]
    }
})

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

// !!!still needs support for vertical lines!!!
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

/* -------------------------------
Draw Filled in Projectile
------------------------------- */
function drawProjectile(x0, y0, r){
    for(var y=(-1*r); y<=r; y++){
        for(var x=(-1*r); x <= r; x++){
            if(x*x+y*y <= r*r){
                image.setAt(x0 + x, y0 + y, { red: 255, green: 0, blue: 0, alpha: 255});
            }
        }
    }
}

drawProjectile(100, 100, 49);

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