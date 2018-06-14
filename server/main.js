// const net = require("net");
const fs = require("fs");
const db = require("./db.json");

function checkUser(username) {
  //checks for login
  for (let item of db) {
    if (item.user == username) {
      return true;
    }
  }
  return false;
}

function checkPw(user, password) {
  if (checkUser(user) == true) {
    for (item of db) {
      if (item.password == password) {
        return true;
      }
    }
    return false;
  }
}

function list(user, directory) {
  //returns items in directory
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

function get(filename) {
  //returns file
  fs.copyFile(`./share/${user}/${filename}`, `${filename}`, err => {
    if (err) throw err;
    console.log("file was copied");
  });
}

function put(filename) {
  //returns nothing
  fs.copyFile(`${filename}`, `./share/hawke/${filename}`, err => {
    if (err) throw err;
    console.log("file was added");
  });
}

function cwd(directory) {
  //changes directory
}

console.log(checkUser("hawke"));
console.log(checkPw("hawke", "nope"));
list("hawke", "share");
// get("hello.txt");
// put("boop.txt");

//
// const server = net.createServer(c => {
//   // 'connection' listener
//   console.log("client connected");
//   c.on("end", () => {
//     console.log("client disconnected");
//   });
//   c.write("Beep boop I'm a roboto server!\r\n");
//   c.pipe(c);
// });
//
// server.on("error", err => {
//   throw err;
// });
//
// server.listen(4242, () => {
//   console.log("server bound");
// });
