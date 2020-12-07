// help from: https://usefulangle.com/post/19/html5-canvas-tutorial-how-to-draw-graphical-coordinate-system-with-grids-and-axis
// more help from: https://stackoverflow.com/questions/2368784/draw-on-html5-canvas-using-a-mouse

// set variables
var canvas, ctx, flag = false,
	prevX = 0,
	currX = 0,
	prevY = 0,
	currY = 0,
	dot_flag = false;

// set color of pen
var x = "#EAA0A1",
	y = 2;


// initialize the canvas
function initCanvas() {

	// get information regarding the canvas
	canvas = document.getElementById('canvas');
	ctx = canvas.getContext("2d");
	width = canvas.width;
	height = canvas.height;

	// track user mouse movement
	canvas.addEventListener("mousemove", function (e) {
			findxy('move', e)},
		false);
	canvas.addEventListener("mousedown", function (e) {
			findxy('down', e)},
		false);
	canvas.addEventListener("mouseup", function (e) {
			findxy('up', e)},
		false);
	canvas.addEventListener("mouseout", function (e) {
			findxy('out', e)},
		false);
}

// if draw, color is teal-ish, if erase, color is white
function color(obj) {
	switch (obj.id) {
		case "draw":
			x = "#EAA0A1";
			break;
		case "erase":
			x = "#121212";
			break;
	}
	if (x == "#121212")
		y = 18;
	else y = 2;
}

// tracks user mouse movement
function draw() {
	ctx.beginPath();
	ctx.moveTo(prevX-500, prevY-50);
	ctx.lineTo(currX-500, currY-50);
	ctx.strokeStyle = x;
	ctx.lineWidth = y;
	ctx.stroke();
	ctx.closePath();
}

// clears the canvas
function erase() {
	ctx.clearRect(0, 0, width, height);
	// document.getElementById("actualvis").style.display = "none";
}

//
// function submit() {
// 	document.getElementById("actualvis").style.display = "inline";
// }

function findxy(res, e) {
	if (res == 'down') {
		prevX = currX;
		prevY = currY;
		currX = e.clientX - canvas.offsetLeft;
		currY = e.clientY - canvas.offsetTop;
		flag = true;
		dot_flag = true;
		if (dot_flag) {
			ctx.beginPath();
			ctx.fillStyle = x;
			ctx.fillRect(currX, currY, 2, 2);
			ctx.closePath();
			dot_flag = false;
		}
	}
	if (res == 'up' || res == "out") {
		flag = false;
	}
	if (res == 'move') {
		if (flag) {
			prevX = currX;
			prevY = currY;
			currX = e.clientX - canvas.offsetLeft;
			currY = e.clientY - canvas.offsetTop;
			draw();
		}
	}
}