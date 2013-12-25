var Rectangle = require('minimath').Rectangle;
var World = require('knit').World;


var Constraint = require('knit').Constraint;
var PointMass = require('knit').PointMass;

var rand = require('minimath').random;
var dist = require('minimath').distance;
var lerp = require('minimath').lerp;
var smoothstep = require('minimath').smoothstep;
var domready = require('domready');
var ImageBuffer = require('imagebuffer');


require('raf.js');

domready(function() {
        var width = 500;
        var height = 300;
        var canvas = document.createElement("canvas");

        document.body.appendChild(canvas);
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        var context = canvas.getContext("2d");

        var clothWidth = width;
        var clothHeight = height;
        var start_x = 0;
        var start_y = 0;
        var spacing = 4;
        var stiff = 0.1;
        var tear = 110; //at what distance does a constraint "tear" ?

        var mouseInfluence = 15;
        var mouseScale = 0.5;
        var mouseMaxDist = 20;
        var steps = 60;

        var mouseTearInfluence = 10;
        var gravity = 0;
        var mass = 1;
        var useFloor = true;

        var cloth = false;

        var usePins = true; //we need to pin the cloth up if we have gravity enabled

        var world = new World({x:0, y:gravity});
        world.removablePins = true;
        world.setPinRemoveInfluence(15);

        if (useFloor) {
            world.bounds = new Rectangle(0, 0, width, height);
            world.floor = height - 5;
        }

        // $(document).keypress(function(e) {
            
        //     if (e.which == 32)
        //         createCloth();
        //     else if (e.which == 67 || e.which == 99) {
        //         var enableGravity = world.gravity.y===0;

        //         world.gravity.y = enableGravity ? 200 : 0;
        //         // stiff = enableGravity ? 0.9 : 0.1;
        //         tear = enableGravity ? 30 : 110;
        //         cloth = enableGravity;
        //         usePins = !enableGravity;
        //         clothWidth = enableGravity ? 200 : width;
        //         clothHeight = enableGravity ? 200 : height;
        //         spacing = 8;
        //         mass = 2;
        //         createCloth();
        //     }
        // });


        var img = new Image();
        img.onload = createCloth;
        img.src = "img/lenna.png";

        

        var mouseDown = false;


        function createCloth() {

            //draw the image to the canvas...
            context.drawImage(img, 0, 0);

            //now grab its pixel data
            var imageData = context.getImageData(0, 0, img.width, img.height);

            //make a new image buffer for direct manipulation
            // var buffer = new ImageBuffer(imageData);

            //util to create a lightweight object -- { r:0, g:0, b:0, a:0 }
            
            var particles = [];

            // for (var y=0; y<img.height; y+=spacing) {
            //     for (var x=0; x<img.width; x+=spacing) {
            //         var color = ImageBuffer.createColor();
            //         buffer.getPixelAt(x, y, color);

            //         particles.push({
            //             color: color,
            //             x: x,
            //             y: y
            //         });
            //     }
            // }

            context.clearRect(0, 0, width, height);


            world.points = [];
            // var rows = Math.floor( clothHeight/spacing );
            // var cols = Math.floor( clothWidth/spacing );
                
            var rows = Math.floor(img.height / spacing);
            var cols = Math.floor(img.width / spacing);
            var color = ImageBuffer.createColor();

            console.log("ROWS", rows, "COLS", cols, "IMGDATALEN", imageData.data.length)

            for (var y = 0; y < rows; y++) {
                for (var x = 0; x < cols; x++) {
                    var p = new PointMass(start_x + x * spacing, start_y + y * spacing, mass);

                    // p.color = "red";

                    var xi = x*spacing, 
                        yi = y*spacing;


                    var offset = ~~(xi + (yi * imageData.width));
                    offset *= 4;

                    // buffer.getPixelAt(xi, yi, color);

                    p.color = "rgb("+
                                ~~imageData.data[offset]  +", "+
                                ~~imageData.data[offset+1]+", "+
                                ~~imageData.data[offset+2]+")";

                    // console.log(x*spacing, y*spacing);
                    // p.color = "rgba("+color.r+", "+color.g+", "+color.b+", "+(color.a/255)+")";

                    var edge = !usePins 
                            ? (y === 0)
                            : (y === 0 || x === 0 || y === rows-1 || x === cols-1);

                    var size = spacing + ~~rand(-8, 8);
                    p.size = size;

                    if (x!==0)
                        p.attach(world.points[world.points.length - 1], size, stiff, tear);
                    if (edge)
                        p.pin(p.position.x, p.position.y);
                    if (y !== 0)
                        p.attach(world.points[ x + (y - 1) * (cols)], size, stiff, tear);

                    world.points.push(p);
                }
            }
            console.log(xi, yi);

        }
            
        requestAnimationFrame(update);    
        
        function update() {
            requestAnimationFrame(update);
            context.clearRect(0, 0, canvas.width, canvas.height);

            // context.drawImage(img, 0, 0);

            world.step(0.016);

            context.strokeStyle = 'rgba(0,0,0,0.5)';
            // context.globalCompositeOperation = 'source-over';
            //context.shadowColor = 'rgba(255,255,200, 0.7)';

            context.globalAlpha = 0.8;

            //context.beginPath(); //for line rendering
            var i = world.points.length;
            if (cloth) {
                context.beginPath();
            }
            while (i-- > 1) {
                var p = world.points[i];

                if (cloth) {
                    for (var j=0; j<p.constraints.length; j++) {
                        var c = p.constraints[j];
                        context.moveTo(c.p1.position.x, c.p1.position.y);
                        context.lineTo(c.p2.position.x, c.p2.position.y);
                    }
                } else {
                    //This is the point rendering (more like fluid)
                    if (p.constraints.length > 0) {
                        var c = p.constraints[0];
                        context.fillStyle = c.p1.color;
                        // var sz = 1.5;
                        var sz = p.size-1;
                        context.fillRect(c.p1.position.x, c.p1.position.y, sz, sz);
                    }
                }
            }
            if (cloth) {
                context.closePath();
                context.stroke();
            }
        };

        window.addEventListener("mousemove", function(ev) {
            if (mouseDown) {
                world.applyTear(ev.clientX, ev.clientY, mouseTearInfluence);
                world.applyMotion(ev.clientX, ev.clientY, mouseInfluence, mouseScale, mouseMaxDist);
            } else
                world.applyMotion(ev.clientX, ev.clientY, mouseInfluence, mouseScale, mouseMaxDist);
        });

    }

);