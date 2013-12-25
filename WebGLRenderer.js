var Class = require('klasse');
var WebGLContext = require('kami').WebGLContext;
var Texture = require('kami').Texture;
var SpriteBatch = require('kami').SpriteBatch;

var CanvasRenderer = new Class({
	
    initialize: function CanvasRenderer(width, height, canvas) {
        if (!canvas)
            canvas = document.createElement("canvas");
        this.canvas = canvas;

        this.context = new WebGLContext(width, height, canvas);

        this.batch = new SpriteBatch(this.context);

        //simple white square
        // this.texture = new Texture(this.context, 1, 1, 
        //                         Texture.Format.RGBA, 
        //                         Texture.DataType.UNSIGNED_BYTE, 
        //                         new Uint8Array([255,255,255,255]));
        this.texture = new Texture(this.context, "img/particle.png");
        this.texture.setFilter(Texture.Filter.LINEAR);
    },

    resize: function(width, height) {
        this.context.resize(width, height);
    },

	draw: function(cloth) {
        var context = this.context,
            gl = context.gl,
            tex = this.texture,
            batch = this.batch;
        
        gl.clear(gl.COLOR_BUFFER_BIT);

        // batch._blendEnabled = false;
        batch.resize(context.width, context.height);
        batch.begin();


        var tx = context.width/2 - cloth.width/2;
        var ty = context.height/2 - cloth.height/2;

        for (var i=0; i<cloth.particles.length; i++) {
            var p = cloth.particles[i];
            var pm = p.pointMass;
            var c = p.color;

            var v = pm.velocity.items;
            // var vlen = Math.sqrt(v[0] * v[0] + v[1] * v[1]);


            //context.fillStyle = p.color;
            batch.setColor(c.x, c.y, c.z, c.w);
            var sz = p.size;
            batch.draw(tex, pm.position.x + tx - sz/2, pm.position.y + ty - sz/2, sz, sz);
        }

        // console.log(vlen);

        batch.end();

        // context.save();
        // context.translate(this.width/2 - cloth.width/2,
        //                 this.height/2 - cloth.height/2)
        // context.globalAlpha = 1.0;
        // for (var i=0; i<cloth.particles.length; i++) {
        //     var p = cloth.particles[i];
        //     var pm = p.pointMass;

        //     context.fillStyle = p.color;
        //     var sz = p.size;

        //     context.fillRect(pm.position.x, pm.position.y, sz, sz);
        // }
        // context.restore();
	}
});

module.exports = CanvasRenderer;