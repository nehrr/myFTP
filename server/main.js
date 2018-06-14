const net = require("net");

const server = net.createServer(c => {
  // 'connection' listener
  console.log("client connected");
  c.on("end", () => {
    console.log("client disconnected");
  });
  c.write("Beep boop I'm a roboto server!\r\n");
  c.pipe(c);
});

server.on("error", err => {
  throw err;
});

server.listen(4242, () => {
  console.log("server bound");
});
