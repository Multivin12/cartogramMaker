const DCT2 = require('./DCT2.js');

class Interpreter {

    constructor(gridPoints,xGridSize,yGridSize){

        var gridx = DCT2.initializeArray(xGridSize+1*yGridSize+1);
        var gridy = DCT2.initializeArray(xGridSize+1*yGridSize+1);

        //extracting all the x coordinates from the gridPoints
        for(var i=0;i<gridPoints.length;i++) {
            gridx[i] = gridPoints[i][1];
        }

        //extracting all of the y coordinates from the gridPoints
        for(var i=0;i<gridPoints.length;i++) {
            gridy[i] = gridPoints[i][0];
        }

        this.gridx = DCT2.to2DArray(gridx,xGridSize+1,yGridSize+1);
        this.gridy = DCT2.to2DArray(gridy,xGridSize+1,yGridSize+1);

        this.xsize = xGridSize;
        this.yside = yGridSize;

    }

    /**
     * Peforms bilinear interpolation to predict the x,y coordinate on the new grid
     * returns a tuple containing the predicted x,y position.
     * This is also taken from Newmann's c code.
     */
    interpData(xin,yin) {

        /* test if we are outside the bounds */
        if ((xin<0.0)||(xin>=this.xsize)||(yin<0.0)||(yin>=this.ysize)) {
            tup = [xin,yin];
            return tup;
        }

        var ix = Math.trunc(xin);
        var dx = xin-ix;

        var iy=Math.trunc(yin);
        var dy=yin-iy;

        var xout = (1-dx)*(1-dy) * this.gridx[ix][iy] + (dx)*(1-dy) * this.gridx[ix+1][iy] +
                    (1-dx)*(dy) * this.gridx[ix][iy+1] + (dx)*(dy) * this.gridx[ix+1][iy+1];

        var yout = (1-dx)*(1-dy) * this.gridy[ix][iy] + (dx)*(1-dy) * this.gridy[ix+1][iy] +
                    (1-dx)*(dy) * this.gridy[ix][iy+1] + (dx)*(dy) * this.gridy[ix+1][iy+1];

        var tup = [xout,yout];
        return tup;
    }

}
module.exports = Interpreter;