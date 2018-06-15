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
      socket.user = {};
      socket.setEncoding("ascii");

      socket.on("data", data => {
        const [cmd, ...params] = data.split(" ");

        if (!isAllowedCommand(cmd)) {
          socket.write("ko");
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
              console.log(this._list(socket, params[0]));
              // ret = this._list(socket, params[0]);
              break;

            case "PWD":
              this._pwd();
              break;

            case "CWD":
              this._cwd();
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
            // socket.destroy();

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
        // if (fs.stat(`./share/${socket.user.username}/`) == false) {
        //   console.log(socket.user.username);
        //   fs.mkdir(`./share/${socket.user.username}/`);
        // }
        socket.user.root = socket.user.username;

        return "OK";
      } else {
        return "KO";
      }
      //check user/pw
      //isConnected
      //directory exists ? > create if not
      //init root === cwd
    }
  }

  _cwd() {}

  _pwd() {}

  _retr() {}

  _stor() {}

  _list(socket, directory = null) {
    if (!socket.user.isConnected) {
      return "please log in";
    } else {
      if (fs.existsSync(`./share/${socket.user.username}/${directory}/`)) {
        fs.readdir(
          `./share/${socket.user.username}/${directory}/`,
          (err, data) => {
            if (err) return "Error";
            return data.toString();
          }
        );
      } else {
        fs.readdir(`./share/${socket.user.username}/`, (err, data) => {
          if (err) throw err;
          return data.toString();
        });
      }
    }
  }

  _help() {
    return "USER: input username\nPASS: input password\nLIST: show list of files in directory (if logged)\nPWD: show directory (if logged)\nCWD: change working directory (if logged)\nRETR: retrieve file (if logged)\nSTOR: store file (if logged)\nHELP: get all available commands\nQUIT: close connection";
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
