
var startTime = 0;
var msSum = 0;
var frames = 0;
var prevTime = 0;

var isFPS = true;

module.exports.create = function() {
	var txt = document.createElement("div");
	txt.innerHTML = isFPS ? "FPS: --" : "ms: --";

	var func = function(ev) {
		isFPS = !isFPS;
	};
	txt.addEventListener("mousedown", func, true);
	txt.addEventListener("touchdown", func, true);
	return txt;
}

module.exports.begin = function() {
	startTime = Date.now();
}

module.exports.end = function(print) {
	var endTime = Date.now();

	var ms = Math.max(0, endTime - startTime);
	msSum += ms;

	// msText.textContent = ms + ' MS';
	// updateGraph( msGraph, Math.min( 30, 30 - ( ms / 200 ) * 30 ) );

	frames++;
	// console.log(startTime, prevTime);
	if (startTime > prevTime + 1000) {
		var fps = Math.round((frames * 1000) / (startTime - prevTime));
		var avgMS = (msSum / frames)
		if (print === true)
			console.log("FPS: "+fps + ", avg MS: "+avgMS);
		else if (print)
			print.innerHTML = isFPS ? ("FPS: "+fps) : ("ms: "+avgMS);

		msSum = 0;
		prevTime = startTime;
		frames = 0;
	}
}