import net from "net";
import fs from "fs";
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
        data = data.split(" ");

        if (isAllowedCommand(data[0])) {
          switch (data[0]) {
            case "USER":
              if (this._user(data[1])) {
                this._user = data[1];
                console.log(this._user);
              }
              return;

            case "PASS":
              this._password(this._user, data[1]);
              return;

            case "LIST":
              this._list(user, data[1]);
              return;

            case "PWD":
              this._pwd();
              return;

            case "CWD":
              this._cwd();
              return;

            case "RETR":
              this._retr();
              return;

            case "STOR":
              this._stor();
              return;

            case "HELP":
              this._help();
              return;

            case "QUIT":
            // socket.destroy();

            default:
              break;
          }
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
        console.log("ok");
        return true;
      }
    }
    console.log("no");
    return false;
  }

  _password(user, password) {
    for (let item of db) {
      if (item.user == user) {
        for (let pw of db) {
          if (pw.password == password) {
            console.log("ok");
            return true;
          }
        }
        console.log("no");
        return false;
      }
    }
    console.log("no");
    return false;
  }

  _cwd() {}

  _pwd() {}

  _retr() {}

  _stor() {}

  _list(user, directory = null) {
    if (fs.existsSync(`./share/${user}/${directory}/`)) {
      fs.readdir(`./share/${user}/${directory}/`, (err, data) => {
        if (err) throw err;
        console.log(data);
      });
    } else {
      fs.readdir(`./share/${user}/`, (err, data) => {
        if (err) throw err;
        console.log(data);
      });
    }
  }

  _help() {}
}

const args = argv();
if (args.length !== 1) {
  log("usage: server PORT", "red");
  process.exit(-1);
}

const port = parseInt(args[0]);
const server = new myFTPServer(port);

server.start();
