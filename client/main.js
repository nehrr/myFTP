const net = require("net");

const client = net.createConnection({ port: 4242 }, () => {
  // 'connect' listener
  console.log("connected to server!");
  client.write("Beep boop, hello you!\r\n");
});

client.on("data", data => {
  console.log(data.toString());
  client.end();
});

client.on("end", () => {
  console.log("disconnected from server");
});
