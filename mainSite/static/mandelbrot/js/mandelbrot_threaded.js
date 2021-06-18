'use strict';

// Global Variables

// Parallelisation Variables
// Creates workers equal to number of cores on client's machine
// Domain is divided between each worker for drawing Mb
// Data is then collated in escapeValMetaArray and pushed to canvas in main thread
// workerReturnedArray used to tell when all workers returned and data can be collated
// workerURL variable is used for Django static file handling reasons
let numCores = window.navigator.hardwareConcurrency;
if (!Number.isInteger(numCores)) {
    numCores=1;
}
const workerArray = new Array(numCores);
const escapeValMetaArray = new Array(numCores);
const workerReturnedArray = new Array(numCores);
const workerUrl = document.getElementById('mandelbrotWorkerUrl').innerHTML;
// Used for progress bar
let totalLines=0;
let linesProcessed=0;


// Plotting control variables
let xmin = -2.25;
let xmax = 0.75;
let ymin = -1.5;
let ymax = 1.5;
let mainCanvasAspectRatio = null;
let aspectRatioPreserved = null;
const rem = parseFloat(window.getComputedStyle(
    document.getElementById('canvasContainer')).fontSize);
let escapeValArray;
let currentlyDrawing = false;

// Functions
// Utility Functions

function getColormap() {
    // N.B. Colormaps not defined in this file
    const colormapSelector = document.getElementById('colorMap');
    const colormapString = colormapSelector.options[colormapSelector.selectedIndex].value;
    if (colormapString == 'null') {
        return null;
    }
    return window[colormapString];
}

function getScaleFactor() {
    const scaleFactorSelector = document.getElementById('dpi');
    return scaleFactorSelector.value;
}

function getCanvasAspectRatio() {
    return (window.innerWidth*0.75)/(window.innerHeight-3.5*rem);
}

function getAspectRatioPreserved() {
    const aspectRatioSelector = document.getElementById('aspectRatio');
    return aspectRatioSelector.checked;
}

function getUseDistanceEstimation() {
    const distanceEstimationSelector = document.getElementById('distanceEstimation');
    return distanceEstimationSelector.checked;
}

function getDisplayCoordinates() {
    const displayCoordinatesSelector = document.getElementById('displayCoordinates');
    return displayCoordinatesSelector.checked;
}


// Major Functions

// Worker Functions

function ldBarUpdate(e) {
    const ld = document.getElementById('ldBar');
    linesProcessed += e.data[1];
    ld.ldBar.set(linesProcessed*100/totalLines);
}

function collateWorkerImageData(e) {
    if (e.data[3]) { // should be None if not translating, translationParameters otherwise
        collateWorkerImageDataTranslate(e.data[3]);
    } else {
        collateWorkerImageDataZoom();
    }
}

function collateWorkerImageDataTranslate(translationParameters) {
    const canvas = document.getElementById('drawingCanvas');
    if (canvas.getContext) {
        const arrayLengths = escapeValMetaArray.map( (a) => a.length);
        const totalLength = arrayLengths.reduce((a, b) => a+b, 0);

        const oldEscapeValArray = escapeValArray;

        const newEscapeValArray = new Float32Array(totalLength);

        escapeValArray = new Float32Array(escapeValArray.length);

        let offset = 0;
        for (let i=0; i<numCores; i++) {
            newEscapeValArray.set(escapeValMetaArray[i], offset);
            offset += escapeValMetaArray[i].length;
        }

        const totalWidth = canvas.width;

        const newWidth = Math.floor(translationParameters.w*translationParameters.scale);

        const reusedWidth = totalWidth - newWidth;

        const h = canvas.height;

        const totalHeight = canvas.height;

        const newHeight = Math.floor(totalHeight*translationParameters.scale);
        switch (translationParameters.direction) {
        case 'right':
            for (let j=0; j<h; j++) {
                for (let i=0; i<totalWidth; i++) {
                    if (i < reusedWidth) {
                        escapeValArray[j*totalWidth+i] =
                        oldEscapeValArray[j*totalWidth+i+newWidth];
                    } else {
                        escapeValArray[j*totalWidth+i] =
                        newEscapeValArray[j*newWidth+i-reusedWidth];
                    }
                }
            }
            break;

        case 'left':
            for (let j=0; j<h; j++) {
                for (let i=0; i<totalWidth; i++) {
                    if (i < newWidth) {
                        escapeValArray[j*totalWidth+i] =
                            newEscapeValArray[j*newWidth+i];
                    } else {
                        escapeValArray[j*totalWidth+i] =
                            oldEscapeValArray[j*totalWidth+i-newWidth];
                    }
                }
            }
            break;

        case 'up':
            for (let j=0; j<totalHeight; j++) {
                for (let i=0; i<totalWidth; i++) {
                    if (j < newHeight) {
                        escapeValArray[j*totalWidth+i] =
                            newEscapeValArray[j*totalWidth+i];
                    } else {
                        escapeValArray[j*totalWidth+i] =
                            oldEscapeValArray[(j-newHeight)*totalWidth+i];
                    }
                }
            }
            break;

        case 'down':
            for (let j=0; j<totalHeight; j++) {
                for (let i=0; i<totalWidth; i++) {
                    if (j >= totalHeight - newHeight) {
                        escapeValArray[j*totalWidth+i] =
                            newEscapeValArray[(j-totalHeight+newHeight)*totalWidth+i];
                    } else {
                        escapeValArray[j*totalWidth+i] =
                            oldEscapeValArray[(j+newHeight)*totalWidth+i];
                    }
                }
            }
            break;
        }
        const ctx = canvas.getContext('2d');
        const numPixels = escapeValArray.length;
        const imageDataArray = new Uint8ClampedArray(4*numPixels);
        const minVal = 10**-15;
        const scaledEscapeValArray =
            escapeValArray.map((x) => -Math.log(Math.max(x, minVal)));
        maxEscapeVal = scaledEscapeValArray.reduce(function(a, b) {
            return Math.max(a, b);
        });
        minEscapeVal = scaledEscapeValArray.reduce(function(a, b) {
            return Math.min(a, b);
        });


        const colormap = getColormap();
        const colormapLength = colormap ? colormap.length : 0;
        for (let i=0; i<numPixels; i++) {
            x = (scaledEscapeValArray[i]-minEscapeVal)/(maxEscapeVal-minEscapeVal);
            if (colormap) {
                const idx = Math.min(Math.floor(colormapLength*x), colormapLength-1);
                const color = colormap[idx][1];

                imageDataArray[4*i] = Math.floor(255*color[0]);
                imageDataArray[4*i+1] = Math.floor(255*color[1]);
                imageDataArray[4*i+2] = Math.floor(255*color[2]);
                imageDataArray[4*i+3] = 255;
            } else {
                imageDataArray[4*i] = Math.floor(x*255);
                imageDataArray[4*i+1] = Math.floor(x*255);
                imageDataArray[4*i+2] = Math.floor(x*255);
                imageDataArray[4*i+3] = 255;
            }
        }

        convertedData = new ImageData(imageDataArray, canvas.width, canvas.height);
        ctx.putImageData(convertedData, 0, 0);
        ld = document.getElementById('ldBar');
        ld.style.zIndex = 0;
        currentlyDrawing = false;
    }
}

function collateWorkerImageDataZoom() {
    const canvas = document.getElementById('drawingCanvas');
    if (canvas.getContext) {
        const lengths = escapeValMetaArray.map( (a) => a.length);
        const totalLength = lengths.reduce((a, b) => a+b, 0);
        escapeValArray = new Float32Array(totalLength);
        let offset = 0;
        for (let i=0; i<numCores; i++) {
            escapeValArray.set(escapeValMetaArray[i], offset);
            offset += escapeValMetaArray[i].length;
        }
        const ctx = canvas.getContext('2d');
        const numPixels = escapeValArray.length;
        const imageDataArray = new Uint8ClampedArray(4*numPixels);
        const minVal = 10**-15;
        const scaledEscapeValArray =
            escapeValArray.map((x) => -Math.log(Math.max(x, minVal)));
        const maxEscapeVal = scaledEscapeValArray.reduce(function(a, b) {
            return Math.max(a, b);
        });
        const minEscapeVal = scaledEscapeValArray.reduce(function(a, b) {
            return Math.min(a, b);
        });

        const colormap = getColormap();
        const colormapLength = colormap ? colormap.length : 0;

        for (let i=0; i<numPixels; i++) {
            x = (scaledEscapeValArray[i]-minEscapeVal)/(maxEscapeVal-minEscapeVal);
            if (colormap) {
                const idx = Math.min(Math.floor(colormapLength*x), colormapLength-1);
                const color = colormap[idx][1];

                imageDataArray[4*i] = Math.floor(255*color[0]);
                imageDataArray[4*i+1] = Math.floor(255*color[1]);
                imageDataArray[4*i+2] = Math.floor(255*color[2]);
                imageDataArray[4*i+3] = 255;
            } else {
                imageDataArray[4*i] = Math.floor(x*255);
                imageDataArray[4*i+1] = Math.floor(x*255);
                imageDataArray[4*i+2] = Math.floor(x*255);
                imageDataArray[4*i+3] = 255;
            }
        }

        convertedData = new ImageData(imageDataArray, canvas.width, canvas.height);
        ctx.putImageData(convertedData, 0, 0);
        ld = document.getElementById('ldBar');
        ld.style.zIndex = 0;
        currentlyDrawing = false;
    }
}

function workerDataProcess(e) {
    const workerId = e.data[1];
    escapeValMetaArray[workerId] = e.data[2];
    workerReturnedArray[workerId]=1;
    if (workerReturnedArray.reduce((a, b) => a+b, 0) == numCores) {
        collateWorkerImageData(e);
    }
}

function workerMessageProcess(e) {
    switch (e.data[0]) {
    case 'ldBarUpdate':
        ldBarUpdate(e);
        break;
    case 'calculationsFinished':
        workerDataProcess(e);
        break;
    default:
        // Should never be called
        console.log('unknown worker return code.');
    }
}


// Workers must be initialised after workerMessageProcess is defined
for (let i=0; i<numCores; i++) {
    workerArray[i] = new Worker(workerUrl);
    workerArray[i].onmessage = workerMessageProcess;
    workerReturnedArray[i]=0;
}

function draw(xmin = -2.5, xmax = 1, ymin = -1.75, ymax = 1.75) {
    const canvas = document.getElementById('drawingCanvas');
    const hashObject = {'xmin': xmin, 'xmax': xmax, 'ymin': ymin, 'ymax': ymax};
    currentlyDrawing = true;
    window.location.hash = JSON.stringify(hashObject);
    if (canvas.getContext) {
        const useDistanceEstimation = getUseDistanceEstimation();
        const scaleFactor = getScaleFactor();

        canvas.style.height = window.innerHeight-3.5*rem + 'px';
        canvas.style.width = window.innerWidth*0.75 + 'px';


        canvas.height = (window.innerHeight-3.5*rem)*scaleFactor;
        canvas.width = window.innerWidth*0.75*scaleFactor;


        const w = canvas.width;
        const h = canvas.height;
        const deltaY=ymax-ymin;
        totalLines=h;

        const ld = document.getElementById('ldBar');
        ld.style.zIndex = 75;
        ld.ldBar.set(0);
        linesProcessed=0;

        for (let i=0; i<numCores; i++) {
            workerReturnedArray[i]=0;
            const ymaxWorker = ymax - i*deltaY/numCores;
            const yminWorker = ymax - (i+1)*deltaY/numCores;
            let hWorker;
            if (i == (numCores-1)) {
                hWorker = Math.floor(h/numCores) + h%numCores;
            } else {
                hWorker = Math.floor(h/numCores);
            }
            workerArray[i].postMessage([
                xmin, xmax, yminWorker, ymaxWorker, w, hWorker,
                i, useDistanceEstimation, null]);
        }
    }
}


function main() {
    // Sets up selection box behaviour, button behavoir, mouseover behavior
    // Then calls first draw function
    const ctrlcanvas = document.getElementById('controlCanvas');
    let ctx = ctrlcanvas.getContext('2d');
    const rem = parseFloat(window.getComputedStyle(ctrlcanvas).fontSize);
    ctx.canvas.width = window.innerWidth*0.75;
    ctx.canvas.height = window.innerHeight - 3.5*rem;
    let mouseDownX = 0;
    let mouseDownY = 0;
    let canvasClicked = false;

    const coordCanvas = document.getElementById('coordinateCanvas');
    ctx = coordCanvas.getContext('2d');
    ctx.canvas.width = window.innerWidth*0.75;
    ctx.canvas.height = window.innerHeight - 3.5*rem;


    ctrlcanvas.onmousedown = function(event) {
        mouseDownX = event.clientX - 0.25*window.innerWidth;
        mouseDownY = event.clientY - 3.5*rem;
        canvasClicked = true;
        aspectRatioPreserved = getAspectRatioPreserved();
        mainCanvasAspectRatio = getCanvasAspectRatio();
    };


    ctrlcanvas.onmousemove = function(event) {
        if (canvasClicked) {
            if (ctrlcanvas.getContext) {
                const ctx = ctrlcanvas.getContext('2d');
                ctx.strokeStyle = 'red'; //  TODO made this depend on colormap
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                const currentX = event.clientX - 0.25*window.innerWidth;
                const currentY = event.clientY - 3.5*rem;
                if (aspectRatioPreserved) {
                    const boxSize = Math.max((currentX-mouseDownX),
                        (currentY-mouseDownY)*mainCanvasAspectRatio);
                    ctx.strokeRect(mouseDownX, mouseDownY,
                        boxSize, boxSize/mainCanvasAspectRatio);
                } else {
                    ctx.strokeRect(mouseDownX, mouseDownY,
                        currentX-mouseDownX, currentY-mouseDownY);
                }
            }
        }
        if (getDisplayCoordinates()) {
            if (coordCanvas.getContext) {
                const ctx = coordCanvas.getContext('2d');
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                // let xCoord = 0;
                // let yCoord = 0;
                let coordString;
                const xCoord = xmin +
                    (xmax-xmin)*(event.clientX - 0.25*window.innerWidth)/ctx.canvas.width;
                const yCoord = ymax -
                    (ymax-ymin)*(event.clientY - 3.5*rem)/ctx.canvas.height;

                const xPrecision = Math.floor(-Math.log10(xmax-xmin))+2;
                const yPrecision = Math.floor(-Math.log10(ymax-ymin))+2;


                if (yCoord > 0) {
                    coordString = 'z = ' + xCoord.toExponential(xPrecision) +
                        ' + ' + yCoord.toExponential(yPrecision) + 'i';
                } else {
                    coordString = 'z = ' + xCoord.toExponential(xPrecision) +
                        ' - ' + (-yCoord).toExponential(yPrecision)+ 'i';
                }
                ctx.font = '48px serif';
                ctx.fillStyle = 'white';
                ctx.fillText(coordString, 10, 40);
                ctx.strokeText(coordString, 10, 40);
            }
        }
    };

    ctrlcanvas.onmouseout = function(event) {
        if (coordCanvas.getContext);
        const ctx = coordCanvas.getContext('2d');
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    };

    ctrlcanvas.onmouseup = function(event) {
        if (canvasClicked) {
            canvasClicked = false;
            if (ctrlcanvas.getContext) {
                const ctx = ctrlcanvas.getContext('2d');
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                const mouseUpX = event.clientX - 0.25*window.innerWidth;
                const mouseUpY = event.clientY - 3.5*rem;

                if (mouseDownX == mouseUpX || mouseUpY == mouseDownY) {
                    console.log('zero size rectangle selected, draw not called');
                    return;
                }
                const canvasWidth = 0.75*window.innerWidth;
                const canvasHeight = window.innerHeight - 3.5*rem;

                if (aspectRatioPreserved) {
                    const boxSize = Math.max((mouseUpX-mouseDownX),
                        (mouseUpY-mouseDownY)*mainCanvasAspectRatio);
                    const fractionalMinX = mouseDownX/canvasWidth;
                    const fractionalMinY = mouseDownY/canvasHeight;
                    const fractionalMaxX = (mouseDownX + boxSize)/canvasWidth;
                    const fractionalMaxY =
                        (mouseDownY + boxSize/mainCanvasAspectRatio)/canvasHeight;

                    const xminTemp = xmin + fractionalMinX*(xmax-xmin);
                    const xmaxTemp = xmin + fractionalMaxX*(xmax-xmin);
                    const yminTemp = ymax - fractionalMaxY*(ymax-ymin);
                    const ymaxTemp = ymax - fractionalMinY*(ymax-ymin);

                    xmin = xminTemp;
                    xmax = xmaxTemp;
                    ymin = yminTemp;
                    ymax = ymaxTemp;
                } else {
                    const fractionalMinX = Math.min(mouseDownX, mouseUpX)/canvasWidth;
                    const fractionalMaxX = Math.max(mouseDownX, mouseUpX)/canvasWidth;
                    const fractionalMinY = Math.min(mouseDownY, mouseUpY)/canvasHeight;
                    const fractionalMaxY = Math.max(mouseDownY, mouseUpY)/canvasHeight;
                    const xminTemp = xmin + fractionalMinX*(xmax-xmin);
                    const xmaxTemp = xmin + fractionalMaxX*(xmax-xmin);
                    const yminTemp = ymax - fractionalMaxY*(ymax-ymin);
                    const ymaxTemp = ymax - fractionalMinY*(ymax-ymin);
                    xmin = xminTemp;
                    xmax = xmaxTemp;
                    ymin = yminTemp;
                    ymax = ymaxTemp;
                }

                draw(xmin, xmax, ymin, ymax);
            }
        }
    };

    mainCanvasAspectRatio = getCanvasAspectRatio(); // x/y
    if (mainCanvasAspectRatio < 1) {
        ymin /= mainCanvasAspectRatio;
        ymax /= mainCanvasAspectRatio;
    }

    if (mainCanvasAspectRatio > 1) {
        xmin *= mainCanvasAspectRatio;
        xmax *= mainCanvasAspectRatio;
    }


    let button = document.getElementById('drawButton');
    button.onclick = function(event) {
        draw(xmin, xmax, ymin, ymax);
    };
    button = document.getElementById('resetButton');
    button.onclick = function(event) {
        xmin = -2.25;
        xmax = 0.75;
        ymin = -1.5;
        ymax = 1.5;
        mainCanvasAspectRatio = getCanvasAspectRatio(); // x/y
        if (mainCanvasAspectRatio < 1) {
            ymin /= mainCanvasAspectRatio;
            ymax /= mainCanvasAspectRatio;
        }

        if (mainCanvasAspectRatio > 1) {
            xmin *= mainCanvasAspectRatio;
            xmax *= mainCanvasAspectRatio;
        }
        draw(xmin, xmax, ymin, ymax);
    };

    button = document.getElementById('exportButton');
    button.onclick = function(event) {
        const canvas = document.getElementById('drawingCanvas');
        const img = canvas.toDataURL('image/png');
        const anchor = document.createElement('a');
        anchor.href = img;
        anchor.target = '_blank';
        anchor.download = 'mandelbrot.png';
        anchor.click();
    };

    window.onkeyup = function(event) {
        let translationDirection;
        switch (event.key) {
        case 'ArrowRight':
            translationDirection = 'right';
            break;
        case 'ArrowLeft':
            translationDirection = 'left';
            break;
        case 'ArrowUp':
            translationDirection = 'up';
            break;
        case 'ArrowDown':
            translationDirection = 'down';
            break;
        }
        translate(translationDirection, 0.1);
    };

    if (window.location.hash) {
        const hashString = window.location.hash;
        const hashObject = JSON.parse(decodeURIComponent(hashString.slice(1)));
        xmin = hashObject['xmin'];
        xmax = hashObject['xmax'];
        ymin = hashObject['ymin'];
        ymax = hashObject['ymax'];
    }

    draw(xmin, xmax, ymin, ymax);
}


window.onload = main;


// TODO add time constraint to this
// or add hook that prevents this from calling properly until released
function translate(direction, scale) {
    const canvas = document.getElementById('drawingCanvas');
    if (canvas.getContext) {
        h = canvas.height;
        w = canvas.width;
        const translationParameters = {};
        translationParameters.scale = scale;
        switch (direction) {
        case 'right': {
            translationParameters.direction = 'right';
            const deltax = (xmax-xmin)*translationParameters.scale;
            translationParameters.deltax = deltax;
            const xmaxOld = xmax;
            xmax += deltax;
            xmin += deltax;
            drawTranslate(xmaxOld, xmax, ymin, ymax, translationParameters);
            break;}

        case 'left': {
            translationParameters.direction = 'left';
            const deltax = (xmax-xmin)*translationParameters.scale;
            translationParameters.deltax = deltax;
            const xminOld = xmin;
            xmax -= deltax;
            xmin -= deltax;
            drawTranslate(xmin, xminOld, ymin, ymax, translationParameters);
            break;}


        case 'up': {
            translationParameters.direction = 'up';
            const deltay = (ymax-ymin)*translationParameters.scale;
            translationParameters.deltay = deltay;
            const ymaxOld = ymax;
            ymax += deltay;
            ymin += deltay;
            drawTranslate(xmin, xmax, ymaxOld, ymax, translationParameters);
            break;
        }

        case 'down': {
            translationParameters.direction = 'down';
            const deltay = (ymax-ymin)*translationParameters.scale;
            translationParameters.deltay = deltay;
            const yminOld = ymin;
            ymin -= deltay;
            ymax -= deltay;
            drawTranslate(xmin, xmax, ymin, yminOld, translationParameters);
            break;
        }
        }
    }
}


function drawTranslate(xmin = -2.5, xmax = 1, ymin = -1.75, ymax = 1.75,
    translationParameters) {
    const canvas = document.getElementById('drawingCanvas');
    if (canvas.getContext) {
        currentlyDrawing = true;
        const hashObject = {'xmin': xmin, 'xmax': xmax, 'ymin': ymin, 'ymax': ymax};
        window.location.hash = JSON.stringify(hashObject);
        let w = canvas.width;
        let h = canvas.height;
        translationParameters.w=w;
        translationParameters.h=h;

        if (translationParameters.direction == 'right' ||
        translationParameters.direction == 'left') {
            w = Math.floor(w*translationParameters.scale);
        } else if (translationParameters.direction == 'up' ||
        translationParameters.direction == 'down') {
            h = Math.floor(h*translationParameters.scale);
        }


        const deltaY=ymax-ymin;
        totalLines=h;

        ld = document.getElementById('ldBar');
        ld.style.zIndex = 75;
        ld.ldBar.set(0);
        linesProcessed=0;

        for (let i=0; i<numCores; i++) {
            workerReturnedArray[i]=0;
            const ymaxWorker = ymax - i*deltaY/numCores;
            const yminWorker = ymax - (i+1)*deltaY/numCores;
            let hWorker;
            if (i == (numCores-1)) {
                hWorker = Math.floor(h/numCores) + h%numCores;
            } else {
                hWorker = Math.floor(h/numCores);
            }
            workerArray[i].postMessage([
                xmin, xmax, yminWorker, ymaxWorker, w, hWorker, i,
                useDistanceEstimation, translationParameters]);
        }
    }
}

window.onhashchange = function() {
    if (!currentlyDrawing) {
        const hashString = window.location.hash;
        const hashObject = JSON.parse(decodeURIComponent(hashString.slice(1)));
        xmin = hashObject['xmin'];
        xmax = hashObject['xmax'];
        ymin = hashObject['ymin'];
        ymax = hashObject['ymax'];
        draw(xmin, xmax, ymin, ymax);
    }
};
