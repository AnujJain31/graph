
function parseSide(expr){
    if(expr === '') expr = '0';

    const tokens = expr.match(/[+-]?[^+-]+/g);
    if (!tokens) {
        throw new Error ('could not read that equation');
    }

    const coeffs = {0:0,1:0,2:0};

    for (const token of tokens){
        const{degree , value} = parseTerm(token);
        coeffs[degree] += value;
    }

    return coeffs;
}

function parseTerm(token){
    let degree;
    let coefStr;

    if(token.includes('x^2')){
        degree = 2;
        coefStr = token.replace('x^2' , '');
    }else if(token.includes('x')){
        degree = 1;
        coefStr = token.replace('x','');
    }else{
        degree = 0;
        coefStr = token;
    }

    if(coefStr === '' || coefStr === '+') coefStr = '1';
    else if(coefStr === '-') coefStr = '-1'

    const value = parseFloat(coefStr);
    if(isNaN(value)){
        throw new Error(`couldn't understand the term "${token}".`);    }
        return{degree , value};
}

function parseQuadratic(raw){
    let s = raw.replace(/\s+/g, '').toLowerCase();

    if(!s) {
        throw new Error('enter an equation first.')
    }
    s = s.replace(/\u00b2/g, '^2');
    s = s.replace(/^y=/, '').replace(/^f\(x\)=/,'');

    let leftStr = s;
    let rightStr = '0';

    if (s.includes('=')){
        const parts = s.split('=');
        if(parts.length !== 2){
            throw new Error('equation should only have one "=" sign.');
        }
        [leftStr , rightStr] = parts;
    }

    const left = parseSide(leftStr);
    const right = parseSide(rightStr);

    const a = left[2] - right[2];
    const b = left[1] - right[1];
    const c = left[0] - right[0];

    if (a === 0){
        throw new Error('missing an x² term - this isn\'t a quadratic equation.')
    }
    return{ a,b,c};
}

const form = document.getElementById('equationForm');
const input = document.getElementById('equationInput');
const errorMsg = document.getElementById('errorMsg');

form.addEventListener('submit' , function(e){
    e.preventDefault();
    errorMsg.textContent = '';

    try{
        const {a ,b, c} = parseQuadratic(input.value);

        view = computeValue(a,b,c);
        setupCanvas();
        drawGrid();
        plotCurve(a,b,c);

    } catch(err){
        errorMsg.textContent = err.message;
    }
});

const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');


let view = {xMin:-10,xMax:10,yMin:-10,yMax:10};

function setupCanvas(){
    const drp = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();


    canvas.width = rect.width*drp;
    canvas.height = rect.height*drp;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(drp,drp);
}

function toPixel(x,y){
    const rect = canvas.getBoundingClientRect();
    const px = ((x-view.xMin)/(view.xMax - view.xMin))*rect.width;
    const py = rect.height - ((y - view.yMin)/(view.yMax - view.yMin))*rect.height;
    return{px,py};
}

function niceStep(span){
    const rough = span/10;
    const magnitude = Math.pow(10,Math.floor(Math.log10(rough)));
    const residual = rough/magnitude;

    let step;
    if (residual>5) step = 10 * magnitude;
    else if (residual>2) step = 5*magnitude;
    else if (residual>1) step = 2*magnitude;
    else step = magnitude;

    return step;
}

function drawGrid(){
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);

    const stepX = niceStep(view.xMax - view.xMin);
    const stepY = niceStep(view.yMax - view.yMin);

    ctx.font = '10px system-ui'
    ctx.fillStyle = 'rgba(255,255,255,0.45)';

    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    const StartX = Math.ceil(view.xMin / stepX)*stepX;
    for (let x = StartX; x<=view.xMax; x += stepX){
        const{px} = toPixel(x,0);
        ctx.beginPath();
        ctx.moveTo(px,0);
        ctx.lineTo(px,rect.height);
        ctx.stroke();

        if(Math.abs(x) > 1e-9){
            const{py} = toPixel(0,0);
            ctx.fillText(x.toFixed(stepX<1?1:0), px + 3 , Math.min(rect.height - 4, py + 12));            
        }
    }

    const startY = Math.ceil(view.yMin/stepY)*stepY;
    for (let y = startY; y <= view.yMax; y+= stepY){
        const {py} = toPixel(0,y);
        ctx.beginPath();
        ctx.moveTo(0,py);
        ctx.lineTo(rect.width,py);
        ctx.stroke();

        if(Math.abs(y)> 1e-9){
            const{px} = toPixel(0,0);
            ctx.fillText(y.toFixed(stepY < 1?1:0), Math.max(4,px+3), py-3);

        }
    }

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1.5;

    const origin = toPixel(0,0);

    ctx.beginPath();
    ctx.moveTo(0,origin.py);
    ctx.lineTo(rect.width,origin.py);
    ctx.stroke();
}
function computeValue(a,b,c){
    const vx = -b/(2*a);
    const D = b*b-4*a*c;

    const xs = [vx]
    if(D >= 0){
        const sqrtD = Math.sqrt(D);
        xs.push((-b -sqrtD)/ (2*a),(-b + sqrtD)/(2*a));
}

let xMin =  Math.min(...xs);
let xMax = Math.max(...xs);

let spanX = xMax - xMin;
if (spanX < 1e-6) spanX = 4;

const padX = Math.max(spanX*0.4,2);
xMin -= padX;
xMax += padX;

const samples = 50;
let yMin = Infinity;
let yMax = -Infinity;
for (let i = 0; i<=samples;i++){
    const x = xMin + (i/samples)*(xMax - xMin);
    const y = a*x*x+b*x+c;
    if(y<yMin) yMin = y;
    if(y>yMax) yMax = y;
}

let spanY = yMax - yMin;
if (spanY < 1e-6)spanY = 4;

const padY = Math.max(spanY*0.15,2);
yMin -= padY;
yMax += padY;

return {xMin,xMax,yMin,yMax};

}


// function plotCurve(a,b,c){
//     const rect = canvas.getBoundingClientRect();
//     const steps = 400;

//     ctx.strokeStyle = '#e0592a';
//     ctx.lineWidth = 2.5;
//     ctx.beginPath();

//     for(let i = 0; i <= steps; i++){
//         const x = view.xMin + (i/steps)*(view.xMax - view.xMin);
//         const y = a*x*x+b*x+c;
//         const {px,py} = toPixel(x,y);

//         if(i === 0)ctx.moveTo(px,py);
//         else ctx.lineTo(px,py);
//     }

//     ctx.stroke();
// }
let currentAnimationId = null;

function plotCurve(a, b, c) {
  const steps = 400;
  const duration = 1800; // ms

  const points = [];
  for (let i = 0; i <= steps; i++) {
    const x = view.xMin + (i / steps) * (view.xMax - view.xMin);
    const y = a * x * x + b * x + c;
    points.push(toPixel(x, y));
  }

  if (currentAnimationId !== null) {
    cancelAnimationFrame(currentAnimationId);
    currentAnimationId = null;
  }

  const startTime = performance.now();

  function frame(now) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const pointCount = Math.max(2, Math.floor(progress * points.length));

    drawGrid();

    ctx.strokeStyle = '92a';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < pointCount; i++) {
      const { px, py } = points[i];
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (progress < 1) {
      currentAnimationId = requestAnimationFrame(frame);
    } else {
      currentAnimationId = null;
    }
  }

  currentAnimationId = requestAnimationFrame(frame);
}
function redraw(){
    setupCanvas();
    drawGrid();
}

window.addEventListener('resize',redraw);
redraw();