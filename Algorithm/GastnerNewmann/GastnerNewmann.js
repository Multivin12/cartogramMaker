//This file is for performing the Gastner Newman algorithm on a given grid
//Algorithm taken from Newmann's C code implementation 
//can be found here: http://www-personal.umich.edu/~mejn/cart/.

const DCT2 = require('./DCT2.js');
const INITH = 0.001; //Initial size of a time step
const TARGETERROR = 0.01; // Desired accuracy per step in pixels
const MAXRATIO = 4.0; //Max ratio to increase step size by

class GastnerNewmann {

    constructor() {
        //2D array representing the population density at time t (5 snaps/iterations needed)
        this.rhot = null;
        //2D array representing the fft of the rhot initially (t = 0)
        this.fftrho = null;
        //2D array representing the density at time t
        this.fftexpt = null;
        //3D array representing the xvelocity at time t
        this.vxt = null;
        //3D array representing the yvelocity at time t
        this.vyt = null;
        //1D array needed for the Gaussian convolution
        this.expky = null;
    }

    /**
     * Function used to allocate space for use of the cartogram code.
     * 
     * @param xsize size of the input grid in the x direction. 
     * @param ysize size of the input grid in the y direction.
     */
    cart_makews(xsize,ysize) {

        this.rhot = DCT2.initialize3DArray(5,xsize,ysize);
        this.fftrho = DCT2.initialize2DArray(xsize,ysize);
        this.fftexpt = DCT2.initialize2DArray(xsize,ysize);

        this.vxt = DCT2.initialize3DArray(5,(xsize+1),(ysize+1));
        this.vyt = DCT2.initialize3DArray(5,(xsize+1),(ysize+1));

        this.expky = DCT2.initializeArray(ysize);
        
    }

    /** Function to make space for the density array. USAGE:
     *  cartogramData = cart_dmalloc(512,1024);
     *  then readPop(cartogramData) - some method that'll read the data 
     *  from a file into cartogramData.
     */
    cart_dmalloc(xsize,ysize) {
        return DCT2.initialize2DArray(xsize,ysize);
    }

    /** Function to calculate the discrete cosine transform of the input data.
    * inputs are of type 2d array,int and int.
    * Usage: cartogramData = cart_transform(cartogramData,xsize,ysize).
    */
    cart_transform(userrho){
        this.fftrho = DCT2.performDCT2(userrho);
    }

    /**Function to do the transformation of a given set of points to the
     * cartogram. Inputs are of type 1D array, 1D array, int, int, int, double.
     */
    cart_makecart(pointx, pointy, npoints, xsize, ysize, blur) {
        var s,t,h,desiredratio = null;
        this.drp = 9999999999999999;
        this.errorp = null;
        this.spp = null;
        //calculate initial density and velocity for snapshot zero
        this.cart_density(0.0,0,xsize,ysize);

        this.cart_vgrid(0,xsize,ysize);
        s = 0;
        
        /* Now integrate the points in the polygons */

        t = 0.5*blur*blur;
        h = INITH;

        while(this.drp>0.0) {

            /* Do a combined triple integration step */

            //error,dr and sp both need to be passed by reference which is not possible in node.js unless
            //stored as a class variable.
            var tup = this.cart_twosteps(pointx,pointy,npoints,t,h,s,xsize,ysize);
            pointx = tup[0];
            pointy = tup[1];
            
            /* Increase the time by 2h and rotate snapshots */

            t += 2.0*h;
            s = this.spp;

            desiredratio = Math.pow(2*TARGETERROR/this.errorp,0.2);
            if(desiredratio>MAXRATIO) {
                h *= MAXRATIO;
            } else {
                h *= desiredratio;
            }
        }
        return [pointx,pointy];
    }

    /** Function to calaculate the population density of the cartogram
     * at an arbitrary time. Parameters are of type double, int,int and int. 
     */
    cart_density(t,s,xsize,ysize) {
        var ix,iy,kx,ky,expkx = null;
        
        for(iy=0; iy<ysize; iy++) {
            ky = Math.PI*iy/ysize;
            this.expky[iy] = Math.exp(-ky*ky*t);
        }
        
        for(ix=0; ix<xsize;ix++) {
            kx = Math.PI*ix/xsize;
            expkx = Math.exp(-kx*kx*t);
            
            for (iy=0; iy<ysize; iy++) {
                this.fftexpt[ix][iy] = expkx*this.expky[iy]*this.fftrho[ix][iy];
            }
        }
        
        //Perform iDCT
        /*make plans for the back transforms*/
        //Using the iDCT
        
        var temp = DCT2.performiDCT2(this.fftexpt);
        this.rhot[s] = temp;
        
    }

    /** Function to calulate the velocity at all integer grid points for a 
     *  specified snapshot. Parameters are all of type int.
     */
    cart_vgrid(s,xsize,ysize) {
        var ix,iy,r00,r10,r01,r11,mid = null;

        /* Do the corners */

        this.vxt[s][0][0] = this.vyt[s][0][0] = 0;
        this.vxt[s][xsize][0] = this.vyt[s][xsize][0] = 0;
        this.vxt[s][0][ysize] = this.vyt[s][0][ysize] = 0.0;
        this.vxt[s][xsize][ysize] = this.vyt[s][xsize][ysize] = 0.0;

        /* Do the top border */

        r11 = this.rhot[s][0][0];
        for (ix=1; ix<xsize;ix++) {
            r01 = r11;
            r11 = this.rhot[s][ix][0];
            this.vxt[s][ix][0] = -2*(r11-r01)/(r11+r01);
            this.vyt[s][ix][0] = 0.0;
        }

        /* Do the bottom border */

        r10 = this.rhot[s][0][(ysize-1)];
        for(ix=1;ix<xsize;ix++) {
            r00 = r10;
            r10 = this.rhot[s][ix][ysize-1];
            this.vxt[s][ix][ysize] = -2*(r10-r00)/(r10+r00);
            this.vyt[s][ix][ysize] = 0.0;
        }

        /* Do the left edge */

        r11 = this.rhot[s][0][0];
        for (iy=1;iy<ysize;iy++) {
            r10 = r11;
            r11 = this.rhot[s][0][iy];
            this.vxt[s][0][iy] = 0.0;
            this.vyt[s][0][iy] = -2*(r11-r10)/(r11+r10);
        }

        /* Do the right edge */
        r01 = this.rhot[s][(xsize-1)][0];
        for(iy=1;iy<ysize;iy++) {
            r00 = r01;
            r01 = this.rhot[s][(xsize-1)][iy];
            this.vxt[s][xsize][iy] = 0.0;
            this.vyt[s][xsize][iy] = -2*(r01-r00)/(r01+r00);
        }

        /* Now do all the points in the middle */

        for(ix=1;ix<xsize;ix++) {
            r01 = this.rhot[s][(ix-1)][0];
            r11 = this.rhot[s][ix][0];
            for (iy=1;iy<ysize;iy++) {
                r00 = r01;
                r10 = r11;
                r01 = this.rhot[s][(ix-1)][iy];
                r11 = this.rhot[s][ix][iy];
                mid = r10 + r00 + r11 + r01;
                this.vxt[s][ix][iy] = -2*(r10-r00+r11-r01)/mid;
                this.vyt[s][ix][iy] = -2*(r01-r00+r11-r10)/mid;
            }
        }
    }

    /**
     * Function to perform the 2h integration.
     * 
     * @param {array} pointx - array of x-coords of points
     * @param {array} pointy - array of y-coords of points
     * @param {int} npoints - number of points
     * @param {int} t - current time i.e start time of these two steps
     * @param {int} h - delta h
     * @param {int} s - snapshot index of the initial time.
     * @param {int} xsize - size of grid
     * @param {int} ysize - size of grid
     */
    cart_twosteps(pointx,pointy,npoints,t,h,s,xsize,ysize) {
        //for drp,errorp and spp use this
        var s0,s1,s2,s3,s4;
        var p;
        var rx1,ry1;
        var rx2,ry2;
        var rx3,ry3;
        var v1x,v1y;
        var v2x,v2y;
        var v3x,v3y;
        var v4x,v4y;
        var k1x,k1y;
        var k2x,k2y;
        var k3x,k3y;
        var k4x,k4y;
        var dx1,dy1;
        var dx2,dy2;
        var dx12,dy12;
        var dxtotal,dytotal;
        var ex,ey;
        var esq,esqmax;
        var drsq,drsqmax;

        s0 = s;
        s1 = (s+1)%5;
        s2 = (s+2)%5;
        s3 = (s+3)%5;
        s4 = (s+4)%5;

        this.cart_density(t+0.5*h,s1,xsize,ysize);
        this.cart_density(t+1.0*h,s2,xsize,ysize);
        this.cart_density(t+1.5*h,s3,xsize,ysize);
        this.cart_density(t+2.0*h,s4,xsize,ysize);

        this.cart_vgrid(s1,xsize,ysize);
        this.cart_vgrid(s2,xsize,ysize);
        this.cart_vgrid(s3,xsize,ysize);
        this.cart_vgrid(s4,xsize,ysize);

        esqmax = drsqmax = 0;

        for(p=0;p<npoints;p++) {
            rx1 = pointx[p];
            ry1 = pointy[p];

            var tup = this.cart_velocity(rx1,ry1,s0,xsize,ysize);
            v1x = tup[0];
            v1y = tup[1];
            k1x = 2*h*v1x;
            k1y = 2*h*v1y;
            tup = this.cart_velocity((rx1+0.5*k1x),(ry1+0.5*k1y),s2,xsize,ysize);
            v2x = tup[0];
            v2y = tup[1];
            k2x = 2*h*v2x;
            k2y = 2*h*v2y;
            tup = this.cart_velocity((rx1+0.5*k2x), (ry1+0.5*k2y),s2,xsize,ysize);
            v3x = tup[0];
            v3y = tup[1];
            k3x = 2*h*v3x;
            k3y = 2*h*v3y;
            tup = this.cart_velocity((rx1+k3x),(ry1+k3y),s4,xsize,ysize);
            v4x = tup[0];
            v4y = tup[1];
            k4x = 2*h*v4x;
            k4y = 2*h*v4y;

            dx12 = (k1x+k4x+2.0*(k2x+k3x))/6.0;
            dy12 = (k1y+k4y+2.0*(k2y+k3y))/6.0;

            k1x = h*v1x;
            k1y = h*v1y;
            tup = this.cart_velocity((rx1+0.5*k1x),(ry1+0.5*k1y),s1,xsize,ysize);
            v2x = tup[0];
            v2y = tup[1];
            k2x = h*v2x;
            k2y = h*v2y;
            tup = this.cart_velocity((rx1+0.5*k2x),(ry1+0.5*k2y),s1,xsize,ysize);
            v3x = tup[0];
            v3y = tup[1];
            k3x = h*v3x;
            k3y = h*v3y;
            tup = this.cart_velocity(rx1+k3x,ry1+k3y,s2,xsize,ysize);
            v4x = tup[0];
            v4y = tup[1];
            k4x = h*v4x;
            k4y = h*v4y;

            dx1 = (k1x+k4x+2.0*(k2x+k3x))/6.0;
            dy1 = (k1y+k4y+2.0*(k2y+k3y))/6.0;


            rx2 = rx1 + dx1;
            ry2 = ry1 + dy1;

            tup = this.cart_velocity(rx2,ry2,s2,xsize,ysize);
            v1x = tup[0];
            v1y = tup[1];
            k1x = h*v1x;
            k1y = h*v1y;
            tup = this.cart_velocity((rx2+0.5*k1x),(ry2+0.5*k1y),s3,xsize,ysize);
            v2x = tup[0];
            v2y = tup[1];
            k2x = h*v2x;
            k2y = h*v2y;
            tup = this.cart_velocity(rx2+0.5*k2x,ry2+0.5*k2y,s3,xsize,ysize);
            v3x = tup[0];
            v3y = tup[1];
            k3x = h*v3x;
            k3y = h*v3y;
            tup = this.cart_velocity(rx2+k3x,ry2+k3y,s4,xsize,ysize);
            v4x = tup[0];
            v4y = tup[1];
            k4x = h*v4x;
            k4y = h*v4y;

            dx2 = (k1x+k4x+2.0*(k2x+k3x))/6.0;
            dy2 = (k1y+k4y+2.0*(k2y+k3y))/6.0;

            ex = (dx1+dx2-dx12)/15;
            ey = (dy1+dy2-dy12)/15;
            esq = ex*ex + ey*ey;
            if (esq>esqmax) {
                esqmax = esq;
            }

            dxtotal = dx1 + dx2 + ex;   // Last term is local extrapolation
            dytotal = dy1 + dy2 + ey;   // Last term is local extrapolation
            drsq = dxtotal*dxtotal + dytotal*dytotal;

            if (drsq>drsqmax) {
                drsqmax = drsq;
            }

            rx3 = rx1 + dxtotal;
            ry3 = ry1 + dytotal;

            if (rx3<0) {
                rx3 = 0;
            } else if (rx3>xsize) {
                rx3 = xsize;
            }

            if (ry3<0) {
                ry3 = 0;
            } else if (ry3>ysize) {
                ry3 = ysize;
            } 

            pointx[p] = rx3;
            pointy[p] = ry3;
        }

        this.errorp = Math.sqrt(esqmax);
        this.drp = Math.sqrt(drsqmax);
        this.spp = s4;
        return [pointx,pointy];
    }

    /* 
     * Function to calculate velocity. Note return type is an array containing the two values to be stored.
     * As newmann's code requires a variable being passed by reference which is not possible in Node.js
     */
    cart_velocity(rx,ry,s,xsize,ysize) {
        var ix,iy,dx,dy,dxlm,dylm,w11,w21,w12,w22;

        ix = rx;
        if(ix<0) {
            ix = 0;
        } else if(ix>=xsize) {
            ix = xsize - 1;
        }

        iy = ry;
        if(iy<0) {
            iy=0;
        } else if(iy>=ysize) {
            iy = ysize - 1;
        }

        dx = rx - ix;
        dy = ry - iy;

        dxlm = 1 - dx;
        dylm = 1 - dy;

        w11 = dxlm*dylm;
        w21 = dx*dylm;
        w12 = dxlm*dy;
        w22 = dx*dy;

        ix = Math.round(ix);
        iy = Math.round(iy);
        var vxp = w11*this.vxt[s][ix][iy] + w21*this.vxt[s][ix+1][iy] +
                  w12*this.vxt[s][ix][iy+1] + w22*this.vxt[s][ix+1][iy+1];

        var vyp = w11*this.vyt[s][ix][iy] + w21*this.vyt[s][ix+1][iy] +
                  w12*this.vyt[s][ix][iy+1] + w22*this.vyt[s][ix+1][iy+1];


        return [vxp,vyp];
    }
}


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
var xsize = 5;
var ysize = 5;
var inputTestData = DCT2.initialize2DArray(xsize,ysize);

//assign the test data
for (var i=0;i<xsize;i++) {
    for (var j=0;j<ysize;j++) {
        inputTestData[i][j] = (i+1)*(j+1);
    }
}


//var test = new GastnerNewmann();
//Do the various stages as stated in the documentation of cart.c
//test.cart_makews(xsize,ysize);
//test.cart_transform(inputTestData,xsize,ysize);
//fftrho remember is where the output of the DCT of the input data is stored.
//var temp = creategrid(xsize,ysize);
//var gridx = temp[0];
//var gridy = temp[1];
//var tup = test.cart_makecart(gridx,gridy,(xsize+1)*(ysize+1),xsize,ysize,0);

//gridx = tup[0];
//gridy = tup[1];
//for(var i =0;i<gridx.length;i++) {
    //console.log(gridx[i],gridy[i]);
//}
module.exports = GastnerNewmann;