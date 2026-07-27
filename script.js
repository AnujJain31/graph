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
        animateToEquation(a,b,c);

    } catch(err){
        errorMsg.textContent = err.message;
    }
});

const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');


let view = {xMin:-100,xMax:100,yMin:-100,yMax:100};

function setupCanvas(){
    const drp = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();


    canvas.width = rect.width*drp;
    canvas.height = rect.height*drp;

    ctx.setTransform(1,0,0,1,0,0);
    ctx.scale(drp,drp);
}

function toPixel(x, y) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = rect.width / (view.xMax - view.xMin);
  const scaleY = rect.height / (view.yMax - view.yMin);
  const scale = Math.min(scaleX, scaleY); 

  const usedWidth = (view.xMax - view.xMin) * scale;
  const usedHeight = (view.yMax - view.yMin) * scale;
  const offsetX = (rect.width - usedWidth) / 2;
  const offsetY = (rect.height - usedHeight) / 2;

  const px = offsetX + (x - view.xMin) * scale;
  const py = rect.height - offsetY - (y - view.yMin) * scale;
  return { px, py };
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


function animateToEquation(a, b, c) {
  const startView = { ...view };
  const targetView = computeView(a, b, c);
  const duration = 1200; // ms — feel free to tweak
  const startTime = performance.now();
  const totalSteps = 400;

  if (currentAnimId !== null) {
    cancelAnimationFrame(currentAnimId);
    currentAnimId = null;
  }

  function frame(now) {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - t, 3); // ease-out, drives BOTH zoom and trace

    // 1. Interpolate the view (zoom/pan)
    view = {
      xMin: startView.xMin + (targetView.xMin - startView.xMin) * eased,
      xMax: startView.xMax + (targetView.xMax - startView.xMax) * eased,
      yMin: startView.yMin + (targetView.yMin - startView.yMin) * eased,
      yMax: startView.yMax + (targetView.yMax - startView.yMax) * eased,
    };

    drawGrid();

    // 2. Draw the curve up to the current progress, using the CURRENT
    //    (mid-zoom) view, so the trace and the shift move together
    const pCount = Math.max(2, Math.floor(eased * totalSteps));
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i <= pCount; i++) {
      const x = view.xMin + (i / totalSteps) * (view.xMax - view.xMin);
      const y = a * x * x + b * x + c;
      const { px, py } = toPixel(x, y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    if (t < 1) {
      currentAnimId = requestAnimationFrame(frame);
    } else {
      currentAnimId = null;
    }
  }

  currentAnimId = requestAnimationFrame(frame);
}

function drawGrid(){
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0,0,rect.width,rect.height);

    const scaleX = rect.width / (view.xMax - view.xMin);
    const scaleY = rect.height / (view.yMax - view.yMin);
    const scale = Math.min(scaleX, scaleY);

    const usedWidth = (view.xMax - view.xMin) * scale;
    const usedHeight = (view.yMax - view.yMin) * scale;
    const offsetX = (rect.width - usedWidth) / 2;
    const offsetY = (rect.height - usedHeight) / 2;

    const visiXMin = view.xMin - offsetX / scale;
    const visiXMax = view.xMax + offsetX / scale;
    const visiYMin = view.yMin - offsetY / scale;
    const visiYMax = view.yMax + offsetY / scale;

    const stepX = niceStep(visiXMax - visiXMin);
    const stepY = niceStep(visiYMax - visiYMin);

    ctx.font = '10px system-ui'
    ctx.fillStyle = 'rgba(255,255,255,0.45)';


    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    ctx.lineWidth = 1;
    const StartX = Math.ceil(visiXMin / stepX)*stepX;
    for (let x = StartX; x<=visiXMax; x += stepX){
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

    
    const startY = Math.ceil(visiYMin/stepY)*stepY;
    for (let y = startY; y <= visiYMax; y+= stepY){
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

    const origin = toPixel(0,0);

    ctx.save();
    
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(0,origin.py);
    ctx.lineTo(rect.width,origin.py);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(origin.px, 0);
    ctx.lineTo(origin.px, rect.height);
    ctx.stroke();

    ctx.restore();
}



function computeView(a, b, c) {
  const vx = -b / (2 * a);
  const D = b * b - 4 * a * c;

  const xs = [vx, 0];
  if (D >= 0) {
    const sqrtD = Math.sqrt(D);
    xs.push((-b - sqrtD) / (2 * a), (-b + sqrtD) / (2 * a));
  }

  let xMin = Math.min(...xs);
  let xMax = Math.max(...xs);
  let spanX = xMax - xMin;
  if (spanX < 1e-6) spanX = 4;
  const padX = Math.max(spanX * 0.35, 2);
  xMin -= padX;
  xMax += padX;

  const samp = 50;
  let yMin = 0; 
  let yMax = 0;
  for (let i = 0; i <= samp; i++) {
    const x = xMin + (i / samp) * (xMax - xMin);
    const y = a * x * x + b * x + c;
    if (y < yMin) yMin = y;
    if (y > yMax) yMax = y;
  }
  let spanY = yMax - yMin;
  if (spanY < 1e-6) spanY = 4;
  const padY = Math.max(spanY * 0.2, 2);
  yMin -= padY;
  yMax += padY;

  return { xMin, xMax, yMin, yMax };
}


let currentAnimId = null;

function redraw(){
    setupCanvas();
    drawGrid();
}

window.addEventListener('resize',redraw);
redraw();