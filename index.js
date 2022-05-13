const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

function encode(bitmap) {
    return Buffer.from(bitmap).toString("base64");
}

let T = 0.1;
let S = 0.0;

io.on("connection", (socket) => {
	console.log(`new socket: ${socket.id}`);

	socket.on("end", () => {
		console.log("client disconnected");
	});

	socket.on("tp", (data) => {
		console.log("tp");
		if (T < 0.99)
			socket.broadcast.emit(`T,${T += 0.1}`);
	});
	
	socket.on("tm", (data) => {
		console.log("tm");
		if (T > -0.99)
			socket.broadcast.emit(`T,${T -= 0.1}`);
	});
	
	socket.on("bp", (data) => {
		console.log("bp");
		socket.broadcast.emit("B,0.5");
	});
	
	socket.on("bm", (data) => {
		console.log("bm");
		socket.broadcast.emit("B,0.0");
	});
	
	socket.on("sp", (data) => {
		console.log("sp");
		if (S < 0.99)
			socket.broadcast.emit(`S,${S += 0.1}`);
	});
	
	socket.on("sm", (data) => {
		console.log("sm");
		if (S > -0.99)
			socket.broadcast.emit(`S,${S -= 0.1}`);
	});
	
	socket.on("image", (data) => {
		socket.broadcast.emit("image", `data:image/jpeg;base64,${data}`);
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