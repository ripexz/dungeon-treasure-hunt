hunt.display = (function(){
	var dom = hunt.dom,
		$ = dom.$,
		animations = [],
		previousCycle,
		canvas, ctx,
		cols, rows,
		gridSize,
		squares,
		bombTime = hunt.settings.bombTime,
		firstRun = true;

	function addAnimation(runTime, fncs) {
		var anim = {
			runTime: runTime,
			startTime: Date.now(),
			pos: 0,
			fncs: fncs
		};
		animations.push(anim);
	}

	function renderAnimations(time, lastTime) {
		var anims = animations.slice(0),
			n = anims.length,
			animTime,
			anim, i;

		for ( i = 0; i < n; i++ ) {
			anim = anims[i];
			if ( anim.fncs.before ) {
				anim.fncs.before(anim.pos);
			}
			anim.lastPos = anim.pos;
			animTime = (lastTime - anim.startTime);
			anim.pos = animTime / anim.runTime;
			anim.pos = Math.max(0, Math.min(1, anim.pos));
		}
		animations = []; // reset animation list
		for ( i = 0; i < n; i++ ) {
			anim = anims[i];
			anim.fncs.render(anim.pos, anim.pos - anim.lastPos);
			if ( anim.pos == 1 ) {
				if ( anim.fncs.done ) {
					anim.fncs.done();
				}
			}
			else {
				animations.push(anim);
			}
		}
	}

	function createBackground() {
		var background = document.createElement("canvas"),
			bgctx = background.getContext("2d"),
			image = hunt.images["img/ground.png"];

		dom.addClass(background, "background");
		background.width = cols * gridSize;
		background.height = rows * gridSize;
		for ( var x = 0; x < cols; x++ ) {
			for ( var y = 0; y < rows; y++ ) {
				/*if ( (x+y) % 2 ) {
					bgctx.fillStyle = "rgba(0,0,0,0.10)";
				}
				else {
					bgctx.fillStyle = "rgba(255,255,255,0.05)";
				}
				bgctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);*/
				bgctx.drawImage(image, 0, 0, 
					gridSize, gridSize,
					x * gridSize, y * gridSize,
					gridSize, gridSize);
			}
		}
		bgctx.strokeStyle = "#000000";
		bgctx.strokeRect(0, 0, background.width, background.height);
		return background;
	}

	function drawSquare(type, x, y, direction, scale, rot) {
		if (type == "bomb+player") {
			drawSquare("bomb", x, y);
			drawSquare("player", x, y);
		}
		else {
			var image = hunt.images["img/"+ type +".png"],
				sliceX = 0, sliceY = 0;

			if (type == "player") {
				var player = hunt.player;
				if (typeof direction === "undefined") {
					direction = player.direction;
				}
				if (direction == "up") {
					sliceX = 40;
				}
				if (direction == "left") {
					sliceX = 80;
				}
				if (direction == "right") {
					sliceX = 120;
				}
			}

			if (type !== "blank") {
				ctx.save();
				if ( typeof scale !== "undefined" && scale > 0 ) {
					ctx.beginPath();
					ctx.rect(x,y,1,1);
					ctx.clip();
					ctx.translate(x + 0.5, y + 0.5);
					ctx.scale(scale, scale);
					if ( rot ) {
						ctx.rotate(rot);
					}
					ctx.translate(-x - 0.5, -y - 0.5);
				}
				ctx.drawImage(image, sliceX, sliceY, 
					gridSize, gridSize,
					x, y,
					1, 1);
				ctx.restore();
			}
		}
	}

	function clearSquare(x, y) {
		ctx.clearRect(x, y, 1, 1);
	}

	function movePlayer(data, callback) {
		var eventData = data.pop();
		clearSquare(eventData.fromX, eventData.fromY);
		drawSquare("player", eventData.toX, eventData.toY, eventData.direction);
		callback();
	}

	function plantBomb(data, callback) {
		var eventData = data.pop();
		clearSquare(eventData.x, eventData.y);
		drawSquare("bomb", eventData.x, eventData.y);
		drawSquare("player", eventData.x, eventData.y);
		callback();
	}

	function explodeBomb(data, callback) {
		var eventData = data.pop();
		drawSquare("fire", eventData.x, eventData.y);
		addAnimation((bombTime/3), {
			render : function(pos) {
				canvas.style.left =
					0.2 * pos * (Math.random() - 0.5) + "em";
				canvas.style.top =
					0.2 * pos * (Math.random() - 0.5) + "em";
			},
			done : function() {
				canvas.style.left = "0";
				canvas.style.top = "0";
			}
		});
		for (i = 0; i < eventData.squares.length; i++) {
			var sq = eventData.squares[i];
			drawSquare("fire", sq.x, sq.y);
		}
		callback();
	}

	function clearFire(data, callback) {
		var eventData = data.pop();
		clearSquare(eventData.x, eventData.y);
		for (i = 0; i < eventData.squaresToClear.length; i++) {
			var sq = eventData.squaresToClear[i];
			clearSquare(sq.x, sq.y);
		}
		for (i = 0; i < eventData.drops.length; i++) {
			var pu = eventData.drops[i];
			drawSquare(pu.type, pu.x, pu.y);
		}
		callback();
	}

	function redraw(newSquares, callback) {
		var x, y;
		squares = newSquares;
		ctx.clearRect(0,0,canvas.width,canvas.height);
		for (x = 0; x < cols; x++) {
			for (y = 0; y < rows; y++) {
				drawSquare(squares[x][y], x, y);
			}
		}
		callback();
	}

	function setup() {
		var boardElement = $("#game-screen .game-board")[0];
		cols = hunt.settings.cols;
		rows = hunt.settings.rows;
		gridSize = hunt.settings.gridSize;
		canvas = document.createElement("canvas");
		ctx = canvas.getContext("2d");
		dom.addClass(canvas, "board");
		canvas.width = cols * gridSize;
		canvas.height = rows * gridSize;
		ctx.scale(gridSize, gridSize);
		boardElement.appendChild(canvas);
		boardElement.appendChild(createBackground());
		previousCycle = Date.now();
		requestAnimationFrame(cycle);
	}

	function initialise(callback) {
		if ( firstRun ) {
			setup();
			firstRun = false;
		}
		callback();
	}

	function cycle(time) {
		var time = Date.now();
		renderAnimations(time, previousCycle);
		previousCycle = time;
		requestAnimationFrame(cycle);
	}

	function gameOver(callback) {
		addAnimation(1000, {
			render : function(pos) {
				canvas.style.left =
					0.2 * pos * (Math.random() - 0.5) + "em";
				canvas.style.top =
					0.2 * pos * (Math.random() - 0.5) + "em";
			},
			done : function() {
				canvas.style.left = "0";
				canvas.style.top = "0";
				callback();
			}
		});
	}

	return {
		initialise: initialise,
		redraw: redraw,
		movePlayer: movePlayer,
		plantBomb: plantBomb,
		explodeBomb: explodeBomb,
		clearFire: clearFire,
		gameOver: gameOver
	};
})();