const moment = require("moment");
const colors = require("colors/safe");

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

log("poop", "magenta", true);
