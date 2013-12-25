var Class = require('klasse');
var Particle = require('./Particle');

var Constraint = require('knit').Constraint;
var PointMass = require('knit').PointMass;

var rand = require('minimath').random;
var Vector4 = require('vecmath').Vector4;
var smoothstep = require('minimath').smoothstep;

var Cloth = new Class({

    initialize: function Cloth(width, height, spacing) {
        this.buffer = document.createElement("canvas");
        this.context = this.buffer.getContext("2d");

        this.width = width || 0;
        this.height = height || 0;
        this.spacing = spacing || 10;

        this.tmpVec = new Vector4();
        this.tmpVec2 = new Vector4();

        this.randomizeSize = false;
        this.usePins = true;
        this.stiffness = 0.1;
        this.tear = 0;
        this.mass = 1.0;

        this.downsample = 4;

        this.sizeLow = -8;
        this.sizeHigh = 10;

        this.particles = [];



        if (this.width !== 0 || this.height !== 0)
            this.setup(width, height, spacing);
    },

    setup: function(width, height, spacing) {
        var particles = this.particles;

        //clear points
        particles.length = 0; 

        this.buffer.width = width;
        this.buffer.height = height;

        //setup properties
        this.width = width;
        this.height = height;
        spacing = spacing || 10;
        this.spacing = spacing;

        var start_x = 0;
        var start_y = 0;
        var usePins = this.usePins; // maybe want to play with this later

        //move these out
        var stiff = this.stiffness,
            mass = this.mass,
            tear = this.tear; //at what distance does a constraint "tear" ?

        var rows = Math.floor(height / spacing);
        var cols = Math.floor(width / spacing);

        console.log(rows, cols);

        //create fabric
        for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
                var p = new PointMass(start_x + x * spacing, start_y + y * spacing, mass);

                //whether to pin to edge
                var edge = !usePins 
                        ? (y === 0)
                        : (y === 0 || x === 0 || y === rows-1 || x === cols-1);

                //size of this particle
                var size = spacing;
                if (this.randomizeSize) {
                    size += ~~rand(this.sizeLow, this.sizeHigh);
                }

                var other;
                if (x!==0) {
                    other = particles[particles.length - 1];
                    if (other) {
                        p.attach(other.pointMass, size, stiff, tear);    
                    }
                }
                if (edge)
                    p.pin(p.position.x, p.position.y);
                if (y !== 0) {
                    other = particles[ x + (y - 1) * (cols)];
                    if (other)
                        p.attach(other.pointMass, size, stiff, tear);
                }

                // var xi = x*spacing,
                //     yi = y*spacing;

                var particle = new Particle(x, y, p, size);

                particles.push(particle);
            }

        }
    },

    /**
     * Called to render the image onto this "virtual cloth."
     * This is done by drawing the image to an off-screen buffer
     * and sampling from its pixel data.
     * @param  {[type]} image [description]
     * @return {[type]}       [description]
     */
    render: function(image) {
        var ctx = this.context,
            spacing = this.spacing,
            tmpVec = this.tmpVec,
            tmpVec2 = this.tmpVec2;

        //the size of the image we're sampling
        var srcWidth = image.width/this.downsample;
        var srcHeight = image.height/this.downsample;

        //the output size of our cloth
        var dstWidth = this.width;
        var dstHeight = this.height;

        var x_ratio = srcWidth / dstWidth;
        var y_ratio = srcHeight / dstHeight;


        //draw image to expected size
        ctx.drawImage(image, 0, 0, srcWidth, srcHeight);

        //now grab its pixel data
        var imageData = ctx.getImageData(0, 0, srcWidth, srcHeight);

        var data = imageData.data;

        // tmpVec.set(192/255, 86/255, 93/255, 1.0);
        tmpVec.set(0,0,0, 1.0);

        var redParticle = null;
        var minDist = Number.MAX_VALUE;

        for (var i=0; i<this.particles.length; i++) {
            var p = this.particles[i];

            var x = ~~(p.imgX * spacing * x_ratio);
            var y = ~~(p.imgY * spacing * y_ratio);

            var offset = ~~(x + (y * srcWidth));
            offset *= 4;

            p.color.x = data[offset]/255;
            p.color.y = data[offset+1]/255;
            p.color.z = data[offset+2]/255;

            tmpVec2.copy(p.color);

            var dist = tmpVec.distance(tmpVec2);
            p.size = p.originalSize * (dist);

            var alpha = dist;
            // p.color.w = Math.max(0, Math.min(1, dist));

            for (var j=0; j<p.pointMass.constraints.length; j++) {
                var c = p.pointMass.constraints[j];
                c.stiffness = Math.min(0.9, Math.max(0.1, 1-dist));
                // c.restingDistance = alpha > 0.5 ? 1 : -1;

                p.pointMass.constraints[j].restingDistance = p.size;

                // p.pointMass.constraints[j].stiffness = Math.min(0.5, Math.max(0.1, 1-dist));
            }
            // p.pointMass.mass = p.originalMass * (dist*0.8);

            // if (dist < minDist) {
            //     minDist = dist;
            //     redParticle = p;
            // }


            // p.color.w = valB/4;

            // p.pointMass.position.items[0] += valB/40;
            // p.pointMass.position.items[1] += valB/40;

            // var dist = tmpVec.scale(1).distance(tmpVec2.scale(1));
            // p.color.w = Math.max(0, Math.min(dist, 1));
        }

        // redParticle.size = 200;
        console.log(redParticle);

    }
})



module.exports = Cloth;
