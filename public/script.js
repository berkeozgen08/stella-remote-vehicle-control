let socket = io();

const notfContainer = document.querySelector(".notf-container");
const submit = document.getElementById("authenticate");
const password = document.getElementById("password");
const authentication = document.getElementById("authentication");
const controls = document.getElementById("controls");

const image = document.getElementById("image");
const conn = document.getElementById("conn");
const speed = document.getElementById("speed");
const rotation = document.getElementById("rotation");

const down = {
	"ArrowUp": false,
	"ArrowDown": false,
	" ": false,
	"ArrowRight": false,
	"ArrowLeft": false
}

function createNotf(msg, time = 3000) {
	const notf = document.createElement("div");
	notf.classList.add("notf");
	notf.classList.add("slideIn");
	notf.innerText = msg;
	setTimeout(() => removeNotf(notf), time);
	notfContainer.appendChild(notf);
}

function removeNotf(notf) {
	notf.classList.remove("slideIn");
	setTimeout(() => notf.classList.add("slideOut"), 500);
	setTimeout(() => notf.remove(), 1000);
}

function authenticate() {
	authentication.setAttribute("hidden", "");
	controls.removeAttribute("hidden");
}

password.addEventListener("keydown", (e) => {
	if (e.key === "Enter") {
		e.preventDefault();
		submit.click();
	}
});

submit.addEventListener("click", e => {
	if (password.value === "") {
		e.preventDefault();
		createNotf("Password is required.");
	} else {
		socket.emit("authenticate", password.value);
	}
});

socket.emit("conn");

socket.on("car", (connection) => {
	if (connection != "connected") {
		password.setAttribute("disabled", "");
		submit.setAttribute("disabled", "");
		submit.value = "Car not connected";
	} else {
		password.removeAttribute("disabled");
		submit.removeAttribute("disabled");
		submit.value = "Authenticate";
	}
});

socket.on("authenticated", (bool) => {
	if (!bool) return createNotf("Not authenticated.");
	createNotf("Authenticated.");
	authenticate();
	document.body.addEventListener("keydown", (e) => {
		e.preventDefault();
		if (down[e.key]) return;
		down[e.key] = true;
		switch (e.key) {
			case "ArrowUp":
				socket.emit("forward"); break;
			case "ArrowDown":
				socket.emit("backward"); break;
			case " ":
				socket.emit("break"); break;
			case "ArrowRight":
				socket.emit("right"); break;
			case "ArrowLeft":
				socket.emit("left"); break;
		}
	});
	document.body.addEventListener("keyup", async (e) => {
		e.preventDefault();
		if (!down[e.key]) return;
		down[e.key] = false;
		switch (e.key) {
			case "ArrowUp":
				socket.emit("neutral"); break;
			case "ArrowDown":
				socket.emit("neutral"); break;
			case " ":
				socket.emit("continue"); break;
			case "ArrowRight":
				socket.emit("middle"); break;
			case "ArrowLeft":
				socket.emit("middle"); break;
		}
	});
});

socket.on("image", (data) => {
	image.src = data;
});

socket.on("car", (connection) => {
	conn.innerText = connection;
	createNotf(`Car ${connection}`);
});

socket.on("status", (status) => {
	const [s, r] = status.split(",");
	speed.innerText = s;
	rotation.innerText = r;
});

socket.on("disconnect", async () => {
	while (!socket.connected) {
		socket.close();
		console.log("reconnecting", socket);
		socket.connect();
		await new Promise(r => setTimeout(r, 1000));
	}
	socket.emit("authenticate", password.value);
});