
var Rectangle = require('minimath').Rectangle;
var World = require('knit.js').World;

var Constraint = require('knit.js').Constraint;
var PointMass = require('knit.js').PointMass;

var rand = require('minimath').random;
var dist = require('minimath').distance;
var lerp = require('minimath').lerp;
var smoothstep = require('minimath').smoothstep;

var domready = require('domready');
var ImageBuffer = require('imagebuffer');

require('raf.js');
var Cloth = require('./Cloth');
var CanvasRenderer = require('./CanvasRenderer');
var WebGLRenderer = require('./WebGLRenderer');

var stats = require('./stats');

var dat = require('dat-gui');


var canvas = document.createElement("canvas");
canvas.width = 400;
canvas.height = 400;
var context = canvas.getContext("2d");

document.body.appendChild(canvas);

var colors = [];

var img = new Image();
img.onload = grab;
img.src = 'img/coach.jpg';




function grab() {
    context.drawImage(img, 0, 0);
    var data = context.getImageData(0, 0, img.width, img.height);
    for (var i=0; i<img.width*img.height; i++) {
        colors.push({
            r: data.data[i],
            g: data.data[i+1],
            b: data.data[i+2]
        });
    }
    
}

function start() {

    requestAnimationFrame(render);
}


function render() {
    requestAnimationFrame(render);
    canvas.width = img.width;
    canvas.height = img.height;
    context.clearRect(0, 0, img.width, img.height);

    context.globalAlpha = 0.2;
    context.drawImage(img, 0, 0);

    context.globalAlpha = 1;
    
}

domready(start);