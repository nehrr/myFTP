import net from "net";
import fs from "fs";
import path from "path";

import { log, isAllowedCommand, argv, sendLog } from "./utils";
import db from "./db.json";

const ROOT_FTP_DIRECTORY = "./share";

class Server {
  create(port, callback) {
    let server = net.createServer(callback);

    server.listen(port, () => {
      log(`server bound on port: [${port}]`);
    });

    server.on("error", err => {
      throw err;
    });

    server.on("close", () => {
      log("server disconnected", "red");
    });

    return server;
  }
}

class myFTPServer extends Server {
  start(port) {
    super.create(port, socket => {
      log(`socket connected`, "cyan");

      socket.session = {};
      socket.name = socket.remoteAddress + ":" + socket.remotePort;

      socket.setEncoding("ascii");

      //identification of server
      sendLog(socket, "220 willkommen in server");

      socket.on("data", data => {
        data = data.trim();
        log("<<<" + data, "yellow");

        const [cmd, ...params] = data.split(" ");

        let ret = "";

        if (!isAllowedCommand(cmd)) {
          sendLog(socket, "502 not implemented");
        } else {
          let cmdWithoutAuth = ["AUTH", "USER", "PASS", "HELP", "QUIT"];

          let noAuth = cmdWithoutAuth.includes(cmd);

          if (!noAuth && !socket.session.isConnected) {
            sendLog(socket, "502 please use USER and PASS first");
          } else {
            this[`_${cmd.toLowerCase()}`](socket, ...params);
            // log(">>>" + ret, "green");
            // if (ret !== 0) {
            //   socket.write(`${ret}\r\n`);
            // }
          }
        }
      });

      socket.on("end", () => {
        log("socket disconnected", "red");
      });
    });
  }

  _user(socket, username) {
    if (db.find(item => item.user === username)) {
      socket.session = { username, isConnected: false };
      sendLog(socket, "331 user name ok");
    } else {
      sendLog(socket, "332 need account");
    }
  }

  _pass(socket, password) {
    if (!socket.session.username) {
      sendLog(socket, "530 not logged in");
    } else {
      if (
        db.find(
          item =>
            item.user === socket.session.username && item.password === password
        )
      ) {
        socket.session.isConnected = true;

        const userpath = path.join(ROOT_FTP_DIRECTORY, socket.session.username);
        if (!fs.existsSync(userpath)) {
          fs.mkdir(userpath);
        }
        socket.session.root = socket.session.cwd = userpath;
        sendLog(socket, "230 logged in");
      } else {
        sendLog(socket, "KO");
      }
    }
  }

  _cwd(socket, pathname) {
    if (pathname == null) {
      return "KO";
    }

    const newpath = path.join(socket.session.cwd, pathname);

    if (newpath.substr(0, socket.session.root.length) !== socket.session.root) {
      return "KO";
    } else {
      if (!fs.existsSync(newpath)) {
        return "KO";
      }
      socket.session.cwd = newpath;
      return "OK";
    }
  }

  _make(socket, directory) {
    const userpath = path.join(
      ROOT_FTP_DIRECTORY,
      socket.session.username,
      directory
    );

    socket.session.cwd = userpath;
    fs.mkdir(userpath);
    return "OK";
  }

  _pwd(socket) {
    sendLog(socket, `257 /${socket.session.cwd}`);
  }

  _retr(socket, filename) {
    const pathname = path.join(socket.session.cwd, filename);
    let data = fs.readFileSync(pathname);
    return "OK";
  }

  _stor() {}

  _list(socket) {
    let list = [];
    fs.readdirSync(socket.session.cwd).forEach(file => {
      const pathname = path.join(socket.session.cwd, file);
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
const server = new myFTPServer();
server.start(port);
