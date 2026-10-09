# DevSecOps Shift-Left Pipeline (SAST, SCA & Secret Detection)

[![CI](https://github.com/mawed44/devsecops-shift-left-pipeline/actions/workflows/evsecops-pipeline.yml/badge.svg)](https://github.com/mawed44/devsecops-shift-left-pipeline/actions/workflows/evsecops-pipeline.yml)

Ce laboratoire montre comment intégrer des tests et des scans de sécurité dans **GitHub Actions** dès les contributions (**Shift-Left**). Une petite API Node.js/Express sert de support de démonstration.

### Problématique

Un changement de code peut introduire un secret exposé, une injection de commandes ou une dépendance vulnérable. Ces problèmes doivent être détectés avant la fusion dans `main`.

### Solution apportée

À chaque `push` sur `main` et `pull_request` vers cette branche, le [workflow](.github/workflows/evsecops-pipeline.yml) lance les tests et trois scans en parallèle :

| Outil | Contrôle | Échec du job |
| :--- | :--- | :--- |
| **Gitleaks** | Secrets codés en dur | Secret détecté |
| **Semgrep (SAST)** | Code dangereux, notamment les injections de commandes | Sévérité `ERROR` |
| **Trivy (SCA)** | Vulnérabilités des dépendances dans `package-lock.json` | Sévérité `HIGH` ou `CRITICAL` |

Les tests HTTP vérifient les réponses de l'API et le rejet des tentatives d'injection, avec des processus simulés. La [règle Semgrep personnalisée](.semgrep/rules/query-to-exec.yml) est testée sur des exemples vulnérables et sûrs.

### Résultats attendus

- Détection des problèmes de sécurité couverts par les scanners avant fusion.
- Rapports **SARIF** téléchargeables dans **Actions** pendant 30 jours, même en cas d'échec, et alertes dans **Security → Code scanning** pour les dépôts publics.
- Fusion bloquée si les tests et scans sont configurés comme contrôles obligatoires dans les règles de protection de `main`.

### Lancer le projet

Avec **Node.js 22** :

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm test
npm start
```

Ouvrir `http://localhost:3000/exec?cmd=node-version` pour obtenir la version de Node.js. L'API exécute cette action fixe sans shell ; toute autre valeur de `cmd` est refusée avec un statut `400`.

### Licence

Ce projet est distribué sous licence **MIT**.
