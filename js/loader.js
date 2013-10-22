var hunt = {
	screens: {},
	player: {
		x: -1,
		y: -1,
		alive: true,
		direction: "down",
		fireSize: 1,
		bombCount: 1
	},
	settings: {
		rows: 16,
		cols: 16,
		bombTime: 1200,
		baseLevelTimer: 45000,
		controls: {
			KEY_UP: "moveUp",
			KEY_LEFT: "moveLeft",
			KEY_DOWN: "moveDown",
			KEY_RIGHT: "moveRight",
			KEY_ENTER: "plantBomb",
			KEY_SPACE: "plantBomb",
		},
		powerUps: [
			"fireUp",
			"bombUp",
			"treasure1",
			"treasure2",
			"treasure3"
		]
	},
	images: {}
};

window.addEventListener("load", function() {
	// determine grid size
	var gridProto = document.getElementById("grid-proto"),
		rect = gridProto.getBoundingClientRect();
	hunt.settings.gridSize = rect.width;

	var numPreload = 0,
		numLoaded = 0;
	yepnope.addPrefix("loader", function(resource){
		var isImage = /.+\.(jpg|png|gif)$/i.test(resource.url);
		resource.noexec = isImage;
		numPreload++;
		resource.autoCallback = function(e) {
			numLoaded++;
		}
		if ( isImage ) {
			var image = new Image();
			image.src = resource.url;
			hunt.images[resource.url] = image;
		}
		return resource;
	});

	function getLoadProgress() {
		if ( numPreload > 0 ) {
			return numLoaded / numPreload;
		}
		else {
			return 0;
		}
	}

	// stage 1
	Modernizr.load([{
		load: [
			"js/sizzle.min.js",
			"js/dom.js",
			"js/requestAnimationFrame.js",
			"js/game.js",
			"js/screen.splash.js"
		],
		// after load:
		complete: function() {
			hunt.game.setup();
			hunt.game.showScreen("splash-screen", getLoadProgress);
		}
	}]);

	// stage 2
	Modernizr.load([{
		load: [
			"loader!js/board.js",
			"loader!js/audio.js",
			"loader!js/display.canvas.js",
			"loader!js/input.js",
			"loader!js/screen.main-menu.js",
			"loader!js/screen.game.js",
			"loader!js/screen.about.js",
			"loader!js/screen.settings.js",
			"loader!img/player.png",
			"loader!img/exit.png",
			"loader!img/fire.png",
			"loader!img/bomb.png",
			"loader!img/ground.png",
			"loader!img/brick.png",
			"loader!img/solid.png",
			"loader!img/bombUp.png",
			"loader!img/fireUp.png",
			"loader!img/treasure1.png",
			"loader!img/treasure2.png",
			"loader!img/treasure3.png"
		]
	}]);
}, false);