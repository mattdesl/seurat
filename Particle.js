var Class = require("klasse");
var Vector4 = require('vecmath').Vector4;

var Particle = new Class({

    initialize: function Particle(imgX, imgY, pointMass, size, color) {
        this.imgX = imgX || 0;
        this.imgY = imgY || 0;
        this.pointMass = pointMass || null;
        this.size = size || 0;
        this.originalSize = this.size;
        this.originalMass = 1.0;
        
        /**
         * The color in normalized float (0.0 to 1.0), 
         * an object with r g b a.
         *
         * @property color
         * @type {Object}
         */
        this.color = color || new Vector4(0, 0, 0, 1);
    }
});

module.exports = Particle;