const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

Array.prototype.remove = function (el) { return this.splice(this.indexOf(el), 1) };

let car = null;
const carsecret = "stellaautolab";
const secret = "stella";
const authenticated = [];
authenticated.emit = function (event, data) { this.forEach(i => i.emit(event, data)); };

io.on("connection", (socket) => {
	console.log(`new socket: ${socket.id}`);
	
	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected`);
		if (car?.id === socket.id) {
			console.log("car disconnected");
			socket.broadcast.emit("car", "disconnected");
			car = null;
		} else {
			authenticated.remove(socket);
		}
	});

	socket.on("car", (pw) => {
		if (carsecret != pw) return;
		console.log(`car connected`);
		car = socket;
		io.emit("car", "connected");
	});

	socket.on("conn", () => {
		socket.emit("car", car === null ? "disconnected" : "connected");
	});

	socket.on("forward", () => {
		if (!authenticated.includes(socket)) return;
		console.log("forward");
		car?.emit("T", "0.5");
	});

	socket.on("neutral", () => {
		if (!authenticated.includes(socket)) return;
		console.log("neutral");
		car?.emit("T", "0");
	});
	
	socket.on("backward", () => {
		if (!authenticated.includes(socket)) return;
		console.log("backward");
		car?.emit("T", "-0.5");
	});
	
	socket.on("break", () => {
		if (!authenticated.includes(socket)) return;
		console.log("break");
		car?.emit("B", "0.5");
	});
	
	socket.on("continue", () => {
		if (!authenticated.includes(socket)) return;
		console.log("continue");
		car?.emit("B", "0");
	});
	
	socket.on("right", () => {
		if (!authenticated.includes(socket)) return;
		console.log("right");
		car?.emit("S", "0.5");
	});
	
	socket.on("middle", () => {
		if (!authenticated.includes(socket)) return;
		console.log("middle");
		car?.emit("S", "0");
	});
	
	socket.on("left", () => {
		if (!authenticated.includes(socket)) return;
		console.log("left");
		car?.emit("S", "-0.5");
	});
	
	socket.on("image", (data) => {
		authenticated.emit("image", `data:image/jpeg;base64,${data}`);
	});
	
	socket.on("status", (status) => {
		authenticated.emit("status", status);
	});

	socket.on("authenticate", (pw) => {
		if (pw === secret) {
			console.log("authenticated");
			socket.emit("authenticated", true);
			authenticated.push(socket);
		} else {
			socket.emit("authenticated", false);
		}
	});

	socket.on("connect_error", (err) => {
		console.log(`connect_error due to ${err.message}`);
	});
}).on("error", (err) => {
    console.error(err.message);
});

const port = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static("public"));
server.listen(port, () => console.log("listening"));