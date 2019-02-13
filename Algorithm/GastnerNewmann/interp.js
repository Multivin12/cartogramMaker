const DCT2 = require('./DCT2.js');

class Interpreter {

    constructor(gridPoints,xGridSize,yGridSize){

        var gridx = DCT2.initializeArray(xGridSize+1*yGridSize+1);
        var gridy = DCT2.initializeArray(xGridSize+1*yGridSize+1);

        //extracting all the x coordinates from the gridPoints
        for(var i=0;i<gridPoints.length;i++) {
            gridx[i] = gridPoints[i][1];
            console.log(gridx[i]);
        }

        //extracting all of the y coordinates from the gridPoints
        for(var i=0;i<gridPoints.length;i++) {
            gridy[i] = gridPoints[i][0];
        }

        this.gridx = DCT2.to2DArray(gridx,xGridSize+1,yGridSize+1);
        this.gridy = DCT2.to2DArray(gridy,xGridSize+1,yGridSize+1);
    }

    interpData(xin,yin) {
        var ix = xin;
        var dx = xin-ix;

        var iy=yin;
        var dy=yin-iy;

        var xout = (1-dx)*(1-dy) * this.gridx[ix][iy] + (dx)*(1-dy) * this.gridx[ix+1][iy] +
                    (1-dx)*(dy) * this.gridx[ix][iy+1] + (dx)*(dy) * this.gridx[ix+1][iy+1];

        var yout = (1-dx)*(1-dy) * this.gridy[ix][iy] + (dx)*(1-dy) * this.gridy[ix+1][iy] +
                    (1-dx)*(dy) * this.gridy[ix][iy+1] + (dx)*(dy) * this.gridy[ix+1][iy+1];

        console.log(xout,yout);
    }

}
module.exports = Interpreter;