const express = require('express');
const { execFile } = require('node:child_process');
const app = express();
const port = 3000;

app.get('/exec', (req, res) => {
  const userInput = req.query.cmd;
  if (typeof userInput !== 'string' || userInput.trim() === '') {
    return res.status(400).send('Le paramètre cmd doit être une chaîne non vide.');
  }

  if (userInput !== 'node-version') {
    return res.status(400).send('Commande non autorisée. Utilisez node-version.');
  }

  // Aucun paramètre HTTP n'est transmis au processus et aucun shell n'est lancé.
  execFile(process.execPath, ['--version'], {
    shell: false,
    timeout: 5000,
    maxBuffer: 64 * 1024,
    windowsHide: true,
  }, (err, stdout) => {
    if (err) return res.status(500).send('Impossible de lire la version de Node.js.');
    res.type('text/plain').send(stdout);
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Serveur actif sur http://localhost:${port}`);
  });
}

module.exports = app;
