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
          const method = this[`_${cmd.toLowerCase()}`];
          let isAllowed = ["USER", "PASS", "HELP", "QUIT"].includes(cmd);

          if (!isAllowed && !socket.user.isConnected) {
            socket.write("please use USER and PASS first");
          } else {
            let ret = method(socket, ...params);
            if (ret !== -1) {
              socket.write(ret);
            }
          }
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

  _pass(socket, password) {
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

  _cwd(socket, pathname) {
    if (pathname == null) {
      return "KO";
    }

    const newpath = path.join(socket.user.cwd, pathname);

    if (newpath.substr(0, socket.user.root.length) !== socket.user.root) {
      return "KO";
    } else {
      if (!fs.existsSync(newpath)) {
        return "KO";
      }
      socket.user.cwd = newpath;
      return "OK";
    }
  }

  _make(socket, directory) {
    const userpath = path.join(
      ROOT_FTP_DIRECTORY,
      socket.user.username,
      directory
    );

    socket.user.cwd = userpath;
    fs.mkdir(userpath);
    return "OK";
  }

  _pwd(socket) {
    return `/${socket.user.cwd}`;
  }

  _retr(socket, filename) {
    const pathname = path.join(socket.user.cwd, filename);
    let data = fs.readFileSync(pathname);
    fs.writeFileSync(`/tmp/${filename}`, data);
    return "OK";
  }

  _stor() {}

  _list(socket) {
    let list = [];
    fs.readdirSync(socket.user.cwd).forEach(file => {
      const pathname = path.join(socket.user.cwd, file);
      let status = fs.statSync(pathname);
      list.push(status.isDirectory() ? `${file}/` : file);
    });
    return list.join(", ");
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
    return -1;
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
