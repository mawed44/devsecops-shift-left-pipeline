# Shift-Left CI/CD Pipeline (SAST, SCA & Secret Detection)

Ce projet met en œuvre des contrôles de sécurité automatisés dans **GitHub Actions**, selon l'approche **Shift-Left Security**. Il vise à détecter les secrets, les failles du code et les dépendances vulnérables avant leur intégration dans la branche principale.

---

### Problématique

Des secrets exposés, du code dangereux ou des bibliothèques vulnérables peuvent être introduits lors des contributions. Une vérification  manuelle ne suffit pas à contrôler systématiquement chaque modification.

### Solution apportée

Le [workflow](.github/workflows/evsecops-pipeline.yml) exécute trois scans complémentaires en parallèle et fait échouer les contrôles non conformes. Une application Node.js/Express volontairement vulnérable sert de support de démonstration, à utiliser dans un environnement de laboratoire isolé.

### Piliers de sécurité intégrés

| Étape | Outil | Rôle et détection | Comportement Quality Gate |
| :--- | :--- | :--- | :--- |
| **Secrets Scanning** | **Gitleaks** | Recherche de clés API, tokens et mots de passe codés en dur | Échec si un secret est détecté |
| **SAST** | **Semgrep** | Analyse statique du code et recherche de constructions dangereuses | Échec sur sévérité `ERROR` |
| **SCA** | **Trivy** | Recherche de vulnérabilités connues dans les dépendances (CVE) | Échec sur sévérités `HIGH` et `CRITICAL` |

### Objectifs clés

- **Automatisation continue** : exécution à chaque `push` sur `main` et lors des `pull_request` vers cette branche.
- **Contrôles bloquants** : empêcher les fusions non conformes lorsque les scans sont rendus obligatoires dans les règles de protection de `main`.
- **Réduction du bruit** : cibler les niveaux de sévérité pertinents pour les équipes de développement.

### Résultats attendus

- Signalement des secrets, des constructions dangereuses et des dépendances vulnérables couverts par les scans.
- Échec des jobs lorsqu'une détection correspond aux seuils configurés.
- Consultation des résultats et des logs dans l'onglet **Actions** du dépôt GitHub.

Le `package-lock.json` fige les dépendances analysées par Trivy. Le job SCA les installe avec `npm ci --ignore-scripts --no-audit --no-fund` avant le scan. Les actions sont fixées par SHA, l'image Semgrep par empreinte SHA-256 et les permissions GitHub limitées à la lecture.

### Licence

Ce projet est distribué sous licence **MIT**.
