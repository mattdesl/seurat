var Class = require('klasse');


var Rectangle = require('minimath').Rectangle;
var World = require('knit.js').World;

var Constraint = require('knit.js').Constraint;
var PointMass = require('knit.js').PointMass;

var rand = require('minimath').random;
var dist = require('minimath').distance;
var lerp = require('minimath').lerp;
var smoothstep = require('minimath').smoothstep;

var ImageBuffer = require('imagebuffer');

var Cloth = require('./Cloth');
var CanvasRenderer = require('./CanvasRenderer');
var WebGLRenderer = require('./WebGLRenderer');

var stats = require('./stats');

var dat = require('dat-gui');

var Controller = new Class({

    initialize: function() {
        var width = window.innerWidth;
        var height = window.innerHeight;
        var canvas = document.createElement("canvas");

        document.body.appendChild(canvas);
        document.body.style.background = "#aaa";

        canvas.width = width;
        canvas.height = height;

        var fpsText = stats.create();
        fpsText.style.position = "fixed";
        fpsText.style.top = "10px";
        fpsText.style.left = "10px";
        fpsText.style.color = "#d3d3d3";
        document.body.appendChild(fpsText);

        this.hasWebGL = true;
        
        if (this.hasWebGL)
            this.renderer = new WebGLRenderer(width, height, canvas);
        else
            this.renderer = new CanvasRenderer(width, height, canvas);
        
        //A dummy image until we can load the real webcam
        this.img = new Image();
        this.img.onload = this.start.bind(this);
        this.img.src = "img/lenna.png";


        //some settings for the physics
        this.gravity = 0;
        this.spacing = 5;
        this.clothWidth = 512;
        this.clothHeight = 512;
        this.world = new World({x:0, y:this.gravity});

        //more physics settings
        var cloth = new Cloth();
        cloth.sizeLow = -4;
        cloth.sizeHigh = 4;
        cloth.randomizeSize = true;
        cloth.usePins = true;
        cloth.stiffness = 0.05;
        cloth.mass = 1.0;

        //instance members
        this.cloth = cloth;
        this.width = width;
        this.height = height;
        this.canvas = canvas;
        this.fpsText = fpsText;
        this.video = null;
        this.hasVideo = false;

        this.__update = this.update.bind(this);
    },

    start: function() {

        this.reset();

        //first render with lenna        
        // cloth.render(img);

        this.update();

        this.loadVideo();
    },

    reset: function() {

    },

    update: function() {
        requestAnimationFrame( this.__update );

    }
});

module.exports = Controller;