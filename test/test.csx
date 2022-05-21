#! "netcoreapp6"
#r "nuget: System.Drawing.Common, 5.0.0"

using System.Net.WebSockets;
using System.Net;
using System.Threading;
using System.IO;
using System.Text.RegularExpressions;
using System.Globalization;
using System.Drawing;
using System.Drawing.Imaging;

Thread.CurrentThread.CurrentCulture = new CultureInfo("en-US");
Thread.CurrentThread.CurrentUICulture = new CultureInfo("en-US");

Func<string, byte[]> GetBytes = System.Text.Encoding.ASCII.GetBytes;
Func<byte[], string> GetString = System.Text.Encoding.ASCII.GetString;
Func<byte[], string> Base64 = System.Convert.ToBase64String;
Func<string, string, string> Format = (eventName, data) => $"42[\"{eventName}\",\"{data}\"]";

ClientWebSocket client = null;
var uri = new Uri("ws://stella-rvc.azurewebsites.net/socket.io/?EIO=4&transport=websocket");
var reconnecting = false;

// var files = Directory.GetFiles(@"..\vid").Select(i => System.Convert.ToBase64String(File.ReadAllBytes(i))).ToArray();
// int index = 0;

public async Task<bool> SendConnect()
{
	Console.WriteLine("sending connect");
	try
	{
		if (client == null)
			client = new ClientWebSocket();
		await client.ConnectAsync(uri, CancellationToken.None);
		await ReadData();
		await SendData(GetBytes("40"));
		if ((await ReadData()).StartsWith("40"))
		{
			await SendData(GetBytes(Format("car", "stellaautolab")));
			return (await ReadData()).StartsWith("42");
		}
		return false;
	}
	catch
	{
		Console.WriteLine("connect failed");
		client.Abort();
		client.Dispose();
		client = null;
	}
	return false;
}

public async Task Connect()
{
	Console.WriteLine("connecting");
	if (client != null)
	{
		client.Abort();
		client.Dispose();
	}
	bool connected = false;
	while (!connected && client?.State != WebSocketState.Open)
	{
		connected = await SendConnect();
		await Task.Delay(1000);
	}
}
public async Task<string> ReadData()
{
	Console.WriteLine("reading");
	var buffer = new System.ArraySegment<byte>(new byte[1024]);
	var res = await client.ReceiveAsync(buffer, CancellationToken.None);
	var bytes = buffer.Skip(buffer.Offset).Take(res.Count).ToArray();
	var str = GetString(bytes);
	Console.WriteLine("received: " + str);
	return str;
}

public async Task SendData(byte[] data, bool end = true)
{
	Console.WriteLine("sending");
	await client.SendAsync(new System.ArraySegment<byte>(data), WebSocketMessageType.Text, end, CancellationToken.None);
	Console.WriteLine("sent: " + data.Length);
}

public async Task Reconnect()
{
	if (!reconnecting)
	{
		reconnecting = true;
		await Connect();
		reconnecting = false;
	}
}

public (string, string) Parse(string input)
{
	if (input.StartsWith("42"))
	{
		var matches = Regex.Match(input, "\\[\"([\\s\\S]*)\",\"([\\s\\S]*)\"\\]").Groups;
		var res = (matches[1].Value, matches[2].Value);
		Console.WriteLine($"parsed: {res}");
		return res;
	}
	else
	{
		return (null, null);
	}
}

{
	await Connect();
}

var random = new Random();
var SendImage = async () =>
{
	// if (index >= files.Length) index = 0;
	// Console.WriteLine(index);
	Rectangle bounds = new Rectangle(0, 0, 1920, 1080);
	using (Bitmap bitmap = new Bitmap(bounds.Width, bounds.Height))
	{
		using (Graphics g = Graphics.FromImage(bitmap))
		{
			g.CopyFromScreen(new Point(bounds.Left,bounds.Top), Point.Empty, bounds.Size);
		}
		using (var stream = new MemoryStream())
		{
			bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Jpeg);
			await SendData(GetBytes(Format("image", Base64(stream.ToArray()))));
		}
	}
	// await SendData(GetBytes(Format("image", files[index++])));
};

double T, B, S;
var SendStatus = async () =>
{
	await SendData(GetBytes(Format("status", string.Join(",",
		T,
		S
	))));
};

new Thread(async () =>
{
	Thread.CurrentThread.CurrentCulture = new CultureInfo("en-US");
    Thread.CurrentThread.CurrentUICulture = new CultureInfo("en-US");
	while (true)
	{
		if (reconnecting) continue;
		try
		{
			await SendImage();
			await SendStatus();
		}
		catch
		{
			await Reconnect();
		}
		await Task.Delay(random.Next() % 1000);
	}
}).Start();

while (true)
{
	try
	{
		if (reconnecting) continue;
		string res = await ReadData();
		if (res == "2")
			await SendData(GetBytes("3"));
		else
		{
			var (eventName, data) = Parse(res);
			switch (eventName)
			{
				case "T": T = double.Parse(data); break;
				case "B": B = double.Parse(data); break;
				case "S": S = double.Parse(data); break;
			}
		}
	}
	catch
	{
		await Reconnect();
	}
}