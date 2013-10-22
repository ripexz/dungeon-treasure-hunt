hunt.screens["settings"] = (function() {
	var dom = hunt.dom,
		game = hunt.game,
		firstRun = true;

	function setup() {
		dom.bind("#settings", "click", function(e) {
			game.showScreen("main-menu");
		});
	}

	function run() {
		if ( firstRun ) {
			setup();
			firstRun = false;
		}
	}

	return {
		run: run
	};
})();