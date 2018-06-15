const net = require("net");
const fs = require("fs");
const db = require("./db.json");

const client = net.createConnection({ port: 4242 }, () => {
  // 'connect' listener
  console.log("connected to server!");
  client.write("Beep boop, hello you!\r\n");
});

client.on("data", data => {
  console.log(data.toString());
});

client.on("end", () => {
  console.log("disconnected from server");
});
