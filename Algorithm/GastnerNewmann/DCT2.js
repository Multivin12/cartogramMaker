class DCT2{

    //Performs the 2D dct taking a 2D array as input
    //Code taken from https://stackoverflow.com/questions/13491895/matlab-create-my-own-dct2
    static performDCT2(_2DArray) {

        var M = DCT2.getNoOfRows(_2DArray);
        var N = DCT2.getNoOfColumns(_2DArray);

        var output = DCT2.initialize2DArray(M,N);
        
        for (var p = 0; p < M; p++) {
            for(var q = 0; q < N; q++) {
                var alphaP = null;
                var alphaQ = null;
                if (p==0) {
                    alphaP = Math.sqrt(1/M);
                } else {
                    alphaP = Math.sqrt(2/M);
                }

                if (q==0) {
                    alphaQ = Math.sqrt(1/N);
                } else {
                    alphaQ = Math.sqrt(2/N);
                }
                

                
                var temp = 0;
                for (var m = 0; m<M; m++) {
                    for (var n = 0; n<N;n++) {
                        temp = temp + (_2DArray[m][n])*(Math.cos((((2*m)+1)*Math.PI*p)/(2*M)) * Math.cos((((2*n)+1)*Math.PI*q)/(2*N)));
                    }
                }
                //to get rid off very low numbers not being recognised as zero
                var result = alphaP*alphaQ*temp;
                var final = Number(result.toFixed(5));
                if (final === -0) {
                    final = 0;
                }
                output[p][q] = final;
            }
        }
        return output;
    }

    //Performs the 2D idct taking a 2D array as input
    static performiDCT2(_2DArray) {

        var M = DCT2.getNoOfRows(_2DArray);
        var N = DCT2.getNoOfColumns(_2DArray);

        var output = DCT2.initialize2DArray(M,N);

        for (var m = 0; m < M; m++) {
            for(var n = 0; n < N; n++) {
                var temp = 0;
                for (var p = 0; p<M; p++) {
                    for (var q = 0; q<N;q++) {
                        var alphaP = null;
                        var alphaQ = null;
                        if (p==0) {
                            alphaP = Math.sqrt(1/M);
                        } else {
                            alphaP = Math.sqrt(2/M);
                        }

                        if (q==0) {
                            alphaQ = Math.sqrt(1/N);
                        } else {
                            alphaQ = Math.sqrt(2/N);
                        }
                
                        temp = temp + alphaP*alphaQ*(_2DArray[p][q])*(Math.cos((((2*m)+1)*Math.PI*p)/(2*M)) * Math.cos((((2*n)+1)*Math.PI*q)/(2*N)));
                    }
                }

                //to get rid off very low numbers not being recognised as zero
                var result = temp;
                var final = Number(result.toFixed(5));
                if (final === -0) {
                    final = 0;
                }
                output[m][n] = final;
            }
        }
        return output;
    }

    //This method is used for getting the number of rows in a 2D Array
    static getNoOfRows(_2DArray) {
        return _2DArray.length;
    }

    //This method is used for getting the number of columns in a 2D Array
    //All arrays in the 2D array must be the same length
    static getNoOfColumns(_2DArray){
        return _2DArray[0].length;
    }

    //This method is used for initializing a 1D array all to zeros
    static initializeArray(i) {
        var _1DArray = [];
        for(var x=0; x<i;x++) {
            _1DArray[x] = 0;
        }
        return _1DArray;
    }

    //This method is used for initializing a 3D array all to zeros
    static initialize3DArray(i,j,k) {
        var _3DArray =[];
        for(var x = 0; x < i; x++) {
            _3DArray[x] = [];
            for(var y = 0; y < j; y++) {
                _3DArray[x][y] = []; 
                for(var z = 0; z < k; z++) {
                    _3DArray [x][y][z] = 0;
                }
            }
        } 
        return _3DArray; 
    }

    //This method is used for initializing a 2D array all to zeros
    static initialize2DArray(i,j) {
        var _2DArray = [];
        for(var x = 0; x < i; x++) {
            _2DArray[x] = [ ];
            for(var y = 0; y < j; y++) {
                _2DArray[x][y] = 0;
            }
        } 
        return _2DArray; 
    }

    //Function to convert from a 2D array into a 1D array
    //parameters are the 2dArray and the dimensions of the 2D array
    static to1DArray(_2DArray,xsize,ysize) {
        var data = DCT2.initializeArray(xsize*ysize);
        for(var i=0;i<xsize;i++) {
            for(var j=0;j<ysize;j++) {
                data[i*ysize+j]=_2DArray[i][j];
            }
        }
        return data;
    }

    //Function to convert from a 1D array into a 2D array
    //The parameters are the 1D array and the dimensions of the desired 2D array.
    static to2DArray(_1DArray,xsize,ysize) {
        var data = DCT2.initialize2DArray(xsize,ysize);
        for(var i=0;i<xsize;i++) {
            for(var j=0;j<ysize;j++) {
                data[i][j]= _1DArray[i*ysize+j];
            }
        }
        return data;
    }



    //Function for transforming an array into a suitable form for ml-fft's ifft
    //parameters are of type array, int and int
    static transformArray(data,xsize,ysize) {

    }
}
module.exports = DCT2;