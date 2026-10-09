const assert = require('node:assert/strict');
const childProcess = require('node:child_process');
const { once } = require('node:events');
const { after, before, beforeEach, mock, test } = require('node:test');

// Installer le simulacre avant de charger l'application : aucun shell n'est lancé.
const execute = mock.method(childProcess, 'exec', () => {
  throw new Error('Une commande réelle ne doit jamais être exécutée dans les tests.');
});
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

test('GET /exec renvoie la sortie de la commande avec un statut 200', async () => {
  execute.mock.mockImplementation((command, callback) => {
    queueMicrotask(() => callback(null, 'sortie simulée\n'));
  });

  const response = await request('/exec?cmd=echo%20bonjour');
  assert.equal(response.status, 200);
  assert.equal(await response.text(), 'sortie simulée\n');
  assert.equal(execute.mock.callCount(), 1);
  assert.equal(execute.mock.calls[0].arguments[0], 'echo bonjour');
});

test('GET /exec renvoie un statut 500 si la commande échoue', async () => {
  execute.mock.mockImplementation((command, callback) => {
    queueMicrotask(() => callback(new Error('Échec simulé')));
  });

  const response = await request('/exec?cmd=commande');
  assert.equal(response.status, 500);
  assert.equal(await response.text(), 'Échec simulé');
  assert.equal(execute.mock.callCount(), 1);
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
  });
}

test('une route inconnue renvoie un statut 404 sans lancer de commande', async () => {
  const response = await request('/inconnue');
  assert.equal(response.status, 404);
  await response.text();
  assert.equal(execute.mock.callCount(), 0);
});
