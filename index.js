const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

let car = null;

io.on("connection", (socket) => {
	console.log(`new socket: ${socket.id}`);
	
	socket.on("disconnect", () => {
		console.log(`${socket.id} disconnected`);
		if (car?.id == socket.id) {
			console.log("car disconnected");
			socket.broadcast.emit("car", "disconnected");
			car = null;
		}
	});

	socket.on("car", () => {
		console.log(`car connected`);
		car = socket;
		io.emit("car", "connected");
	});

	socket.on("conn", () => {
		socket.emit("car", car == null ? "disconnected" : "connected");
	});

	socket.on("forward", () => {
		console.log("forward");
		socket.broadcast.emit("T", "0.5");
	});

	socket.on("neutral", () => {
		console.log("neutral");
		socket.broadcast.emit("T", "0");
	});
	
	socket.on("backward", () => {
		console.log("backward");
		socket.broadcast.emit("T", "-0.5");
	});
	
	socket.on("break", () => {
		console.log("break");
		socket.broadcast.emit("B", "0.5");
	});
	
	socket.on("continue", () => {
		console.log("continue");
		socket.broadcast.emit("B", "0");
	});
	
	socket.on("right", () => {
		console.log("right");
		socket.broadcast.emit("S", "0.5");
	});
	
	socket.on("middle", () => {
		console.log("middle");
		socket.broadcast.emit("S", "0");
	});
	
	socket.on("left", () => {
		console.log("left");
		socket.broadcast.emit("S", "-0.5");
	});
	
	socket.on("image", (data) => {
		socket.broadcast.emit("image", `data:image/jpeg;base64,${data}`);
	});
	
	socket.on("status", (status) => {
		socket.broadcast.emit("status", status);
	});

	socket.on("connect_error", (err) => {
		console.log(`connect_error due to ${err.message}`);
	});
}).on("error", (err) => {
    console.error(err.message);
});

app.use(express.json());
app.use(express.static("public"));
server.listen(3000, () => console.log("listening"));