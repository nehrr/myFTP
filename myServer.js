import net from "net";
import fs from "fs";
import path from "path";
import os from "os";
import { exec } from "child_process";
import { promisify } from "util";

import { log, isAllowedCommand, argv, sendLog } from "./utils";
import db from "./db.json";

const ROOT_FTP_DIRECTORY = "share";
const REAL_ROOT_FTP_DIRECTORY = path.join(__dirname, ROOT_FTP_DIRECTORY);

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

class MyFTPServer extends Server {
  constructor(port) {
    super();
    this._dtp_port = 5000;
  }

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

  _runDTPServer(socket, port) {
    super.create(this._dtp_port, client => {
      log(`dtp connected on port: [${port}]`);

      client.setEncoding("utf8");
      socket.session.dtp = client;

      //server is ready
      socket.emit("nehrr::init");
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
      sendLog(socket, "302 use USER first");
    } else {
      if (
        db.find(
          item =>
            item.user === socket.session.username && item.password === password
        )
      ) {
        socket.session.isConnected = true;

        socket.session.realpath = path.join(
          REAL_ROOT_FTP_DIRECTORY,
          socket.session.username
        );
        if (!fs.existsSync(socket.session.realpath)) {
          fs.mkdir(socket.session.realpath);
        }

        const userpath = path.join(ROOT_FTP_DIRECTORY, socket.session.username);
        socket.session.root = socket.session.cwd = userpath;
        sendLog(socket, "230 logged in");
      } else {
        sendLog(socket, "500 error");
      }
    }
  }

  _cwd(socket, pathname) {
    if (pathname == null) {
      sendLog(socket, "500 wrong directory");
    }

    const newpath = path.join(socket.session.cwd, pathname);

    if (newpath.substr(0, socket.session.root.length) !== socket.session.root) {
      sendLog(socket, `250 ${newpath}`);
    } else {
      if (!fs.existsSync(newpath)) {
        sendLog(socket, "500 wrong directory");
      }
      socket.session.cwd = newpath;
      sendLog(socket, `250 ${socket.session.cwd}`);
    }
  }

  _syst(socket) {
    sendLog(socket, `215 ${os.platform()} ${os.arch()}`);
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

  _type(socket, kind) {
    const encoding = kind === "I" ? "binary" : "ascii";
    socket.setEncoding(encoding);
    sendLog(socket, `200 encoding is ${encoding}`);
  }

  _epsv(socket) {
    this._runDTPServer(socket, this._dtp_port);
    sendLog(socket, `227 entering passive mode (|||${this._dtp_port++}|)`);
  }

  _retr(socket, filename) {
    const pathname = path.join(socket.session.cwd, filename);
    let data = fs.readFileSync(pathname);
    return "OK";
  }

  _stor() {}

  _list(socket) {
    //start
    sendLog(socket, "150 transfer started");

    //client ready > send data
    socket.on("nehrr::init", async () => {
      let execute = promisify(exec);
      let { stdout } = await execute(`ls -l ${socket.session.cwd}`);
      log(stdout, "white");
      socket.session.dtp.write(stdout);
      socket.session.dtp.end();

      //transfer done event
      socket.emit("nehrr::finish");
    });

    //on finish
    socket.on("nehrr::finish", () => {
      //end
      sendLog(socket, "226 transfer done");
    });
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
const server = new MyFTPServer();
server.start(port);
