const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.get('/exec', (req, res) => {
  const userInput = req.query.cmd;
  if (typeof userInput !== 'string' || userInput.trim() === '') {
    return res.status(400).send('Le paramètre cmd doit être une chaîne non vide.');
  }

  // Code intentionnellement non sécurisé pour tester Semgrep
  exec(userInput, (err, stdout) => {
    if (err) return res.status(500).send(err.message);
    res.send(stdout);
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Serveur actif sur http://localhost:${port}`);
  });
}

module.exports = app;
