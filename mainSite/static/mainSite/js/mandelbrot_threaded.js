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
    // console.log(aspectRatioSelector.checked)
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
    if (e.data[0]=="update"){
        ld = document.getElementById('ldBar');
        linesProcessed += e.data[1];
        // console.log("lines",linesProcessed,totalLines)
        ld.ldBar.set(linesProcessed*100/totalLines);
    }
    else{
    console.log('processing worker output');
    let i = e.data[0];
    escapeValMetaArray[i] = e.data[1];
    workerReturnedArray[i]=1;

    if (workerReturnedArray.reduce((a,b) => a+b, 0) == numCores){
        console.log("all loops returned, reconstructing image");

    let canvas = document.getElementById('drawingCanvas')
    if (canvas.getContext){
        let lengths = escapeValMetaArray.map( a => a.length);
        let totalLength = lengths.reduce((a,b) => a+b,0);
        console.log(totalLength)
        console.log(escapeValMetaArray);
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
        let colormapLength = colormap ? colormap.length : 0;

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
        ld = document.getElementById('ldBar');
        ld.style.zIndex = 0;
    }
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

        scaleFactor =  getScaleFactor();

        console.log("scale factor", scaleFactor);

        canvas.height = (window.innerHeight-3.5*rem)*scaleFactor;
        canvas.width = window.innerWidth*0.75*scaleFactor;

        console.log(0,canvas.style.width, canvas.style.height, canvas.width, 
            canvas.height, window.innerWidth, window.innerHeight, scaleFactor);

        let numPixels = canvas.height*canvas.width;
        let w = canvas.width;
        let h = canvas.height;
        console.log("canvas dimensions:",w,h,w*h,numPixels)
        let deltay=ymax-ymin;
        totalLines=h;

        ld = document.getElementById('ldBar');
        ld.style.zIndex = 75;
        ld.ldBar.set(0);
        linesProcessed=0;

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
let totalLines=0;
let linesProcessed=0;

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
                    ctx.strokeRect(mouseDownX, mouseDownY, boxSize, boxSize/mainCanvasAspectRatio);
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
                // let xCoord = 0;
                // let yCoord = 0;
                let coordString;
                let xCoord = xmin + (xmax-xmin)*(event.clientX - 0.25*window.innerWidth)/ctx.canvas.width; 
                let yCoord = ymax - (ymax-ymin)*(event.clientY - 3.5*rem)/ctx.canvas.height;

                let xPrecision = Math.floor(-Math.log10(xmax-xmin))+2;
                let yPrecision = Math.floor(-Math.log10(ymax-ymin))+2;

                // console.log('precision', xPrecision, yPrecision);
                
                if (yCoord > 0){
                coordString = "z = " + xCoord.toExponential(xPrecision) + " + " + yCoord.toExponential(yPrecision) + "i";
                }
                else{
                coordString = "z = " + xCoord.toExponential(xPrecision) + " - " + (-yCoord).toExponential(yPrecision)+ "i";
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
                console.log("mouse locations",mouseDownX, mouseUpX, mouseDownY, mouseUpY);

                if (mouseDownX == mouseUpX || mouseUpY == mouseDownY){
                    console.log('zero size rectangle selected, draw not called');
                    return;
                }
                let canvasWidth = 0.75*window.innerWidth;
                let canvasHeight = window.innerHeight - 3.5*rem;
                
                if (aspectRatioPreserved){

                    let boxSize = Math.max((mouseUpX-mouseDownX), (mouseUpY-mouseDownY)*mainCanvasAspectRatio);

                    console.log("bozsize, canvasWidht, canvasHeight", boxSize, canvasWidth, canvasHeight);

                    let fractionalMinX = mouseDownX/canvasWidth;
                    let fractionalMinY = mouseDownY/canvasHeight;
                    let fractionalMaxX = (mouseDownX + boxSize)/canvasWidth;
                    let fractionalMaxY = (mouseDownY + boxSize/mainCanvasAspectRatio)/canvasHeight;

                    console.log("fractional xmin/max,ymin/max", fractionalMinX, fractionalMaxX,
                                fractionalMinY, fractionalMaxY)


                    let xminTemp = xmin + fractionalMinX*(xmax-xmin);
                    let xmaxTemp = xmin + fractionalMaxX*(xmax-xmin);
                    let yminTemp = ymax - fractionalMaxY*(ymax-ymin);
                    let ymaxTemp = ymax - fractionalMinY*(ymax-ymin);

                    xmin = xminTemp;
                    xmax = xmaxTemp;
                    ymin = yminTemp;
                    ymax = ymaxTemp;



                }

                else{

                    let fractionalMinX = Math.min(mouseDownX, mouseUpX)/canvasWidth;
                    let fractionalMaxX = Math.max(mouseDownX, mouseUpX)/canvasWidth;
                    let fractionalMinY = Math.min(mouseDownY, mouseUpY)/canvasHeight;
                    let fractionalMaxY = Math.max(mouseDownY, mouseUpY)/canvasHeight;
                    let xminTemp = xmin + fractionalMinX*(xmax-xmin);
                    let xmaxTemp = xmin + fractionalMaxX*(xmax-xmin);
                    let yminTemp = ymax - fractionalMaxY*(ymax-ymin);
                    let ymaxTemp = ymax - fractionalMinY*(ymax-ymin);
                    xmin = xminTemp;
                    xmax = xmaxTemp;
                    ymin = yminTemp;
                    ymax = ymaxTemp;


                }

                console.log("xmin/max, ymin/max",xmin, xmax, ymin, ymax);

                draw(xmin, xmax, ymin, ymax,colormap,scaleFactor=2.0);           
            }
        }
        }

    mainCanvasAspectRatio = getCanvasAspectRatio(); // x/y
    if (mainCanvasAspectRatio < 1){
        ymin /= mainCanvasAspectRatio;
        ymax /= mainCanvasAspectRatio; 
    }

    if (mainCanvasAspectRatio > 1){
        xmin *= mainCanvasAspectRatio;
        xmax *= mainCanvasAspectRatio;
    }

    draw(xmin, xmax, ymin, ymax, colormap);
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

button = document.getElementById('exportButton');
button.onclick = function(event){
    console.log('save button clicked');
    let canvas = document.getElementById('drawingCanvas');
    let img = canvas.toDataURL("image/png");
    // button.href = img;
    // window.open(img);
    var anchor = document.createElement('a');
    anchor.href = img;
    anchor.target = '_blank';
    anchor.download = "mandelbrot.png";
    anchor.click();
}

window.onload = main;