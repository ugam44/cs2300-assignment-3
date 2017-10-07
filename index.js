var PNGImage = require('pngjs-image');
var fs = require('fs'), filename = process.argv[2];

/* -------------------------------
Check for proper program usage
------------------------------- */
if (process.argv.length < 3) {
  console.log('Usage: node ' + process.argv[1] + ' <filename>');
  process.exit(1);
}

var parameters = {
    grids: 0,
    lines: 0,
    lineWidth: 0,
    projectileRadius: 0,
    gridSpacing: 0,
};

var projectileArr = [];

var image = PNGImage.createImage(1000, 1000);

/* -------------------------------
Read in file
Assign Parameter Variables
------------------------------- */
fs.readFile(filename, 'utf8', function(err,data) {
    if(err) throw err;

    console.log('Loaded: ' + filename);
    
    var lineArr = data.split("\n");
    var parameterLine = lineArr[0];
    var parameterLine = parameterLine.split(",");

    var projectileRadius = Number(parameterLine[3])/2
    var parameters = {
        grids: parameterLine[0],
        lines: parameterLine[1],
        lineWidth: parameterLine[2],
        projectileRadius: projectileRadius,
        gridSpacing: parameterLine[4],
    }

    for(var x = 1;x < lineArr.length; x++){
        var line = lineArr[x];
        line = line.split(":")[1].trim().split("; ")
        for (var i = line.length - 1; i >= 0; i--) {
            var projectile = line[i].split(",")
            //projectileArr.push(projectile)
            var x0 = Number(projectile[0]);
            var y0 = Number(projectile[1]);
            var r0 = Number(parameters.projectileRadius);
            drawProjectile(x0,y0,r0);
        }
    }
    image.writeImage('./test.png', function (err) {
     if (err) throw err;
     console.log('Written to the file');
    });
});


function print(...str){
    console.log(...str)
}
// Get width and height 
console.log(image.getWidth());
console.log(image.getHeight());

// G = # of Grids
// N = # of lines per grid
// L = Width of lines
// S = Spacing between lines in each grid
// D = Diameter of the circular projectile

function Line(lineWidth, lineSpacing, index) {
    this.lineWidth = lineWidth || 0;
    this.lineSpacing = lineSpacing || 0;
    //this.isBroken = false;
    this.origin = [0, index * lineSpacing]; // [x, y]
    this.vector = [10, 0]; // [x, y]
    //this.brokenBy = null;
}

var parameters = {
    numOfGrids: 4,
    linesPerGrid: 11,
    lineWidth: 4,
    projectileDiameter: 49,
    lineSpacing: 45
};
var grids = [];
var projectileGroups = [];
var projectiles = [];

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
        if (rotationAngle > 0 && rotationAngle <= 90) {
            rotationAngle -= 180;
        }
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

function getScenario (scenarioNumber) {
    var [params, ...projectileGroups] = scenarios[scenarioNumber];
    var [numOfGrids, linesPerGrid, lineWidth, projectileDiameter, lineSpacing] = params;
    var newParameters = { numOfGrids, linesPerGrid, lineWidth, projectileDiameter, lineSpacing };
    projectileGroups = projectileGroups.map(function (group) {
        return { brokenLines: [], projectiles: group.slice() }
    });
    projectiles = projectileGroups.reduce(function (result, curr) {
        return result.concat(curr.projectiles);
    }, []);
    Object.assign(parameters, newParameters);
    grids = setGrids(parameters);
    //getBrokenLines();
};

function getGridAngle (index) {
    var angle = index * gridAngle;
    if (angle >= 90) {
        angle -= 180;
    }
    return angle;
};

function isLineHit(projectile, line) {
    var projectileRadius = parameters.projectileDiameter / 2;
    var halfLineWidth = parameters.lineWidth / 2;
    var dtl = distanceToLine(projectile, line);
    return (dtl - projectileRadius) <= halfLineWidth; 
}

function distanceToLine(point, line) {
    var [r1, r2] = point;
    if (line.vector[1] === 0) {
        // if horizontal line, return abs. value of y-coord of the point minus y-coord of anywhere on the horiz line
        return Math.abs(point[1] - line.origin[1]);
    }
    if (line.vector[0] === 0) {
        // if vertical line, return abs. value of x-coord of the point minus x-coord of anywhere on the vertical line
        return Math.abs(point[0] - line.origin[0]);
    }
    var aVector = [-1 * line.vector[1], line.vector[0]];
    var aVectorMagnitude = Math.sqrt(Math.pow(aVector[0], 2) + Math.pow(aVector[1], 2));
    var a = aVector[0];
    var b = aVector[1];
    var c = ((aVector[0] * line.origin[0]) + (aVector[1] * line.origin[1]));
    var d = (a*r1 + b*r2 + c) / aVectorMagnitude;
    return Math.abs(d);
}

//alert(distanceToLine([126,52], {vector: [0.707, -0.707], origin: [95,95]}));

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

var scenarios = {
    // output in out1.txt
    "1": [
        [4,11,2,49,45],
        [[126,52], [46,439], [250,239]],
        [[86,133], [435,435]]
    ],
    // output in out2.txt
    "2": [
        [2,11,10,490,450],
        [[860,1330], [4350,4350]],
        [[1260,520], [460,4390], [2500,2390]]
    ],
    // output in out3.txt
    "3": [
        [3,21,10,30,50],
        [[86,133], [435,435]],
        [[126,52], [46,439], [250,239]]
    ],
    // output in out4.txt
    "4": [
        [3,21,10,30,50],
        [[86,133], [435,435]],
        [[126,52], [46,439], [250,239]],
        [[126,52], [46,439], [250,239], [20,330]],
        [[206,52], [246,439], [250,239], [220,330]]
    ],
    // output in out5.txt
    "5": [
        [4,21,10,30,50],
        [[86,133], [435,435]],
        [[126,52], [46,439], [250,239]],
        [[126,52], [46,439], [250,239], [20,330]],
        [[206,52], [246,439], [250,239], [220,330]]
    ],
    // output in out6.txt
    "6": [
        [5,21,10,30,50],
        [[86,133], [435,435]],
        [[126,52], [46,439], [250,239]],
        [[126,52], [46,439], [250,239], [20,330]],
        [[206,52], [246,439], [250,239], [220,330]]
    ],
    // output in out7.txt
    "7": [
        [6,21,10,30,50],
        [[86,133], [435,435]],
        [[126,52], [46,439], [250,239]],
        [[126,52], [46,439], [250,239], [20,330]],
        [[206,52], [246,439], [250,239], [220,330]]
    ],
    // output in out8.txt
    "8": [
        [7,21,10,30,50],
        [[86,133], [435,435]],
        [[126,52], [46,439], [250,239]],
        [[126,52], [46,439], [250,239], [20,330]],
        [[206,52], [246,439], [250,239], [220,330]]
    ],
    // output in out9.txt
    "9": [
        [7,111,20,20,50],
        [[860,1330], [4350,4350]],
        [[1260,520], [460, 4390], [2500,2390]],
        [[1260,520], [460, 4390], [2500,2390], [200, 3300]],
        [[2060,520], [2460,4390], [2500,2390], [2200,3300]],
        [[2060,520], [2460,4390], [2500,2390], [2200,3300], [-100,-200]],
        [[2060,520], [2460,4390], [2500,2390], [2200,3300], [-100,-200], [-400, -200]],
        [[2060,520], [2460,4390], [2500,2390], [2200,3300], [-100,-200], [-400, -200], [-200, 400]],
        [[2060,520], [2460,4390], [2500,2390], [2200,3300], [-100,-200], [-400, -200], [200, -400], [1200, 100]]
    ],
    "t1": [
        [6,11,2,49,45],
        [[100,100]],
        [[200,200]],
        [[126,52], [46,439], [250,239]],
        [[86,133], [435,435]]
    ]

};

getScenario(1);
console.log(grids[1].lines);
function isHit(num, numType) {
    
}

// !!!still needs support for vertical lines!!!
function drawLine(image, slope, startingPoint) {
    
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

// // Get index of coordinate in the image buffer 
// var index = image.getIndex(20, 30);

// // Print the red color value 
// console.log(image.getRed(index));

// Get image data in array
//console.log(image.getBlob());

// Get low level image object with buffer from the 'pngjs' package 
//var pngjs = image.getImage();

// image.writeImage('./test.png', function (err) {
//  if (err) throw err;
//  console.log('Written to the file');
// });