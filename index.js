const express = require('express');
const { exec } = require('child_process');
const app = express();
const port = 3000;

app.get('/exec', (req, res) => {
  const userInput = req.query.cmd;
  // Code intentionnellement non sécurisé pour tester Semgrep
  exec(userInput, (err, stdout) => {
    if (err) return res.status(500).send(err.message);
    res.send(stdout);
  });
});

app.listen(port, () => {
  console.log(`Serveur actif sur http://localhost:${port}`);
});