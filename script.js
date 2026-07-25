
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
        console.log('parsed:' , {a,b,c});
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
    const px = 
}