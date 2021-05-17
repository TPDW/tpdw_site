function getColormap(){
    let colormapSelector = document.getElementById('colorMap');
    let colormapString = colormapSelector.options[colormapSelector.selectedIndex].value;
    console.log("get colormap ", colormapString);
    if (colormapString == 'null'){return null;}
    return window[colormapString];
}

function getScaleFactor(){
    let scaleFactorSelector = document.getElementById('dpi');
    return scaleFactorSelector.value;
}

function getCanvasAspectRatio(){
    return (window.innerWidth*0.75)/(window.innerHeight-3.5*rem);
}

function getAspectRatioPreserved(){
    let aspectRatioSelector = document.getElementById('aspectRatio');
    console.log(aspectRatioSelector.checked)
    return aspectRatioSelector.checked
}

function getUseDistanceEstimation(){
    let distanceEstimationSelector = document.getElementById('distanceEstimation');
    return distanceEstimationSelector.checked
}

function getDisplayCoordinates(){
    let displayCoordinatesSelector = document.getElementById('displayCoordinates')
    return displayCoordinatesSelector.checked
}

function getArgandXYCoordinatesFromMouse(screenX, screenY){
    // NB may get confusing with notation
    // this gets the xy coordinates on the argand plane
    // from the xy coordinates on the screen
    // console.log(screenX, screenY);
    let argandX = xmin + screenX*0.75*(xmax-xmin);
    let argandY = ymax - (screenY)*(ymax-ymin);
    // console.log("argand", screenX, screenY, argandX, argandY);
    return [argandX, argandY];
    

}
let numCores = window.navigator.hardwareConcurrency;
let workerArray = new Array(numCores);
let escapeValMetaArray = new Array(numCores);
let workerReturnedArray = new Array(numCores);

    
workerDataProcess = function(e){
    console.log('processing worker output');
    let i = e.data[0];
    escapeValMetaArray[i] = e.data[1];
    workerReturnedArray[i]=1;

    if (workerReturnedArray.reduce((a,b) => a+b, 0) == numCores){
        console.log("all loops returned, reconstructing image");

    let canvas = document.getElementById('canvas_test')
    if (canvas.getContext){
        let lengths = escapeValMetaArray.map( a => a.length);
        let totalLength = lengths.reduce((a,b) => a+b,0);
        console.log(totalLength)
        let escapeValArray = new Float32Array(totalLength);
        let offset = 0;
        for (let i=0;i<numCores; i++){
            escapeValArray.set(escapeValMetaArray[i],offset);
            offset += escapeValMetaArray[i].length;
            console.log(offset);
        }
        ctx = canvas.getContext('2d');
        console.log(escapeValArray);
        console.log(escapeValMetaArray);
        let numPixels = escapeValArray.length;
        let imageDataArray = new Uint8ClampedArray(4*numPixels);
        let minVal = 10**-15;
        escapeValArray = escapeValArray.map(x => -Math.log(Math.max(x,minVal)));
        maxEscapeVal = escapeValArray.reduce(function(a, b) {
            return Math.max(a, b);
        });
        minEscapeVal = escapeValArray.reduce(function(a, b) {
            return Math.min(a, b);
        });

        colormap = getColormap();

        for (let i=0; i<numPixels; i++){
            x = (escapeValArray[i]-minEscapeVal)/(maxEscapeVal-minEscapeVal);
            if (colormap){
                let idx = Math.min(Math.floor(colormapLength*x),colormapLength-1);
                let color = colormap[idx][1];

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

        console.log('images merged')
        console.log(imageDataArray);
        convertedData = new ImageData(imageDataArray, canvas.width, canvas.height);
        console.log(convertedData)
        ctx.putImageData(convertedData, 0, 0);
    }
    }
}

let workerUrl = document.getElementById('mandelbrotWorkerUrl').innerHTML
for (let i=0; i<numCores; i++) {
    workerArray[i] = new Worker(workerUrl);
    workerArray[i].onmessage = workerDataProcess;
    workerReturnedArray[i]=0;
}



function draw(xmin = -2.5, xmax = 1, ymin = -1.75, ymax = 1.75, scaleFactor=null){
    // alert('Draw Called')
    let canvas = document.getElementById('drawingCanvas')
    if (canvas.getContext){   
        useDistanceEstimation = getUseDistanceEstimation();

        canvas.style.height = window.innerHeight-3.5*rem + 'px';
        canvas.style.width = window.innerWidth*0.75 + 'px';

        scaleFactor = scaleFactor ?? getScaleFactor();

        canvas.height = (window.innerHeight-3.5*rem)*scaleFactor;
        canvas.width = window.innerWidth*0.75*scaleFactor;

        console.log(0,canvas.style.width, canvas.style.height, canvas.width, 
            canvas.height, window.innerWidth, window.innerHeight, scaleFactor);

        let numPixels = canvas.height*canvas.width;
        let w = canvas.width;
        let h = canvas.height;
        console.log("canvas dimensions:",w,h,w*h,numPixels)
        let x=0;
        let y=0;
        let deltax=xmax-xmin;
        let deltay=ymax-ymin;

        console.log('posting messages');
        for (let i=0; i<numCores; i++){
            console.log('posting message ' + i);
            workerReturnedArray[i]=0;
            let ymax_worker = ymax - i*deltay/numCores;
            let ymin_worker = ymax - (i+1)*deltay/numCores;
            let h_worker;
            if (i == (numCores-1)) {
                h_worker = Math.floor(h/numCores) + h%numCores;
            }
            else{
                h_worker = Math.floor(h/numCores);
            }
            workerArray[i].postMessage([xmin,xmax,ymin_worker,ymax_worker,w,h_worker,i,useDistanceEstimation]);
        }

        // for (let i=0; i<h; i++){
        //     // I think I'd have to rewrite this recursively to get a loading bar to work
        //     // and how that could be parallelised I do not know
            
        //     // ctrlCtx.clearRect(0,0,ctrlCtx.canvas.width,ctrlCtx.canvas.height);
        //     // ctrlCtx.beginPath();
        //     // ctrlCtx.arc(xMid, yMid, 25, 0, 2*Math.PI*i/h);
        //     // ctrlCtx.fill();
        //     // alert(1)
        //     ld.ldBar.set(100*i/h);
        //     // setTimeout("",0);
        //     for (let j=0; j<w; j++){
        //     x = xmin + deltax*j/w;
        //     y = ymax - deltay*i/h;
        //     // console.log(x,y);
        //     if (useDistanceEstimation){
        //     escapeVal = distanceEstimation(x, y);
        //     }
        //     else {
        //     escapeVal = naive_mandelbrot(x,y);
        //     }
        //     if (isNaN(escapeVal)){//can happen if derivative tends to infinity
        //         console.log('NaN at i = ', i,', j =', j, 'x,y', x, y);
        //         // distanceEstimation(x, y, verbose=true)
        //         escapeVal = 0;
        //     }
        //     escapeValArray[i*w+j]=escapeVal;
        // }}
        // // ctrlCtx.clearRect(0,0,ctrlCtx.canvas.width,ctrlCtx.canvas.height);
        // // console.log("loop 1 finished")
        // let t2 = Date.now()
        // console.log(escapeValArray)
        // let minVal = 10**-15;
        // if (useDistanceEstimation){
        // escapeValArray = escapeValArray.map(x => -Math.log(Math.max(x,minVal)));
        // }
        // console.log(escapeValArray);
        // maxEscapeVal = escapeValArray.reduce(function(a, b) {
        //     return Math.max(a, b);
        // });
        // minEscapeVal = escapeValArray.reduce(function(a, b) {
        //     return Math.min(a, b);
        // });

        // console.log("escape val max min", maxEscapeVal, minEscapeVal)
        // for (let i=0; i<numPixels; i++){
        //     ld.ldBar.set(100*i/numPixels);
        //     x = (escapeValArray[i]-minEscapeVal)/(maxEscapeVal-minEscapeVal);
        //     if (colormap){
        //         let idx = Math.min(Math.floor(colormapLength*x),colormapLength-1);
        //         let color = colormap[idx][1];
        //         // console.log(123456,x, colormapLength, idx, color);
        //         // asdf
        //         imageDataArray[4*i] = Math.floor(255*color[0]);
        //         imageDataArray[4*i+1] = Math.floor(255*color[1]);
        //         imageDataArray[4*i+2] = Math.floor(255*color[2]);
        //         imageDataArray[4*i+3] = 255;                    
        //     }
        //     else{
        //     imageDataArray[4*i] = Math.floor(x*255);
        //     imageDataArray[4*i+1] = Math.floor(x*255);
        //     imageDataArray[4*i+2] = Math.floor(x*255);
        //     imageDataArray[4*i+3] = 250;
        //     }
        // }
        // ld.style.zIndex = 0;
        // console.log('loops finished')
        // convertedData = new ImageData(imageDataArray, canvas.width, canvas.height);
        // console.log(convertedData)
        // ctx.putImageData(convertedData, 0, 0);
        // // ctx.fillStyle = 'rgb(255, 0, 0)';
        // // ctx.fillRect(10,10,50,50);
        // console.log(t2-t1)
        // console.log(Date.now()-t2)
    }
}

let xmin = -2.25;
let xmax = 0.75;
let ymin = -1.5;
let ymax = 1.5;
let colormap = null;
let mainCanvasAspectRatio = null;
let aspectRatioPreserved = null;
let rem = parseFloat(window.getComputedStyle(document.getElementById('canvasContainer')).fontSize);


let useDistanceEstimation = false;
let displayCoordinates = true;
function main(){
    let ctrlcanvas = document.getElementById('controlCanvas');
    let ctx = ctrlcanvas.getContext('2d');
    let rem = parseFloat(window.getComputedStyle(ctrlcanvas).fontSize);
    ctx.canvas.width = window.innerWidth*0.75;
    ctx.canvas.height = window.innerHeight - 3.5*rem;
    let mouseDownX = 0;
    let mouseDownY = 0;
    let canvasClicked = false;

    let coordCanvas = document.getElementById('coordinateCanvas');
    ctx = coordCanvas.getContext('2d');
    ctx.canvas.width = window.innerWidth*0.75;
    ctx.canvas.height = window.innerHeight - 3.5*rem;


    ctrlcanvas.onmouseover = function(event){


    }

    ctrlcanvas.onmousedown = function(event){
        mouseDownX = event.clientX - 0.25*window.innerWidth;
        mouseDownY = event.clientY - 3.5*rem;
        canvasClicked = true;
        aspectRatioPreserved =  getAspectRatioPreserved();
        mainCanvasAspectRatio = getCanvasAspectRatio();
    }


    ctrlcanvas.onmousemove = function(event){
        if (canvasClicked){
            if (ctrlcanvas.getContext){
                let ctx = ctrlcanvas.getContext('2d');
                ctx.strokeStyle = 'red'; //  TODO made this depend on colormap
                ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height)
                let currentX = event.clientX - 0.25*window.innerWidth; 
                let currentY = event.clientY - 3.5*rem;
                if (aspectRatioPreserved){
                    let boxSize = Math.max((currentX-mouseDownX), (currentY-mouseDownY)*mainCanvasAspectRatio);
                    ctx.strokeRect(mouseDownX, mouseDownY, boxSize, boxSize);
                    // console.log(mouseDownX, mouseDownY,currentX,currentY,mouseDownX+boxSize, mouseDownY+boxSize,boxSize, mainCanvasAspectRatio);
                }
                else{
                ctx.strokeRect(mouseDownX, mouseDownY, currentX-mouseDownX, currentY-mouseDownY);
                }
            }
        }
        if (getDisplayCoordinates()){
            if (coordCanvas.getContext){
                // console.log('mouseover');
                let ctx = coordCanvas.getContext('2d');
                ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);
                let xCoord = 0;
                let yCoord = 0;
                let coordString;
                [xCoord, yCoord] = getArgandXYCoordinatesFromMouse(event.clientX/ctx.canvas.width, event.clientY/ctx.canvas.height);
                // console.log(xCoord, yCoord, event.clientX, event.clientY);
                if (yCoord > 0){
                coordString = "z = " + xCoord.toExponential(3) + " + " + yCoord.toExponential(3) + "i";
                }
                else{
                coordString = "z = " + xCoord.toExponential(3) + " - " + (-yCoord).toExponential(3)+ "i";
                }
                // console.log(coordString)
                ctx.font = '48px serif'
                ctx.fillStyle = 'white'
                ctx.fillText(coordString,10,40);
                ctx.strokeText(coordString,10,40);


            }   
        }
    }

    ctrlcanvas.onmouseout = function(event){
        if (coordCanvas.getContext);
        let ctx = coordCanvas.getContext('2d');
        ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);

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

                if (aspectRatioPreserved){
                    let fractionalDeltaX = fractionalMaxX - fractionalMinX;
                    let fractionalDeltaY = fractionalMaxY - fractionalMinY;
                    let fractionalBoxSize = Math.max(fractionalDeltaX, fractionalDeltaY*mainCanvasAspectRatio);
                    fractionalMaxX = fractionalMinX + fractionalBoxSize;
                    fractionalMaxY = fractionalMinY + fractionalBoxSize;

                }


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
                draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=2.0);
            }
        }
        }
    // draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=0.1);
    draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=1);
}

let button = document.getElementById('drawButton');
button.onclick = function(event){
    draw(xmin, xmax, ymin, ymax);
}
button = document.getElementById('resetButton');
button.onclick = function(event){
xmin = -2.25;
xmax = 0.75;
ymin = -1.5;
ymax = 1.5;
draw(xmin, xmax, ymin, ymax);
}

window.onload = main;