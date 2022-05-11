using System.Net.WebSockets;
using System.Net;
using System.Threading;
using System.IO;

Func<string, byte[]> GetBytes = System.Text.Encoding.ASCII.GetBytes;

ClientWebSocket client = null;
var uri = new Uri("ws://localhost:3000/socket.io/?EIO=4&transport=websocket");
// var uri = new Uri("ws://localhost:3001");

var files = Directory.GetFiles(@"..\vid").Select(i => System.Convert.ToBase64String(File.ReadAllBytes(i))).ToArray();
int index = 0;

public async Task Connect() {
	Console.WriteLine("connecting");
	client = new ClientWebSocket();
	await client.ConnectAsync(uri, CancellationToken.None);
	await ReadData();
	await SendData(GetBytes("40"));
	await ReadData();
}
public async Task ReadData() {
	Console.WriteLine("reading");
	var buffer = new System.ArraySegment<byte>(new byte[1024]);
	var res = await client.ReceiveAsync(buffer, CancellationToken.None);
	var bytes = buffer.Skip(buffer.Offset).Take(buffer.Count).ToArray();
	Console.WriteLine("received: " + System.Text.Encoding.ASCII.GetString(bytes));
}
public async Task SendData(byte[] data, bool end = true) {
	Console.WriteLine("sending");
	await client.SendAsync(new System.ArraySegment<byte>(data), WebSocketMessageType.Text, end, CancellationToken.None);
	Console.WriteLine("sent: " + data.Length);
}
{
	await Connect();
	// await client.CloseAsync(WebSocketCloseStatus.Empty, null, CancellationToken.None);
}

new Thread(async () => {
	while (true) {
		await ReadData();
	}
}).Start();

while (true) {
	if (index >= files.Length) index = 0;
	Console.WriteLine(index);
	await SendData(GetBytes("42[\"image\",\""), false);
	await SendData(GetBytes(files[index++]), false);
	await SendData(GetBytes("\"]"));
	await Task.Delay(250);
	// await ReadData();
}