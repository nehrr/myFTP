import net from "net";
import { log, isAllowedCommand, argv } from "./utils";
import db from "./db.json";

class myFTPServer {
  constructor(port) {
    this._port = port;
  }

  start() {
    this._server = net.createServer(socket => {
      log("socket connected");
      socket.setEncoding("ascii");

      socket.on("data", data => {
        if (isAllowedCommand(data)) {
          console.log(data);
          switch (data) {
            case "USER":
              this._user();

            case "PASS":
              this._password();

            case "LIST":
              this._list();

            case "PWD":
              this._pwd();

            case "CWD":
              this._cwd();

            case "RETR":
              this._retr();

            case "STOR":
              this._stor();

            case "HELP":
              this._help();

            case "QUIT":
              this._quit();

            default:
              break;
          }
          socket.write("ok");
        } else {
          socket.write("ko");
        }
      });

      socket.on("end", () => {
        log("socket disconnected", "red");
      });
    });

    this._server.on("error", err => {
      throw err;
    });

    this._server.listen(this._port, () => {
      log("server listening");
    });
  }

  _user(username) {
    for (let item of db) {
      if (item.user == username) {
        return true;
      }
    }
    return false;
  }

  _password() {}

  _cwd() {}

  _pwd() {}

  _retr() {}

  _stor() {}

  _list() {}

  _help() {}

  _quit() {}
}

const args = argv();
if (args.length !== 1) {
  log("usage: server PORT", "red");
  process.exit(-1);
}

const port = parseInt(args[0]);
const server = new myFTPServer(port);

server.start();
