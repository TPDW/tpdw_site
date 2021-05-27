onmessage = function(e){
    console.log('message recieved');
    // [xmin,ymax,deltax,deltay,w,h]
    let xmin = e.data[0];
    let xmax = e.data[1];
    let ymin = e.data[2];
    let ymax = e.data[3];
    let w = e.data[4];
    let h = e.data[5];
    let j = e.data[6];
    let useDistanceEstimation = e.data[7];

    let numPixels = w*h;
    let escapeValArray = new Float32Array(numPixels);
    // let imageDataArray = new Uint8ClampedArray(4*numPixels);
    let deltax=xmax-xmin;
    let deltay=ymax-ymin;

    let numLdBarUpdates = 25;
    let ldBarUpdateInterval = Math.floor(h/numLdBarUpdates);
    ldBarUpdateInterval = Math.min(ldBarUpdateInterval,1);

    console.log("worker", j, ldBarUpdateInterval,h)

    for (let i=0; i<h; i++){
        if (i % ldBarUpdateInterval == 0){
            postMessage(["update",ldBarUpdateInterval]);
        }
        for (let j=0; j<w; j++){
            let x = xmin + deltax*j/w;
            let y = ymax - deltay*i/h;
            let escapeVal = distanceEstimation(x, y);

            if (useDistanceEstimation){
            escapeVal = distanceEstimation(x, y);
            }
            else {
            escapeVal = naive_mandelbrot(x,y);
            }
            if (isNaN(escapeVal)){//can happen if derivative tends to infinity
                console.log('NaN at i = ', i,', j =', j, 'x,y', x, y);
                // distanceEstimation(x, y, verbose=true)
                escapeVal = 0;
            }
            escapeValArray[i*w+j]=escapeVal;


        }
    }
    postMessage([j,escapeValArray]);
}
function distanceEstimation(x0, y0){
    if ((x0+1)**2+y0**2 <= 0.0625){
        // console.log(x,y,'central')
        return 0;
    }
    let q = (x0-0.25)**2 + y0**2;
    if (q*(q+(x0-0.25)) <= 0.25*y0**2){
        // console.log(x,y,'bulb')
        return 0;
    }
    let maxIters=1000;
    let x=0;
    let y=0;
    let dx=1;
    let dy=0;
    let dxTemp=0;
    let xTemp=0;
    let xs=0;
    let ys=0;
    for (let k=0; k<maxIters; k++){
        dxTemp = 2*(x*dx - y*dy) + 1;
        dy = 2*(x*dy + dx*y);
        dx=dxTemp;
        xTemp = xs-ys + x0;
        y = 2*x*y + y0;
        x = xTemp;
        xs = x*x;
        ys = y*y;

        if (xs+ys>4){
            break
        }
    }
    let absz = Math.sqrt(xs+ys);
    let absdz = Math.sqrt(dx**2+dy**2);
    return absz*Math.log(absz)/absdz; 

}

function naive_mandelbrot(x0, y0){
    if ((x0+1)**2+y0**2 <= 0.0625){
        // console.log(x,y,'central')
        return max_iters;
    }
    let q = (x0-0.25)**2 + y0**2;
    if (q*(q+(x0-0.25)) <= 0.25*y0**2){
        // console.log(x,y,'bulb')
        return max_iters;
    }
    let z_x=0;
    let z_y=0;
    let z_x_temp=0;
    for (let k=0; k<max_iters; k++){
        z_x_temp = z_x**2 - z_y**2 + x0;
        z_y = 2*z_x*z_y + y0;
        z_x = z_x_temp;
        if (z_x**2+z_y**2>4){
            // console.log(x,y,'escape')
            return k;
        }
    }
    // console.log(x,y,'final')
    return max_iters;
    
}