function draw(xmin = -2.5, xmax = 1, ymin = -1.75, ymax = 1.75, colormap=null, scaleFactor=1){
    // alert('Draw Called')
    let canvas = document.getElementById('drawingCanvas')
    if (canvas.getContext){
        let t1 = Date.now()
        let ctx = canvas.getContext('2d');
        // canvas.style.width = window.innerWidth;
        // canvas.style.height = window.innerHeight;
        // console.log(0,canvas.style.width, canvas.style.height, canvas.width, canvas.height, window.innerWidth, window.innerHeight, scaleFactor);
        // canvas.width = Math.ceil(scaleFactor*window.innerWidth);
        // canvas.height = Math.ceil(scaleFactor*window.innerHeight);

        let rem = parseFloat(window.getComputedStyle(canvas).fontSize);

        canvas.height = window.innerHeight-3.5*rem;
        canvas.width = window.innerWidth*0.75;

        // console.log(0,canvas.style.width, canvas.style.height, canvas.width, canvas.height, window.innerWidth, window.innerHeight, scaleFactor);


        let numPixels = canvas.height*canvas.width;
        let w = canvas.width;
        let h = canvas.height;
        console.log("canvas dimensions:",w,h,w*h,numPixels)
        let x=0;
        let y=0;
        let deltax=xmax-xmin;
        let deltay=ymax-ymin;
        let escapeVal=0;
        let escapeValArray = new Float32Array(numPixels);
        let imageDataArray = new Uint8ClampedArray(4*numPixels);
        let counter=0;

        let colormapLength = colormap ? colormap.length : 0;
        // console.log('loop 1 started');
        for (let i=0; i<h; i++){
            for (let j=0; j<w; j++){
            x = xmin + deltax*j/w;
            y = ymax - deltay*i/h;
            // console.log(x,y);
            escapeVal = distanceEstimation(x, y);
            // escapeVal = naive_mandelbrot(x,y);
            if (isNaN(escapeVal)){//can happen if derivative tends to infinity
                console.log('NaN at i = ', i,', j =',j, 'x,y', x, y);
                // distanceEstimation(x, y, verbose=true)
                escapeVal = 0;
            }
            escapeValArray[i*w+j]=escapeVal;
        }}

        // console.log("loop 1 finished")
        let t2 = Date.now()
        console.log(escapeValArray)
        let minVal = 10**-15;
        escapeValArray = escapeValArray.map(x => -Math.log(Math.max(x,minVal)));
        console.log(escapeValArray);
        maxEscapeVal = escapeValArray.reduce(function(a, b) {
            return Math.max(a, b);
        });
        minEscapeVal = escapeValArray.reduce(function(a, b) {
            return Math.min(a, b);
        });

        console.log("escape val max min", maxEscapeVal, minEscapeVal)
        for (let i=0; i<numPixels; i++){
            x = (escapeValArray[i]-minEscapeVal)/(maxEscapeVal-minEscapeVal);
            if (colormap){
                let idx = Math.min(Math.floor(colormapLength*x),colormapLength-1);
                let color = colormap[idx][1];
                // console.log(123456,x, colormapLength, idx, color);
                // asdf
                imageDataArray[4*i] = Math.floor(255*color[0]);
                imageDataArray[4*i+1] = Math.floor(255*color[1]);
                imageDataArray[4*i+2] = Math.floor(255*color[2]);
                imageDataArray[4*i+3] = 255;                    
            }
            else{
            imageDataArray[4*i] = Math.floor(x*255);
            imageDataArray[4*i+1] = Math.floor(x*255);
            imageDataArray[4*i+2] = Math.floor(x*255);
            imageDataArray[4*i+3] = 250;
            }
        }
        console.log('loops finished')
        convertedData = new ImageData(imageDataArray, canvas.width, canvas.height);
        console.log(convertedData)
        ctx.putImageData(convertedData, 0, 0);
        // ctx.fillStyle = 'rgb(255, 0, 0)';
        // ctx.fillRect(10,10,50,50);
        // console.log(t2-t1)
        // console.log(Date.now()-t2)
    }
}
let max_iters = 100;

function naive_mandelbrot(x0, y0){
    if ((x0+1)**2+y0**2 <= 0.0625){
        // console.log(x,y,'central')
        return Math.sqrt(max_iters);
    }
    let q = (x0-0.25)**2 + y0**2;
    if (q*(q+(x0-0.25)) <= 0.25*y0**2){
        // console.log(x,y,'bulb')
        return Math.sqrt(max_iters)
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
            return -k;
        }
    }
    // console.log(x,y,'final')
    return -max_iters;
    
}

function distanceEstimation(x0, y0, verbose=false){
    if ((x0+1)**2+y0**2 <= 0.0625){
        // console.log(x,y,'central')
        return 0;
    }
    let q = (x0-0.25)**2 + y0**2;
    if (q*(q+(x0-0.25)) <= 0.25*y0**2){
        // console.log(x,y,'bulb')
        return 0;
    }
    let maxIters=10000;
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
        // if (dx>10**100 || dy>10**100){
        //     // if gradient is diverging, must be very close to the edge of the set
        //     // and gradient will explode to NaN if not caught
        //     return 0;
        // }

    }
    let absz = Math.sqrt(xs+ys);
    let absdz = Math.sqrt(dx**2+dy**2);
    return absz*Math.log(absz)/absdz; 

}

function main(){
    let xmin = -2.25;
    let xmax = 0.75;
    let ymin = -1.5;
    let ymax = 1.5;
    colormap = null;

    let ctrlcanvas = document.getElementById('controlCanvas');
    let ctx = ctrlcanvas.getContext('2d');
    let rem = parseFloat(window.getComputedStyle(ctrlcanvas).fontSize);
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    let mouseDownX = 0;
    let mouseDownY = 0;
    let canvasClicked = false;
    ctrlcanvas.onmousedown = function(event){
        mouseDownX = event.clientX - 0.25*window.innerWidth;
        mouseDownY = event.clientY - 3.5*rem;
        canvasClicked = true;
    }


    ctrlcanvas.onmousemove = function(event){
        if (canvasClicked){
            if (ctrlcanvas.getContext){
                let ctx = ctrlcanvas.getContext('2d');
                ctx.strokeStyle = 'red'; //  TODO made this depend to colormap
                ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
                let currentX = event.clientX - 0.25*window.innerWidth; 
                let currentY = event.clientY - 3.5*rem;
                ctx.strokeRect(mouseDownX, mouseDownY, currentX-mouseDownX, currentY-mouseDownY);
            }
        }
    }

    ctrlcanvas.onmouseup = function(event){
        if (canvasClicked){
            canvasClicked = false;
            if (ctrlcanvas.getContext){

                let ctx = ctrlcanvas.getContext('2d')
                ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
                let mouseUpX = event.clientX - 0.25*window.innerWidth;
                let mouseUpY = event.clientY - 3.5*rem;
                console.log(mouseDownX, mouseUpX, mouseDownY, mouseUpY);

                let canvasWidth = 0.75*window.innerWidth;
                let canvasHeight = window.innerHeight - 3.5*rem;
                
                let fractionalMinX = Math.min(mouseDownX, mouseUpX)/canvasWidth;
                let fractionalMaxX = Math.max(mouseDownX, mouseUpX)/canvasWidth;
                let fractionalMinY = Math.min(mouseDownY, mouseUpY)/canvasHeight;
                let fractionalMaxY = Math.max(mouseDownY, mouseUpY)/canvasHeight;
                console.log(fractionalMinX, fractionalMaxX, fractionalMinY, fractionalMaxY);

                let xminTemp = xmin + fractionalMinX*(xmax-xmin);
                let xmaxTemp = xmin + fractionalMaxX*(xmax-xmin);
                let yminTemp = ymax - fractionalMaxY*(ymax-ymin);
                let ymaxTemp = ymax - fractionalMinY*(ymax-ymin);
                console.log(xmin, xmax, ymin, ymax);

                xmin = xminTemp;
                xmax = xmaxTemp;
                ymin = yminTemp;
                ymax = ymaxTemp;
                console.log(xmin, xmax, ymin, ymax);
                draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=0.5)
                draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=2.0);
            }
        }
        }
    // draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=0.1);
    draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=2);
}