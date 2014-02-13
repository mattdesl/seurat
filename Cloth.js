var Class = require('klasse');
var Particle = require('./Particle');

var Constraint = require('knit.js').Constraint;
var PointMass = require('knit.js').PointMass;

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
        this.tmpVec3 = new Vector4();

        this.randomizeSize = false;
        this.usePins = true;
        this.stiffness = 0.1;
        this.tear = 0;
        this.mass = 1.0;

        this.downsample = 4;

        this.sizeLow = -8;
        this.sizeHigh = 10;

        this.chromaInvert = false;
        this.particles = [];

        this.chromaKey = false;
        this.thresholdSensitivity = 0.04;
        this.smoothing = 0.1;

        /** NOTE: this is a simple array for compatibility with dat.gui */
        this.averageColor = [ 255, 255, 255, 1.0 ];


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


    findAverage: function(image, cx, cy, radius) {
        var ctx = this.context,
            spacing = this.spacing,
            tmpVec = this.tmpVec,
            tmpVec2 = this.tmpVec2,
            tmpVec3 = this.tmpVec3;

        //the size of the image we're sampling
        var srcWidth = image.width/this.downsample;
        var srcHeight = image.height/this.downsample;

        //the output size of our cloth
        var dstWidth = this.width;
        var dstHeight = this.height;

        var x_ratio = srcWidth / dstWidth;
        var y_ratio = srcHeight / dstHeight;

        if (typeof cx !== "number")
            cx = dstWidth/2;
        if (typeof cy !== "number")
            cy = dstHeight/2;
        if (typeof radius !== "number")
            radius = 0.25;

        cx *= x_ratio;
        cy *= y_ratio;

        //draw image to expected size
        ctx.drawImage(image, 0, 0, srcWidth, srcHeight);

        //now grab its pixel data
        var imageData = ctx.getImageData(0, 0, srcWidth, srcHeight);

        var data = imageData.data;

        tmpVec.set(0, 0, 0, 1);

        var sum = tmpVec2.set(0, 0, 0, 0);
        var count = 0;

        //Run through and get the average color
        for (var i=0; i<this.particles.length; i++) {
            var p = this.particles[i];

            var x = ~~(p.imgX * spacing * x_ratio);
            var y = ~~(p.imgY * spacing * y_ratio);

            var offset = ~~(x + (y * srcWidth));
            offset *= 4;

            tmpVec.x = data[offset]/255;
            tmpVec.y = data[offset+1]/255;
            tmpVec.z = data[offset+2]/255;
            tmpVec.w = 1.0;

            var dx = (cx - x) / srcWidth;
            var dy = (cy - y) / srcHeight;
            var len = Math.sqrt(dx * dx + dy * dy);

            if (len < radius) {
                //p.color.copy(tmpVec);

                sum.add(tmpVec);
                count ++;
            }
        }

        sum.x /= count;
        sum.y /= count;
        sum.z /= count;
        sum.w /= count;
        
        this.averageColor[0] = ~~(sum.x * 255);
        this.averageColor[1] = ~~(sum.y * 255);
        this.averageColor[2] = ~~(sum.z * 255);
        this.averageColor[3] = sum.w;
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
            tmpVec2 = this.tmpVec2,
            tmpVec3 = this.tmpVec3;

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

        tmpVec.x = this.averageColor[0]/255;
        tmpVec.y = this.averageColor[1]/255;
        tmpVec.z = this.averageColor[2]/255;
        tmpVec.w = this.averageColor[3];
        // tmpVec.copy(this.averageColor);

        var thresholdSensitivity = this.thresholdSensitivity;
        var smoothing = this.smoothing;



        var chroma = this.chromaKey;


        for (var i=0; i<this.particles.length; i++) {
            var p = this.particles[i];

            var x = ~~(p.imgX * spacing * x_ratio);
            var y = ~~(p.imgY * spacing * y_ratio);

            var offset = ~~(x + (y * srcWidth));
            offset *= 4;

            p.color.x = data[offset]/255;
            p.color.y = data[offset+1]/255;
            p.color.z = data[offset+2]/255;

            if (chroma) {
                var textureColor = tmpVec2.copy(p.color);
                
                //convert to YUV
                var maskY = 0.2989 * tmpVec.x + 0.5866 * tmpVec.y + 0.1145 * tmpVec.z;
                var maskCr = 0.7132 * (tmpVec.x - maskY);
                var maskCb = 0.5647 * (tmpVec.z - maskY);

                var Y = 0.2989 * textureColor.x + 0.5866 * textureColor.y + 0.1145 * textureColor.z;
                var Cr = 0.7132 * (textureColor.x - Y);
                var Cb = 0.5647 * (textureColor.z - Y);

                var dx = maskCr - Cr;
                var dy = maskCb - Cb;
                var yuvDist = Math.sqrt(dx * dx + dy * dy);

                var blendValue = smoothstep(thresholdSensitivity, thresholdSensitivity + smoothing, 
                                        yuvDist);

                p.size =  p.originalSize * (!this.chromaInvert ? (1-blendValue) : blendValue);
                
                for (var j=0; j<p.pointMass.constraints.length; j++) {
                    var c = p.pointMass.constraints[j];
                    // c.stiffness = Math.min(0.6, Math.max(0.1, blendValue));
                    // c.restingDistance = blendValue > 0.5 ? -2 : 2;

                    c.restingDistance = p.originalSize * (1-blendValue);

                    // p.pointMass.constraints[j].stiffness = Math.min(0.5, Math.max(0.1, 1-dist));
                } 
            }
                
        }

        // redParticle.size = 200;

    }
})



module.exports = Cloth;
