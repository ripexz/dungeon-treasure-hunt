hunt.board = (function() {
	var settings, squares,
		cols, rows, bombTime,
		player;

	function initialise(callback) {
		settings = hunt.settings;
		cols = settings.cols;
		rows = settings.rows;
		bombTime = settings.bombTime;
		player = hunt.player;
		fillBoard();
		spawnPlayer();
		callback();
	}

	function spawnPlayer() {
		squares[0][0] = "player";
		player.x = 0;
		player.y = 0;
	}

	function fillBoard() {
		var x, y;
		squares = [],
		exit = false;
		for ( x = 0; x < cols; x++ ) {
			squares[x] = [];
			for ( y = 0; y < rows; y++ ) {
				squares[x][y] = "blank";
				if ((Math.random() > 0.4) && (x > 1 || y > 1)) {
					if (Math.random() > 0.7) {
						squares[x][y] = "solid";
					}
					else {
						squares[x][y] = "brick";
					}
				}
				if ((Math.random() > 0.5) && (x > 10 && y > 10) && exit == false) {
					squares[x][y] = "exit";
					exit = true;
				}
			}
		}
		if ( !exit ) {
			fillBoard();
		}
	}

	function getBoard() {
		var copy = [], x;
		for ( x = 0; x < cols; x++ ) {
			copy[x] = squares[x].slice(0);
		}
		return copy;
	}

	function getSquare(x, y) {
		if ( x < 0 || x > cols-1 || y < 0 || y > rows-1 ) {
			return "oob";
		}
		else {
			return squares[x][y];
		}
	}

	function applyPowerups(type, callback) {
		var events = [];
		switch (type) {
			case "fireUp":
				player.fireSize += 1;
				break;
			case "bombUp":
				player.bombCountMax += 1;
				player.bombCount += 1;
				break;
			case "treasure1":
				events.push({type: "score", data: 150});
				break;
			case "treasure2":
				events.push({type: "score", data: 300});
				break;
			case "treasure3":
				events.push({type: "score", data: 500});
				break;
			default:
				break;
		}
		callback(events);
	}

	function move(x1, y1, x2, y2, direction, callback) {
		var move, tmp,
			events = [],
			direction = direction,
			tmp2 = getSquare(x2, y2);

		if (typeof direction == "undefined" || direction == "") {
			direction = "down";
		}

		if (tmp2 != "oob" && tmp2 != "bomb" && tmp2 != "solid" && tmp2 != "brick") {
			move = {
				type: "move",
				data: [{
					type: getSquare(x1, y1),
					fromX: x1, fromY: y1,
					toX: x2, toY: y2,
					direction: direction
				}]
			};
			tmp = getSquare(x1, y1);
			squares[x1][y1] = (tmp == "bomb+player") ? "bomb" : "blank";
			squares[x2][y2] = "player";
			player.x = x2;
			player.y = y2;
			player.direction = direction;
			events.push(move);
			if (tmp2 == "fire") {
				events.push({type: "gameOver", data: []});
			}
			if (tmp2 == "exit") {
				events.push({type: "nextLevel", data: []});
			}
			else {
				applyPowerups(tmp2, callback);
			}
			callback(events);
		}
	}

	function plantBomb(x, y, fireSize, callback) {
		var plant,
			type = "bomb",
			events = [];

		if (getSquare(x, y) == "blank" || getSquare(x, y) == "player") {
			if ( getSquare(x,y) == "player" ) {
				type = "bomb+player";
			}
			plant = {
				type: "plantBomb",
				data: [{
					type: type,
					x: x,
					y: y,
					fireSize: fireSize
				}]
			};
			squares[x][y] = type;
			events.push(plant);
			window.setTimeout(function(){
				//passing coords and playBoardEvents function
				explodeBomb(x, y, fireSize, callback);
			}, bombTime);
			//playBoardEvents:
			callback(events);
		}
	}

	function explodeBomb(x, y, fireSize, callback) {
		var explode, i, data,
			type = "fire",
			events = [];

		if (getSquare(x, y) == "bomb" || getSquare(x, y) == "bomb+player") {

			var data = calculateExplosion(x, y, fireSize);

			explode = {
				type: "explodeBomb",
				data: [{
					type: type,
					x: x,
					y: y,
					squares: data.fired,
					drops: data.drops
				}]
			};

			for (i = 0; i < data.fired.length; i++) {
				squares[data.fired[i].x][data.fired[i].y] = type;
			}
			
			events.push(explode);;
			window.setTimeout(function() {
				clearFire(x, y, data.fired, data.drops, callback);
			}, bombTime/3);
			if (data.dead === true) {
				events.push({type: "gameOver", data: []})
			}
			callback(events);
		}
	}

	function clearFire(x, y, squaresToClear, drops, callback) {
		var clear, i, sq, pu,
			type = "blank",
			events = [];
		clear = {
			type: "clearFire",
			data: [{
				type: type,
				x: x,
				y: y,
				squaresToClear: squaresToClear,
				drops: drops
			}]
		};
		squares[x][y] = type;
		for (i = 0; i < squaresToClear.length; i++) {
			sq = squaresToClear[i];
			squares[sq.x][sq.y] = type;
		}
		for (i = 0; i < drops.length; i++) {
			sq = drops[i];
			squares[sq.x][sq.y] = sq.type;
		}
		events.push(clear);
		callback(events);
	}

	function calculateExplosion(x, y, fireSize) {
		var i, j, pu
			sides = {
				up: "",
				down: "",
				left: "",
				right: ""
			}
			data = {
				fired: [],
				drops: [],
				dead: false
			};

		data.fired.push({
			x: x,
			y: y,
			type: getSquare(x, y)
		});

		if (getSquare(x, y) == "player" || getSquare(x, y) == "bomb+player") {
			data.dead = true;
		}

		for (i = 1; i <= fireSize; i++) {
			if (typeof sides.up !== "undefined") {
				sides.up = {type: getSquare(x, y-i), x: x, y: y-i};
			}
			if (typeof sides.down !== "undefined") {
				sides.down = {type: getSquare(x, y+i), x: x, y: y+i};
			}
			if (typeof sides.left !== "undefined") {
				sides.left = {type: getSquare(x-i, y), x: x-i, y: y};
			}
			if (typeof sides.right !== "undefined") {
				sides.right = {type: getSquare(x+i, y), x: x+i, y: y};
			}

			for (j in sides) {
				if ( sides.hasOwnProperty(j) ) {
					if (sides[j].type == "player" || getSquare(x, y) == "bomb+player") {
						data.dead = true;
					}

					if (sides[j].type == "oob" || sides[j].type == "solid" || sides[j].type == "exit") {
						delete sides[j];
					}
					else if (sides[j].type == "brick") {
						if (Math.random() > 0.8) {
							pu = randomPowerUp();
							data.drops.push({
								x: sides[j].x,
								y: sides[j].y,
								type: pu
							});
						}
						data.fired.push(sides[j]);
						delete sides[j];
					}
					else if (sides[j].type == "bomb" || sides[j].type == "bomb+player") {
						//do nothing/set it off?
						delete sides[j];
					}
					else {
						data.fired.push(sides[j]);
					}
				}
			}
		}
		return data;
	}

	function randomPowerUp() {
		var index,
			powerUps = settings.powerUps,
			len = powerUps.length;
		index = Math.floor(Math.random() * len);
		return powerUps[index];
	}

	function print() {
		var str = "";
		for ( var y = 0; y < rows; y++ ) {
			for ( var x = 0; x < cols; x++ ) {
				str += getSquare(x, y) + " ";
			}
			str += "\r\n";
		}
		console.log(str);
	}

	return {
		initialise: initialise,
		getBoard: getBoard,
		move: move,
		plantBomb: plantBomb,
		print: print
	};
})();