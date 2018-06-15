import moment from "moment";
import colors from "colors/safe";

export function argv() {
  return process.argv.slice(2);
}

export function log(str, color = "magenta", withNewLine = true) {
  // colors.setTheme({
  //   myColor: color
  // });
  const display = colors[color](`${moment().format()} - ${str}`);
  if (withNewLine) {
    console.log(display);
  } else {
    process.stdout.write(display);
  }
}

export function isAllowedCommand(cmd) {
  const cmds = [
    "USER",
    "PASS",
    "LIST",
    "PWD",
    "CWD",
    "RETR",
    "STOR",
    "HELP",
    "QUIT"
  ];

  //return index, if -1 means it does not exist
  return cmds.indexOf(cmd) !== -1;
}

/* old

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
  fs.copyFile(`./share/${user}/${filename}`, `~/Desktop/${filename}`, err => {
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
*/
