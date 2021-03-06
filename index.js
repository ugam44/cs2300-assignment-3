var PNGImage = require("pngjs-image");
var fs = require("fs"), filename = process.argv[2];

/* -------------------------------
Check for proper program usage
------------------------------- */
if (process.argv.length < 3) {
    console.log("Usage: node . <filename.txt>");
    console.log("Ex: node . in2.txt");
    process.exit(1);
}
if (process.argv[2].split(".")[1] != "txt"){
    console.log("This is not the proper filetype");
    console.log("Usage: node . <filename.txt>");
    process.exit(1);
}

var image = PNGImage.createImage(1000, 1000);

/* -------------------------------
Read in file
Assign Parameter Variables
------------------------------- */
fs.readFile(filename, "utf8", function(err,data) {
    if(err) throw err;

    console.log("Loaded: " + filename);
    var outfile = `./${filename.split(".txt")[0]}out.png`;
    // first line of file determines parameters, rest of lines are projectile definitions
    var [parameterLine, ...projectileLines] = data.split("\n");
    parameterLine = parameterLine.split(",").map(elem => Number(elem.replace("\r", "")));

    var parameters = {
        numOfGrids: parameterLine[0],
        linesPerGrid: parameterLine[1],
        lineWidth: parameterLine[2],
        projectileDiameter: parameterLine[3],
        projectileRadius: parameterLine[3]/2,
        lineSpacing: parameterLine[4],
    };
    grids = setGrids(parameters);
    setLinePixels(image);
    
    projectileLines.forEach(function (line) {
        // line format -- # of projectiles: proj0x-coord,proj0y-coord; proj1x-coord,proj1y-coord, etc.
        // Example -- 3: 126,52; 46,439; 250,239
        // Don't care about # of projectiles, just want each x,y pair into an array

        try{
            var projectiles = line.split(":")[1].trim().split(";").map(elem => elem.trim()).filter(Boolean);
            projectiles.forEach(function (coord) {
                var [x0, y0] = coord.split(",").map(Number);
                var radius = Number(parameters.projectileRadius);
                drawProjectile(x0, y0, radius);
            });
        } catch (e) {
            console.log(e instanceof TypeError);
        }
    });
    image.writeImage(outfile, function (err) {
        if (err) throw err;
        console.log("Written to the file");
    });
});

var grids = [];
var gridColors = [
    {red: 70,  green: 130, blue: 180, alpha: 255},
    {red: 255, green: 0,   blue: 255, alpha: 255},
    {red: 184, green: 134, blue: 11,  alpha: 255},
    {red: 0,   green: 128, blue: 0,   alpha: 255},
    {red: 127, green: 255, blue: 0,   alpha: 255},
    {red: 0,   green: 255, blue: 255, alpha: 255},
    {red: 255, green: 235, blue: 205, alpha: 255},
    {red: 255, green: 140, blue: 0,   alpha: 255},
    {red: 30,  green: 144, blue: 255, alpha: 255},
    {red: 255, green: 215, blue: 0,   alpha: 255},
    {red: 147, green: 112, blue: 216, alpha: 255},
];

function setLinePixels (image) {
    var height = image.getHeight();
    var width = image.getWidth();

    // for each pixel in image
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            // for each grid in grids until pixel is hit
            grids.some(function (grid, gridIndex) {
                // for each line in grid.lines until pixel is hit
                return grid.lines.some(function (line) {
                    // if line angle (slope/vector[1]) > 0
                    // use top-left and bottom-right corners to determine distances
                    var topCorner = [x, y + 1];
                    var bottomCorner = [x + 1, y];
                    // else, use top-right and bottom-left corners to determine distances
                    if (line.vector[1] < 0) {
                        topCorner = [x + 1, y + 1];
                        bottomCorner = [x, y];
                    }
                    var distToBottomCorner = signedDistanceToLine(bottomCorner, line);
                    var distToTopCorner = signedDistanceToLine(topCorner, line);
                    var setPixel = false;

                    // if both top & bottom are positive (or zero)
                    if (distToTopCorner >= 0 && distToBottomCorner >= 0 && (2 * distToBottomCorner + 0.05 <= line.lineWidth)) {
                        setPixel = true;
                    }
                    // else if both top & bottom are negative (or zero)
                    else if (distToTopCorner <= 0 && distToBottomCorner <= 0 && (Math.abs(2 * distToTopCorner) + 0.05 <= line.lineWidth)) {
                        setPixel = true;
                    }
                    // else if top >= 0 and bottom <= 0
                    else if (distToTopCorner >= 0 && distToBottomCorner <= 0) {
                        setPixel = true;
                    }

                    // set pixel, break out of loops
                    if (setPixel) {
                        image.setAt(x, height - y, gridColors[gridIndex]);
                        return true;
                    }
                        
                    return false;
                });
            });
        }
    }
}

function Line(lineWidth, lineSpacing, index) {
    this.lineWidth = lineWidth || 0;
    this.lineSpacing = lineSpacing || 0;
    this.origin = [0, index * lineSpacing]; // [x, y]
    this.vector = [10, 0]; // [x, y]
}

function sinDegrees(angle) {
    switch(angle) {
    case 0:
        return 0;
    case 90:
        return 1;
    case -90:
        return -1;
    case 180:
    case -180:
        return 0;
    }
    return Math.sin(angle/180*Math.PI);
}

function cosDegrees(angle) {
    switch(angle) {
    case 0:
        return 1;
    case 90:
    case -90:
        return 0;
    case 180:
        return -1;
    }
    return Math.cos(angle/180*Math.PI);
}

function setGrids(parameters) {
    var _grids = Array(parameters.numOfGrids).fill({
        lines: Array(parameters.linesPerGrid).fill(0)
    });
    var gridAngle = 180 / _grids.length;
    return _grids.map(function (grid, gridIndex) {
        var rotationAngle = gridIndex * gridAngle;
        // if line angle is between 0 and 45, or equal to 90, rotate by 180 degrees to get Q1 coverage
        if ((rotationAngle > 0 && rotationAngle <= 45) || (rotationAngle === 90)) {
            rotationAngle -= 180;
        }
        // else, if it is between 45 and 90 (not-inclusive), leave the angle alone to maximize Q1 coverage

        var rotationMatrix = [
            [cosDegrees(rotationAngle), -1 * sinDegrees(rotationAngle)],
            [sinDegrees(rotationAngle), cosDegrees(rotationAngle)]
        ];
        var transformedVector = null;
        var lines = grid.lines.map(function (_, lineIndex) {
            var newLine = new Line(parameters.lineWidth, parameters.lineSpacing, lineIndex);
            // don't need to calculate vector each time - same for each line in the grid
            if (!transformedVector) {
                transformedVector = [].concat(...matrixMultiply(rotationMatrix, [[newLine.vector[0]], [newLine.vector[1]]]));
            }
            newLine.vector = transformedVector.slice();
            newLine.origin = [].concat(...matrixMultiply(rotationMatrix, [[newLine.origin[0]], [newLine.origin[1]]]));
            return newLine;
        });
        
        return { lines: lines };
    });
}

function signedDistanceToLine(point, line) {
    var [r1, r2] = point;
    if (line.vector[1] === 0) {
        // if horizontal line, return abs. value of y-coord of the point minus y-coord of anywhere on the horiz line
        return point[1] - line.origin[1];
    }
    if (line.vector[0] === 0) {
        // if vertical line, return abs. value of x-coord of the point minus x-coord of anywhere on the vertical line
        return point[0] - line.origin[0];
    }
    var aVector = [-1 * line.vector[1], line.vector[0]];
    // sqrt(x0^2 + x1^2 + ... + xn^2)
    var aVectorMagnitude = Math.sqrt(Math.pow(aVector[0], 2) + Math.pow(aVector[1], 2));
    
    // Line equation: ax + by + c = 0
    var a = aVector[0];
    var b = aVector[1];
    var c = ((aVector[0] * line.origin[0]) + (aVector[1] * line.origin[1]));
    // d = distance from point to line (this is a signed value)
    var d = (a*r1 + b*r2 + c) / aVectorMagnitude;
    return d;
}

function matrixMultiply(matrixA, matrixB) {
    var result = Array(matrixA.length).fill(Array(matrixB[0].length).fill(0));
    return result.map(function(arr, index) {
        return arr.map(function(elem, _index) {
            var sum = 0;
            for (var i = 0; i < matrixB.length; i++) {
                sum += matrixA[index][i] * matrixB[i][_index];
            }
            return sum;
        });
    });
}

function drawProjectile(x0, y0, radius){
    radius = Math.ceil(radius);
    for(var y = -radius; y <= radius; y++){
        for(var x = -radius; x <= radius; x++){
            if(x*x+y*y <= radius*radius){
                var x1 = x0 + x;
                var y1 = image.getHeight() - (y0 + y);
                image.setAt(x1, y1, { red: 255, green: 0, blue: 0, alpha: 255});
            }
        }
    }
}