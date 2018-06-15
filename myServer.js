import net from "net";
import fs from "fs";
import path from "path";

import { log, isAllowedCommand, argv } from "./utils";
import db from "./db.json";

const ROOT_FTP_DIRECTORY = "./share";

class myFTPServer {
  constructor(port) {
    this._port = port;
  }

  start() {
    this._server = net.createServer(socket => {
      log("socket connected");
      socket.user = {};
      socket.setEncoding("ascii");

      socket.on("data", data => {
        const [cmd, ...params] = data.split(" ");

        if (!isAllowedCommand(cmd)) {
          socket.write("KO");
        } else {
          let ret;
          switch (cmd) {
            case "USER":
              if (params.length !== 1) {
                ret = "must specify user name";
              } else {
                ret = this._user(socket, params[0]);
                break;
              }
              break;

            case "PASS":
              ret = this._password(socket, params[0]);
              break;

            case "LIST":
              ret = this._list(socket, params[0]);
              break;

            case "PWD":
              ret = this._pwd(socket);
              break;

            case "CWD":
              if (params.length !== 1) {
                ret = "must specify directory name";
              } else {
                ret = this._cwd(socket, params[0]);
                break;
              }
              break;

            case "RETR":
              this._retr();
              break;

            case "STOR":
              this._stor();
              break;

            case "HELP":
              ret = this._help();
              break;

            case "QUIT":
              this._quit(socket);
              return;

            default:
              break;
          }
          socket.write(ret);
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

  _user(socket, username) {
    if (db.find(item => item.user === username)) {
      socket.user = { username, isConnected: false };
      return "OK";
    } else {
      return "KO";
    }
  }

  _password(socket, password) {
    if (!socket.user.username) {
      return "KO";
    } else {
      if (
        db.find(
          item =>
            item.user === socket.user.username && item.password === password
        )
      ) {
        socket.user.isConnected = true;

        const userpath = path.join(ROOT_FTP_DIRECTORY, socket.user.username);
        if (!fs.existsSync(userpath)) {
          fs.mkdir(userpath);
        }
        socket.user.root = socket.user.cwd = userpath;
      }
      return "OK";
    }
  }

  _cwd(socket, directory) {
    if (!socket.user.isConnected) {
      return "please log in";
    } else {
      const userpath = path.join(
        ROOT_FTP_DIRECTORY,
        socket.user.username,
        directory
      );

      socket.user.cwd = userpath;
      fs.mkdir(userpath);
      return "OK";
    }
  }

  _pwd(socket) {
    return `/${socket.user.cwd}`;
  }

  _retr() {}

  _stor() {}

  _list(socket) {
    if (!socket.user.isConnected) {
      return "please log in";
    } else {
      return fs.readdirSync(socket.user.cwd).join(", ");
    }
  }

  _help() {
    return `USER: input username
    PASS: input password
    LIST: show list of files in directory (if logged)
    PWD: print working directory (if logged)
    CWD: change working directory (if logged)
    RETR: retrieve file (if logged)
    STOR: store file (if logged)
    HELP: get all available commands
    QUIT: close connection`;
  }

  _quit(socket) {
    socket.end();
  }
}

const args = argv();
if (args.length !== 1) {
  log("usage: server PORT", "red");
  process.exit(-1);
}

const port = parseInt(args[0]);
const server = new myFTPServer(port);

server.start();
