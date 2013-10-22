hunt.game = (function() {
	var dom = hunt.dom,
		$ = dom.$;

	//display selected screen
	function showScreen(screenId) {
		var currentScreen = $("#game .screen.active")[0],
			screen = $("#" + screenId)[0];

		if (currentScreen) {
			dom.removeClass(currentScreen, "active");
		}

		// extract parameters from args
		var args = Array.prototype.slice.call(arguments, 1);
		// run the screen module
		hunt.screens[screenId].run.apply(hunt.screens[screenId], args);
		// show screen
		dom.addClass(screen, "active");		
	}

	// create background pattern
	function createBackground() {
		if ( !Modernizr.canvas ) return;

		var canvas = document.createElement("canvas"),
			ctx = canvas.getContext("2d"),
			background = $("#game .background")[0],
			rect = background.getBoundingClientRect(),
			gradient, i;
		canvas.width = rect.width;
		canvas.height = rect.height;
		ctx.scale(rect.width, rect.height);
		gradient = ctx.createRadialGradient(
			0.25, 0.25, 0.5,
			0.25, 0.25, 1
		);
		gradient.addColorStop(0, "rgb(50,50,50)");
		gradient.addColorStop(1, "rgb(10,10,10)");
		ctx.fillStyle = gradient;
		ctx.fillRect(0, 0, 1, 1);
		ctx.strokeStyle = "rgba(255,255,255,0.02)";
		ctx.strokeStyle = "rgba(0,0,0,0.2)";
		ctx.lineWidth = 0.008;
		/*ctx.beginPath();
		for ( i = 0; i < 2; i += 0.020 ) {
			ctx.moveTo(i, 0);
			ctx.lineTo(i-1, 1);
		}
		ctx.stroke();*/
		background.appendChild(canvas);
	}

	function setup() {
		createBackground();
	}

	return {
		showScreen: showScreen,
		setup: setup
	};
})();