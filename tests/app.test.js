const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const { once } = require('node:events');
const { after, before, beforeEach, mock, test } = require('node:test');

// Installer les simulacres avant de charger l'application : aucun processus n'est lancé.
function unexpectedExecution() {
  throw new Error('Un processus réel ne doit jamais être exécuté dans les tests.');
}
const execute = mock.method(childProcess, 'execFile', unexpectedExecution);
const shell = mock.method(childProcess, 'exec', unexpectedExecution);
const app = require('../index');
let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await once(server, 'listening');
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

beforeEach(() => {
  execute.mock.resetCalls();
  execute.mock.mockImplementation(unexpectedExecution);
  shell.mock.resetCalls();
});

after(async () => {
  try {
    if (server) {
      await new Promise((resolve, reject) => {
        server.close((error) => error ? reject(error) : resolve());
      });
    }
  } finally {
    mock.restoreAll();
  }
});

function request(path) {
  return fetch(`${baseUrl}${path}`, { signal: AbortSignal.timeout(3000) });
}

test('GET /exec lance uniquement Node.js avec des arguments fixes, sans shell', async () => {
  execute.mock.mockImplementation((file, args, options, callback) => {
    queueMicrotask(() => callback(null, 'v22.18.0\n'));
  });

  const response = await request('/exec?cmd=node-version');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'v22.18.0\n');
  assert.match(response.headers.get('content-type'), /^text\/plain/);
  assert.equal(execute.mock.callCount(), 1);
  const [file, args, options] = execute.mock.calls[0].arguments;
  assert.equal(file, process.execPath);
  assert.deepEqual(args, ['--version']);
  assert.equal(options.shell, false);
  assert.equal(options.timeout, 5000);
  assert.equal(options.maxBuffer, 64 * 1024);
  assert.equal(options.windowsHide, true);
  assert.equal(shell.mock.callCount(), 0);
});

test('GET /exec renvoie un statut 500 si la commande échoue', async () => {
  execute.mock.mockImplementation((file, args, options, callback) => {
    queueMicrotask(() => callback(new Error('Détail interne du processus')));
  });

  const response = await request('/exec?cmd=node-version');
  assert.equal(response.status, 500);
  assert.equal(await response.text(), 'Impossible de lire la version de Node.js.');
  assert.equal(execute.mock.callCount(), 1);
  assert.equal(shell.mock.callCount(), 0);
});

for (const [label, query] of [
  ['absent', ''],
  ['vide', '?cmd='],
  ['composé uniquement d’espaces', '?cmd=%20%20'],
  ['répété', '?cmd=une&cmd=deux'],
  ['sous forme d’objet', '?cmd[argument]=valeur'],
]) {
  test(`GET /exec rejette un paramètre cmd ${label} sans lancer de commande`, async () => {
    const response = await request(`/exec${query}`);
    assert.equal(response.status, 400);
    assert.equal(await response.text(), 'Le paramètre cmd doit être une chaîne non vide.');
    assert.equal(execute.mock.callCount(), 0);
    assert.equal(shell.mock.callCount(), 0);
  });
}

for (const command of [
  'echo bonjour',
  'node-version; whoami',
  'node-version && whoami',
  'node-version | whoami',
  'node-version\nwhoami',
  'node-version$(whoami)',
  'node-version`whoami`',
  'node-version --eval=process.exit()',
  '../node-version',
]) {
  test(`GET /exec rejette la commande ${JSON.stringify(command)} sans lancer de processus`, async () => {
    const response = await request(`/exec?cmd=${encodeURIComponent(command)}`);
    assert.equal(response.status, 400);
    assert.equal(await response.text(), 'Commande non autorisée. Utilisez node-version.');
    assert.equal(execute.mock.callCount(), 0);
    assert.equal(shell.mock.callCount(), 0);
  });
}

test('une route inconnue renvoie un statut 404 sans lancer de commande', async () => {
  const response = await request('/inconnue');
  assert.equal(response.status, 404);
  await response.text();
  assert.equal(execute.mock.callCount(), 0);
  assert.equal(shell.mock.callCount(), 0);
});
