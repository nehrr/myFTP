import net from "net";
import fs from "fs";
import readline from "readline";
import { log, argv } from "./utils";

class myFTPClient {
  constructor(host, port) {
    this._host = host;
    this._port = port;
  }

  _prompt() {
    log(">>", "white", false);

    const rl = readline.createInterface({
      input: process.stdin
    });

    rl.on("line", input => {
      this._socket.write(input);
    });
  }

  connect() {
    this._socket = net.createConnection({ port: this._port }, () => {
      log("connected to server!", "cyan");
      this._prompt();
    });

    this._socket.on("data", data => {
      console.log(data.toString());
    });

    this._socket.on("end", () => {
      log("disconnected from server", "cyan");
    });
  }
}

const args = argv();
if (args.length !== 2) {
  log("usage: client host port", "red");
  process.exit(-1);
}

let [host, port] = args;
const client = new myFTPClient(host, port);
client.connect();
