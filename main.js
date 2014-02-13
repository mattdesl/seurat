
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


//polyfill
if (!navigator.getUserMedia)
    navigator.getUserMedia = navigator.getUserMedia 
                        || navigator.webkitGetUserMedia 
                        || navigator.mozGetUserMedia 
                        || navigator.msGetUserMedia;
if (!window.URL)
    window.URL = window.URL 
                    || window.webkitURL 
                    || window.mozURL 
                    || window.msURL;


domready(function() {

        var width = window.innerWidth;
        var height = window.innerHeight;
        var canvas = document.createElement("canvas");

        document.body.appendChild(canvas);
        document.body.style.background = "black";

        canvas.width = width;
        canvas.height = height;

        var fpsText = stats.create();
        fpsText.style.position = "fixed";
        fpsText.style.top = "10px";
        fpsText.style.left = "10px";
        fpsText.style.color = "#d3d3d3";
        document.body.appendChild(fpsText);

        var hasWebGL = true;
        
        // var renderer = new CanvasRenderer(width, height, canvas);
        var renderer = new WebGLRenderer(width, height, canvas);

        //A dummy image until we can load the real webcam
        var img = new Image();
        img.onload = start;
        img.src = "img/lenna.png";

        var currentImage = img;
        var video;
        var hasVideo = false;

        //some settings for the physics
        
        this.spacing = 7;
        var clothWidth = 512;
        var clothHeight = 512;
        var world = new World({x:0, y:0});

        //more physics settings
        var cloth = new Cloth();
        cloth.sizeLow = -4;
        cloth.sizeHigh = 4;
        cloth.randomizeSize = false;
        cloth.usePins = false;
        cloth.stiffness = 0.05;
        cloth.mass = 1.0;



        


        function start() {
            reset();

            //first render with lenna        
            // cloth.render(img);

            setTimeout(update, 500);

            loadVideo();

            ///eughh ugly
            window.findAverage();
        }

        function loadVideo() {
            if (navigator.getUserMedia && window.URL && window.URL.createObjectURL) {
                //create a <video> element
                video = document.createElement("video");
                video.setAttribute("autoplay", "");
                video.width = clothWidth;
                video.height = clothHeight;
                video.style.background = "black";
                // document.body.appendChild(video);

                video.addEventListener("play", function() {
                    reset();
                }, true);

                console.log("GETTING VIDEO");
                navigator.getUserMedia({video: true}, function(stream) {
                    video.src = window.URL.createObjectURL(stream);
                    hasVideo = true;

                }, function() {
                    //err handling...
                });

            }
        }


        function reset() {

            world.points.length = 0;
            cloth.setup( clothWidth, clothHeight, ~~this.spacing );

            for (var i=0; i<cloth.particles.length; i++) {
                var pm = cloth.particles[i];
                if (pm && pm.pointMass)
                    world.addPoint(pm.pointMass);
            }

            if (!hasVideo) {
                // cloth.findAverage(img);
                cloth.render(img);
            } else {
                // cloth.findAverage(video);
            }
        }

        var gui = new dat.GUI();
        var avgCol = null;
        this.reset = reset;
        this.findAverage = function() {
            cloth.findAverage(hasVideo ? video : img);

            if (avgCol) {
                avgCol.updateDisplay();
            }
            
        }

        setupGUI();

        function addGUI(folder, obj, prop, min, max, step) {
            var r = folder.add(obj, prop, min, max, step);
            r.onFinishChange(function(v) {
                reset();
            });
            return r;
        }

        function addColor(folder, obj, prop) {
            var r = folder.addColor(obj, prop);

            r.onChange(function(v) {

                if (this.colorTimeout) {
                    clearTimeout(this.colorTimeout);    
                    this.colorTimeout = null;
                }
                this.colorTimeout = setTimeout(reset, 500);
            });
            return r;
        }

        function setupGUI() {
            var phys = gui.addFolder("cloth");
            addGUI(phys, cloth, 'randomizeSize');
            addGUI(phys, cloth, 'usePins');
            addGUI(phys, this, 'spacing', 5, 15, 1);
            addGUI(phys, cloth, 'stiffness', 0.01, 0.9999);
            addGUI(phys, cloth, 'mass', 0, 100);
            
            var color = gui.addFolder("processing");
            addGUI(color, cloth, 'chromaKey');
            addGUI(color, cloth, 'chromaInvert');
            addGUI(color, renderer, 'fadeAway');
            avgCol = addColor(color, cloth, 'averageColor');
            addGUI(color, cloth, 'thresholdSensitivity', 0.0, 0.25);
            addGUI(color, cloth, 'smoothing', 0.0, 0.5);
            addGUI(color, this, 'findAverage');
            // addGUI(phys, )


            addGUI(gui, this, 'reset');
            phys.open();
            color.open();
        }

        var now, 
            lastTime = Date.now(),
            sampleInterval = 1/15,
            sampleTimer = 0;

        function update() {
            stats.begin();

            requestAnimationFrame(update);

            //get delta time for smooth animation
            now = Date.now();
            var delta = (now - lastTime) / 1000;
            lastTime = now;

            sampleTimer += delta;
            if (hasVideo && sampleTimer > sampleInterval) {
                sampleTimer = 0; //not that important if we lose some precision
                cloth.render(video);


            }

            world.step(delta);
            renderer.draw(cloth);

            stats.end(fpsText);
        };  

        var mouseDown = false;

        var mouseInfluence = 15;
        var mouseTearInfluence = 5;
        var mouseScale = 0.55;
        var mouseMaxDist = 20;

        window.addEventListener("keydown", function(ev) {
            var c = typeof ev.which === "number" ? ev.which : ev.keyCode;
            if (c === 32) { 
                ev.preventDefault();
                reset();
            }
        });

        window.addEventListener("mousedown", function() {
            mouseDown = true;
        }, true);
        window.addEventListener("mouseup", function() {
            mouseDown = false;
        }, true);

        window.addEventListener("resize", function() {
            renderer.resize(window.innerWidth, window.innerHeight);
        }, true);

        window.addEventListener("mousemove", function(ev) {
            //translate the mouse coords to center
            var x = ev.clientX;
            var y = ev.clientY;
            x -= canvas.width/2 - cloth.width/2;
            y -= canvas.height/2 - cloth.height/2;

            if (mouseDown) {
                world.applyTear(x, y, mouseTearInfluence);
                world.applyMotion(x, y, mouseInfluence, mouseScale, mouseMaxDist);
            } else
                world.applyMotion(x, y, mouseInfluence, mouseScale, mouseMaxDist);
        });
    }
);