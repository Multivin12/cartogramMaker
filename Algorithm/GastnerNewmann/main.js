//This file is for running the Gastner Newmann algorithm
const OFFSET = 0.005;
const DCT2 = require('./DCT2.js');
const GastnerNewmann = require('./GastnerNewmann.js');
var inputData = null;

/* Function for reading from an external file into inputData*/
function readpop(densityGrid) {

    inputData = densityGrid;
    
    var xsize = densityGrid[0].length;
    var ysize = densityGrid.length;

    var ix,iy;
    var mean;
    var sum=0.0;

    for (iy=0; iy<ysize; iy++) {
        for (ix=0; ix<xsize; ix++) {
            sum += inputData[ix][iy];
        }
    }

    mean = sum/(xsize*ysize);
    
    for (iy=0; iy<ysize; iy++) {
        for (ix=0; ix<xsize; ix++) {
            inputData[ix][iy] += OFFSET*mean;
        }
    }

    return [xsize,ysize];
}

/*Function to print out the output of the algorithm to stdout*/
function printOutput(gridx,gridy) {
    for(var i =0;i<gridx.length;i++) {
        console.log(gridx[i],gridy[i]);
    }
}

/*function to create the grid for the algorithm to use */
function creategrid(xsize,ysize) {
    var gridx = DCT2.initializeArray((xsize+1)*(ysize+1));
    var gridy = DCT2.initializeArray((xsize+1)*(ysize+1));
    var ix,iy,i;

    for(iy=0,i=0;iy<=ysize;iy++) {
        for(ix=0;ix<=xsize;ix++) {
            gridx[i] = ix;
            gridy[i] = iy;
            i++;
        }
    }

    return [gridx,gridy];
}

/**
 * Function to launch the gastner-newmann algorithm
 * 
 * Output is a set of cordinates for a MATRIX, not a cartesian coordinate system.
 */
function main(densityGrid) {


    var tup = readpop(densityGrid);

    xsize = tup[0];
    ysize = tup[1];


    var obj = new GastnerNewmann();

    //Do the various stages as stated in the documentation of cart.c
    obj.cart_makews(xsize,ysize);
    
    obj.cart_transform(inputData);
    
    var temp = creategrid(xsize,ysize);
    var gridx = temp[0];
    var gridy = temp[1];

    var tup = obj.cart_makecart(gridx,gridy,(xsize+1)*(ysize+1),xsize,ysize,0);
    gridx = tup[0];
    gridy = tup[1];

    var gridPoints = new Array(gridx.length);

    for(var i=0;i<gridx.length;i++) {
        gridPoints[i] = [gridx[i],gridy[i]];
    }

    return gridPoints;
}

module.exports = main;