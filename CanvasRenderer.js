var Class = require('klasse');

var CanvasRenderer = new Class({
	
    initialize: function CanvasRenderer(width, height, canvas) {
        if (!canvas) 
            canvas = document.createElement("canvas");
        this.width = width;
        this.height = height;
        this.canvas = canvas;

        this.context = this.canvas.getContext("2d");
    },

    resize: function(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    },

	draw: function(cloth) {
        var context = this.context;
        context.clearRect(0, 0, this.width, this.height);

        context.save();
        context.translate(this.width/2 - cloth.width/2,
                        this.height/2 - cloth.height/2)
        context.globalAlpha = 1.0;
        for (var i=0; i<cloth.particles.length; i++) {
            var p = cloth.particles[i];
            var pm = p.pointMass;

            context.fillStyle = p.color;

            //bit shift zero is a quick way to clamp to >= 0 and floor
            context.fillStyle = "rgb("+
                            ((p.color.x*255) >> 0)+", "+
                            ((p.color.y*255) >> 0)+", "+
                            ((p.color.z*255) >> 0)+")";
            
            var sz = p.size;

            context.fillRect(pm.position.x, pm.position.y, sz, sz);
        }
        context.restore();
	}
});

module.exports = CanvasRenderer;