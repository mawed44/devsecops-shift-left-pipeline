const { exec, execFile } = require('child_process');
const childProcess = require('child_process');

function vulnerable(req, callback) {
  const command = req.query.cmd;
  // ruleid: query-to-exec
  exec(command, callback);
}

function vulnerableWithNamespace(req, callback) {
  // ruleid: query-to-exec
  childProcess.exec(req.query.cmd, callback);
}

function vulnerableWithTypeValidation(req, callback) {
  const command = req.query.cmd;
  if (typeof command !== 'string' || command.trim() === '') {
    return;
  }
  // ruleid: query-to-exec
  exec(command, callback);
}

function fixedCommand(req, callback) {
  // ok: query-to-exec
  exec('node --version', callback);
}

function argumentsWithoutShell(req, callback) {
  // ok: query-to-exec
  execFile('/usr/bin/printf', ['%s', req.query.message], { shell: false }, callback);
}
