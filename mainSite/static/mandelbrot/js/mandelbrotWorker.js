/* eslint-disable camelcase */
'use strict';
onmessage = function(e) {
    console.log('message recieved');
    const xmin = e.data[0];
    const xmax = e.data[1];
    const ymin = e.data[2];
    const ymax = e.data[3];
    const w = e.data[4];
    const h = e.data[5];
    const j = e.data[6];
    const useDistanceEstimation = e.data[7];
    const translationParameters = e.data[8];

    const numPixels = w*h;
    const escapeValArray = new Float32Array(numPixels);
    const deltax=xmax-xmin;
    const deltay=ymax-ymin;

    const numLdBarUpdates = 25;
    let ldBarUpdateInterval = Math.floor(h/numLdBarUpdates);
    ldBarUpdateInterval = Math.min(ldBarUpdateInterval, 1);

    console.log('worker', j, ldBarUpdateInterval, h);

    for (let i=0; i<h; i++) {
        if (i % ldBarUpdateInterval == 0) {
            postMessage(['ldBarUpdate', ldBarUpdateInterval]);
        }
        for (let j=0; j<w; j++) {
            const x = xmin + deltax*j/w;
            const y = ymax - deltay*i/h;
            let escapeVal = distanceEstimation(x, y);

            if (useDistanceEstimation) {
                escapeVal = distanceEstimation(x, y);
            } else {
                escapeVal = naiveMandelbrot(x, y);
            }
            if (isNaN(escapeVal)) { // can happen if derivative tends to infinity
                console.log('NaN at i = ', i, ', j =', j, 'x,y', x, y);
                escapeVal = 0;
            }
            escapeValArray[i*w+j]=escapeVal;
        }
    }
    postMessage(['calculationsFinished', j, escapeValArray, translationParameters]);
};
function distanceEstimation(x0, y0) {
    if ((x0+1)**2+y0**2 <= 0.0625) {
        return 0;
    }
    const q = (x0-0.25)**2 + y0**2;
    if (q*(q+(x0-0.25)) <= 0.25*y0**2) {
        return 0;
    }
    const maxIters=1000;
    let x=0;
    let y=0;
    let dx=1;
    let dy=0;
    let dxTemp=0;
    let xTemp=0;
    let xs=0;
    let ys=0;
    for (let k=0; k<maxIters; k++) {
        dxTemp = 2*(x*dx - y*dy) + 1;
        dy = 2*(x*dy + dx*y);
        dx=dxTemp;
        xTemp = xs-ys + x0;
        y = 2*x*y + y0;
        x = xTemp;
        xs = x*x;
        ys = y*y;

        if (xs+ys>4) {
            break;
        }
    }
    const absz = Math.sqrt(xs+ys);
    const absdz = Math.sqrt(dx**2+dy**2);
    return absz*Math.log(absz)/absdz;
}
const maxIters=1000;
function naiveMandelbrot(x0, y0) {
    if ((x0+1)**2+y0**2 <= 0.0625) {
        return maxIters;
    }
    const q = (x0-0.25)**2 + y0**2;
    if (q*(q+(x0-0.25)) <= 0.25*y0**2) {
        return maxIters;
    }
    let z_x=0;
    let z_y=0;
    let z_x_temp=0;
    for (let k=0; k<maxIters; k++) {
        z_x_temp = z_x**2 - z_y**2 + x0;
        z_y = 2*z_x*z_y + y0;
        z_x = z_x_temp;
        if (z_x**2+z_y**2>4) {
            return k;
        }
    }
    return maxIters;
}
