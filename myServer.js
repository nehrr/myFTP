import net from "net";
import { log, isAllowedCommand, argv } from "./utils";
//
// const server = server.on("error", err => {
//   throw err;
// });
//
// server.listen(4242, () => {
//   console.log("server bound");
// });
//
// class myFTPServer {
//   constructor(port) {
//     net.createServer(c => {
//       // 'connection' listener
//       console.log("socket connected");
//       c.on("end", () => {
//         console.log("socket disconnected");
//       });
//       c.write("Beep boop I'm a roboto server!\r\n");
//       c.pipe(c);
//     });
//   }
//
//   start() {}
//
//   _user() {}
//
//   _password() {}
//
//   _cwd() {}
//
//   _pwd() {}
//
//   _get() {}
//
//   _put() {}
//
//   _list() {}
//
//   _help() {}
// }
//
// const server = new myFTPServer(port);
// server.start();
