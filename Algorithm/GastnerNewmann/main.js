//This file is for running the Gastner Newmann algorithm
const OFFSET = 0.005;
const DCT2 = require('./DCT2.js');
const GastnerNewmann = require('./GastnerNewmann.js');

var inputData = null;

/* Function for reading from an external file into inputData*/
function readpop(filename,xsize,ysize) {
    inputData = DCT2.initialize2DArray(xsize,ysize);

    //assign the test data
    for (var i=0;i<xsize;i++) {
        for (var j=0;j<ysize;j++) {
            inputData[i][j] = (i+1)*(j+1);
        }
    }

    var ix,iy;
    var n;
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
            i++
        }
    }
    return [gridx,gridy];
}

/*Function to launch the gastner-newmann algorithm*/
function main(densityFile,xsize,ysize) {

    readpop(densityFile,xsize,ysize);

    var obj = new GastnerNewmann();

    //Do the various stages as stated in the documentation of cart.c
    obj.cart_makews(xsize,ysize);
    
    obj.cart_transform(inputData,xsize,ysize);
    
    var temp = creategrid(xsize,ysize);
    var gridx = temp[0];
    var gridy = temp[1];
    var tup = obj.cart_makecart(gridx,gridy,(xsize+1)*(ysize+1),xsize,ysize,0);
    gridx = tup[0];
    gridy = tup[1];

    printOutput(gridx,gridy);
}

main("GridFile.txt",50,50);