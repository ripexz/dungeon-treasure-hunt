hunt.screens["game-screen"] = (function(){
	var board = hunt.board,
		audio = hunt.audio,
		display = hunt.display,
		settings = hunt.settings,
		input = hunt.input,
		player = hunt.player,
		dom = hunt.dom,
		gameState,
		$ = dom.$,
		firstRun = true;

	function startGame() {
		gameState = {
			level: 0,
			score: 0,
			timer: 0, //setTimeout reference
			startTime: 0, //time at the start of the level
			endTime: 0 //time to game over
		};
		
		player.alive = true;
		player.bombCountMax = 1;
		player.bombCount = player.bombCountMax;
		player.fireSize = 1;

		board.initialise(function(){
			display.initialise(function(){
				display.redraw(board.getBoard(), function(){
					audio.initialise();
					advanceLevel();
				});
			});
		});
	}

	function advanceLevel() {
		gameState.level++;
		audio.play("levelup");
		board.initialise(function(){
			player.bombCount = player.bombCountMax;
			display.initialise(function(){
				display.redraw(board.getBoard(), function(){
					announce("Level " + gameState.level);
				});
			});
		});

		if (gameState.level > 1) {
			var baseScore = 500,
				delta = gameState.startTime + gameState.endTime - Date.now(),
				percent = (delta / gameState.endTime) * 100;

			addScore(baseScore + Math.round(percent*5));
		}
				
		updateGameInfo();
		gameState.startTime = Date.now();
		gameState.endTime = settings.baseLevelTimer *
			Math.pow(gameState.level, -0.2 * gameState.level);
		setLevelTimer(true);
	}

	function setLevelTimer(reset) {
		if (gameState.timer) {
			clearTimeout(gameState.timer);
			gameState.timer = 0;
		}
		if (reset) {
			gameState.startTime = Date.now();
			gameState.endTime =
				settings.baseLevelTimer *
				Math.pow(gameState.level, 
						 -0.05 * gameState.level);
		}
		var delta = gameState.startTime +
					gameState.endTime - Date.now(),
			percent = (delta / gameState.endTime) * 100,
			progress = $("#game-screen .time .bar")[0];
		if (delta < 0) {
			gameOver();
		} else {
			progress.style.width = percent + "%";
			gameState.timer = setTimeout(function() {
				setLevelTimer(false);
			}, 30);
		}
	}

	function addScore(points) {
		gameState.score += points;
		updateGameInfo();
	}

	function updateGameInfo() {
		$("#game-screen .score span")[0].innerHTML = gameState.score;
		//$("#game-screen .level span")[0].innerHTML = gameState.level;
	}

	function run() {
		if ( firstRun ) {
			setup();
			firstRun = false;
		}
		startGame();
	}

	function setup() {
		input.initialise();
		input.bind("moveUp", moveUp);
		input.bind("moveDown", moveDown);
		input.bind("moveLeft", moveLeft);
		input.bind("moveRight", moveRight);
		input.bind("plantBomb", plantBomb);
	}

	function moveUp() {
		movePlayer(0, -1, "up");
	}

	function moveDown() {
		movePlayer(0, 1, "down");
	}

	function moveLeft() {
		movePlayer(-1, 0, "left");
	}

	function moveRight() {
		movePlayer(1, 0, "right");
	}

	function movePlayer(x, y, direction) {
		var newX = player.x + x,
			newY = player.y + y;
		if (player.alive === true) {
			board.move(player.x, player.y, newX, newY, direction, playBoardEvents);
		}
	}

	function plantBomb() {
		var x = player.x,
			y = player.y,
			fireSize = player.fireSize;
		if (player.alive === true && player.bombCount > 0) {
			board.plantBomb(x, y, fireSize, playBoardEvents);
		}
	}

	function playBoardEvents(events) {
		if ( events.length > 0 ) {
			var boardEvent = events.shift(),
				next = function() {
					playBoardEvents(events);
				};
			switch (boardEvent.type) {
				case "move":
					display.movePlayer(boardEvent.data, next);
					break;
				case "score":
					addScore(boardEvent.data);
					next();
					break;
				case "plantBomb":
					display.plantBomb(boardEvent.data, next);
					player.bombCount -= 1;
					break;
				case "explodeBomb":
					display.explodeBomb(boardEvent.data, next);
					audio.play("explode");
					player.bombCount += 1;
					break;
				case "clearFire":
					display.clearFire(boardEvent.data, next);
					break;
				case "gameOver":
					gameOver();
					break;
				case "nextLevel":
					advanceLevel();
					break;
				default:
					next();
					break;
			}
		}
		else {
			display.redraw(board.getBoard(), function(){});
		}
	}

	function announce(str) {
		var element = $("#game-screen .announcement")[0];
		element.innerHTML = str;
		if (Modernizr.cssanimations) {
			dom.removeClass(element, "zoomfade");
			setTimeout(function() {
				dom.addClass(element, "zoomfade");
			}, 1);
		} else {
			dom.addClass(element, "active");
			setTimeout(function() {
				dom.removeClass(element, "active");
			}, 1000);
		}
	}

	function gameOver() {
		audio.play("gameover");
		player.alive = false;
		gameState = {};
		display.gameOver(function() {
			announce("Game over");
			setTimeout(function(){
				hunt.game.showScreen("main-menu");
			}, 5000)
		});
	}

	return {
		run: run
	};
})();