# Fidèle — Flow applicatif & étude de cas

---

## Vue d'ensemble

**Fidèle** est une plateforme de fidélisation pour restaurants. Elle connecte trois types d'acteurs :

| Acteur | Interface | Accès |
|---|---|---|
| **Gérant** | `/dashboard` | Email + mot de passe (Supabase Auth) |
| **Serveur / Caissier** | `/staff` | Nom + mot de passe (table `staff`) |
| **Client** | `/client` | Numéro de téléphone + mot de passe |

---

## Architecture des rôles

```
┌─────────────────────────────────────────────────────┐
│                    GÉRANT                           │
│  Dashboard · Statistiques · Équipe · Paramètres     │
│  Récompenses · Vue globale                          │
└──────────────────────┬──────────────────────────────┘
                       │ configure
          ┌────────────▼────────────┐
          │      RESTAURANT         │
          │  nom · logo · cover     │
          │  description · couleur  │
          └────────┬────────────────┘
         opère     │        visite
    ┌──────────────┘              └──────────────────┐
    ▼                                                 ▼
┌──────────────────┐                    ┌─────────────────────┐
│    SERVEUR       │                    │      CLIENT         │
│  /staff          │                    │  /client            │
│  · Générer QR    │──── scan QR ──────▶│  · Voir ses points  │
│  · Accepter      │◀─── demande ───────│  · Récompenses      │
│    demandes      │                    │  · Historique       │
└──────────────────┘                    └─────────────────────┘
```

---

## Flow complet étape par étape

### 1. Mise en place (Gérant)

```
Gérant ouvre /dashboard
    │
    ├── Va dans /settings
    │       · Saisit le nom du restaurant
    │       · Ajoute logo (URL) + photo de couverture
    │       · Ajoute une description
    │       · Choisit la couleur d'accent
    │       · Sauvegarde → PATCH /api/restaurant
    │
    ├── Va dans /rewards
    │       · Crée des récompenses (ex: "Café offert" = 50 pts)
    │       · Chaque récompense a un nom, description, coût en points
    │
    └── Va dans /dashboard/staff
            · Crée les comptes serveurs (nom + mot de passe)
            · Rôle : Serveur ou Caissier
```

---

### 2. Connexion du serveur

```
Serveur ouvre /staff sur sa tablette / téléphone
    │
    ├── Écran de login
    │       · Saisit son nom (insensible à la casse)
    │       · Saisit son mot de passe
    │       · POST /api/staff/login → { id, name, role }
    │       · Session stockée en localStorage
    │
    └── Accède à l'interface avec deux onglets :
            [QR Code]  [Demandes]
```

---

### 3. Génération d'un QR Code (Serveur → Client)

```
Client passe sa commande et paie → 180 MAD

Serveur (onglet QR Code)
    │
    ├── Saisit le montant : 180
    │       · Calcul automatique : 180 ÷ 10 = 18 pts
    │
    ├── Clique "Générer le QR Code"
    │       · POST /api/qr-tokens { amount: 180 }
    │       · Serveur crée un token UUID dans qr_tokens (used_at = null)
    │       · Génère un QR pointant vers :
    │         https://app.fidele.ma/join?token=<uuid>
    │
    └── Présente le QR au client sur l'écran
```

---

### 4. Scan du QR par le client (Nouveau client)

```
Client scanne le QR avec son téléphone
    │
    ├── Redirigé vers /join?token=<uuid>
    │
    ├── Étape 1 — Téléphone
    │       · Saisit son numéro : 0612345678
    │       · POST /api/client/data { phone } → vérification
    │       · Résultat : numéro inconnu → nouveau client
    │
    ├── Étape 2 — Inscription
    │       · Saisit son nom : Youssef Alami
    │       · Choisit un mot de passe : ••••••••
    │
    ├── Validation → Server Action processJoinWithToken()
    │       · Vérifie token valide et non utilisé
    │       · Crée le client dans clients (points = 0)
    │       · Crée une visite dans visits (amount=180, points=18)
    │       · Met à jour points_balance = 18
    │       · Marque le token used_at = now()
    │
    └── Écran succès
            · "Bravo, Youssef ! +18 pts"
            · Nouveau solde : 18 pts
            · Redirection automatique vers /client dans 4s
```

---

### 5. Scan du QR (Client existant)

```
Client existant scanne le QR
    │
    ├── Étape 1 — Téléphone → numéro reconnu
    │
    ├── Étape 2 — Mot de passe
    │       · POST /api/client/login { phone, password }
    │       · Vérification hash SHA-256
    │
    └── Validation → points ajoutés au solde existant
```

---

### 6. Portefeuille client (/client)

```
Client ouvre /client
    │
    ├── Premier accès (pas de session)
    │       · Écran d'accueil avec deux options :
    │         [Saisir mon numéro]  ou  [Scanner un QR]
    │       · Saisit numéro + mot de passe
    │       · POST /api/client/data → charge ses restaurants
    │
    ├── Écran d'accueil
    │       · Carte hero : total fidélité tous restaurants
    │       · Liste de ses restaurants avec points par restaurant
    │       · Progression vers le palier suivant (Bronze / Argent / Or)
    │
    └── Clic sur un restaurant → vue détail
            · Photo de couverture + logo du restaurant
            · Description du restaurant
            · Solde de points + progression palier
            · Liste des récompenses disponibles
            · Historique des visites
```

---

### 7. Demande de récompense (Client → Serveur)

```
Client (vue détail restaurant)
    │
    ├── Voit : "Café offert — 50 pts"  [Utiliser]
    │       · Son solde : 120 pts → peut se permettre
    │
    ├── Clique "Utiliser"
    │       · Modal de confirmation
    │       · Clique "Confirmer"
    │
    ├── POST /api/redemption
    │       · Vérifie solde suffisant
    │       · Vérifie absence de demande pendante pour cette récompense
    │       · Crée redemption_request { status: 'pending' }
    │
    ├── Bouton passe à "Envoyé ✓"
    │       (une seule demande active par récompense jusqu'à acceptation)
    │
    └── Client présente son téléphone au serveur
```

---

### 8. Acceptation de la demande (Serveur)

```
Serveur (onglet Demandes)
    │
    ├── Voit : "Café offert · Youssef · 50 pts"
    │
    ├── Clique ✓ Accepter
    │       · PATCH /api/redemption/<id> { action: 'accept' }
    │       · Déduit 50 pts du solde client : 120 - 50 = 70 pts
    │       · Passe status → 'accepted'
    │
    └── La demande disparaît de la liste
```

---

## Étude de cas complète

### Restaurant : "Le Palais Andalou" · Casablanca

---

**Semaine 1 — Installation**

Le gérant Karim ouvre le dashboard, configure le restaurant :
- Logo uploadé, photo de couverture (terrasse), couleur d'accent bordeaux
- Crée 3 récompenses : Café (30 pts), Dessert (80 pts), Repas offert (200 pts)
- Crée 2 comptes serveurs : Hamza (caissier) et Sara (serveuse)

---

**Lundi soir — Premier client**

Fatima dîne pour la première fois. Addition : **240 MAD**.

```
Sara (tablette caisse) :
  → Saisit 240 MAD → génère QR → présente à Fatima

Fatima (iPhone) :
  → Scanne le QR
  → Saisit son numéro : 0661234567
  → Nouveau client → choisit nom "Fatima B." + mot de passe
  → Reçoit +24 pts
  → Redirigée vers /client : solde 24 pts, palier Bronze
```

---

**Jeudi — Deuxième visite**

Fatima revient. Addition : **180 MAD**.

```
Hamza génère le QR pour 180 MAD.

Fatima scanne :
  → Téléphone reconnu → saisit mot de passe
  → +18 pts → solde total : 42 pts
```

---

**Semaine 3 — Récompense**

Fatima accumule 85 pts. Elle veut le dessert.

```
Fatima ouvre /client :
  → Clique sur "Le Palais Andalou"
  → Voit "Dessert offert — 80 pts" [Utiliser]
  → Confirme la demande

Hamza (onglet Demandes) :
  → Voit "Dessert offert · Fatima B. · 80 pts"
  → Clique ✓
  → Solde Fatima : 85 - 80 = 5 pts
  → Sert le dessert

Fatima : progression vers Argent (501 pts)
```

---

## Schéma des tables Supabase

```
restaurants          clients               staff
───────────          ───────               ─────
id                   id                    id
name                 restaurant_id ──────▶ restaurant_id
description          name                  name
logo_url             phone                 password_hash
cover_url            password_hash         role
accent_color         points_balance
phone                total_visits
                     total_spent

qr_tokens            visits                rewards
─────────            ──────                ───────
id (UUID)            id                    id
restaurant_id        client_id             restaurant_id
amount               restaurant_id         name
used_at              amount_paid           description
                     points_earned         points_cost
                                           active

redemption_requests
───────────────────
id
client_id
restaurant_id
reward_id
reward_name
reward_points
client_name
status (pending | accepted | rejected)
```

---

## Règles métier clés

| Règle | Détail |
|---|---|
| **Points** | 1 pt par 10 MAD dépensés (plancher) |
| **QR à usage unique** | `used_at` est défini après le premier scan — le token est invalide ensuite |
| **Mot de passe** | Hashé en SHA-256, jamais stocké en clair |
| **Une demande à la fois** | Un client ne peut avoir qu'une demande `pending` par récompense |
| **Paliers** | Bronze 0–500 · Argent 501–1000 · Or 1001+ |
| **Multi-restaurant** | Un client peut être fidèle à plusieurs restaurants avec un seul compte téléphone |
