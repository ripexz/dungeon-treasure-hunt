hunt.input = (function(){
	var dom = hunt.dom,
		$ = dom.$,
		settings = hunt.settings,
		inputHandlers;
	var keys = {
		37: "KEY_LEFT",
		38: "KEY_UP",
		39: "KEY_RIGHT",
		40: "KEY_DOWN",
		13: "KEY_ENTER",
		32: "KEY_SPACE"
	}

	function initialise() {
		inputHandlers = {};
		var board = $("#game-screen .game-board")[0];
		dom.bind(document, "keydown", function(e) {
			var keyName = keys[e.keyCode];
			if ( keyName && settings.controls[keyName] ) {
				e.preventDefault();
				trigger(settings.controls[keyName]);
			}
		});
	}

	function bind(action, handler) {
		if ( !inputHandlers[action] ) {
			inputHandlers[action] = [];
		}
		inputHandlers[action].push(handler);
	}

	function trigger(action) {
		var handlers = inputHandlers[action],
			args = Array.prototype.slice.call(arguments, 1);
		if ( handlers ) {
			for ( var i = 0; i < handlers.length; i++ ) {
				handlers[i].apply(null, args);
			}
		}
	}

	return {
		initialise: initialise,
		bind: bind
	};
})();