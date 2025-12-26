# 👨‍🏫 Guia de Vista Professor (Host View)

## 🎯 Què és la Vista Professor?

És una **pantalla especial** pensada per mostrar a la **classe** (projector/pantalla gran) mentre els estudiants juguen des dels seus dispositius.

---

## 📺 Diferències entre Vistes

### Vista Normal (`index.html`)
- **Per a:** Estudiants
- **On:** Mòbils, tablets dels estudiants
- **Mostra:** Pregunta + 4 botons per respondre
- **Funció:** Jugar i competir

### Vista Professor (`host.html`)
- **Per a:** Professor
- **On:** Projector / Pantalla gran de classe
- **Mostra:** 
  - ✅ Pregunta (igual que estudiants)
  - ✅ Quants han respost en temps real
  - ✅ Distribució de respostes (A: 5, B: 12, C: 3, D: 8)
  - ✅ Llista de qui ha respost
  - ✅ Estadístiques en directe
  - ✅ Codi QR per connectar-se
- **Funció:** Control i monitorització

---

## 🚀 Com Usar-ho

### Setup Inicial (Una vegada)

1. **Instal·la les dependències:**
   ```bash
   cd kahoot-quiz
   npm install
   ```

2. **Inicia el servidor:**
   ```bash
   npm start
   ```

3. **El servidor mostrarà:**
   ```
   🌐 Local access: http://localhost:8080
   📡 LAN access: http://192.168.1.X:8080
   ```

---

### Durant la Classe

#### 👨‍🏫 **Professor (Ordinador connectat al projector):**

1. **Obre el navegador**
2. **Escriu:** `http://localhost:8080/host.html`
   - O: `http://192.168.1.X:8080/host.html`
3. **Projecta aquesta pantalla!**

Veuràs:
- 📱 Codi QR gran perquè estudiants escanegin
- 📊 Comptador de jugadors connectats
- 🎮 Botó "Començar el Joc"

#### 📱 **Estudiants (Mòbils/Tablets):**

1. **Escanegen el codi QR** de la pantalla
   - O escriuen: `http://192.168.1.X:8080`
2. **Posen el seu nom**
3. **Esperen que comenci el joc**

---

## 🎮 Durant el Joc

### Pantalla del Professor mostra:

#### **Lobby (Sala d'espera):**
```
┌─────────────────────────────────┐
│  📱 Codi QR [GRAN]              │
│  http://192.168.1.105:8080      │
│                                 │
│  Jugadors Connectats: 24       │
│  • Maria                        │
│  • Joan                         │
│  • Pere                         │
│  • ...                          │
│                                 │
│  [🎮 Començar el Joc]           │
└─────────────────────────────────┘
```

#### **Pregunta activa:**
```
┌──────────────────────────┬──────────────────┐
│ Pregunta 3/10       ⏱️ 12 │ 📊 Estadístiques │
│                          │                  │
│ Quina és la capital      │ Han respost:     │
│ de França?               │ 18/24            │
│                          │                  │
│ [A] Madrid    [B] París  │ Distribució:     │
│ [C] Roma      [D] Berlín │ A: ████ 2 (11%)  │
│                          │ B: ████████ 10   │
│                          │ C: ██ 3 (17%)    │
│                          │ D: ███ 3 (17%)   │
│                          │                  │
│                          │ ✅ Han respost:  │
│                          │ • Maria - B      │
│                          │ • Joan - A       │
│                          │ • Pere - B       │
└──────────────────────────┴──────────────────┘
```

#### **Resposta revelada:**
```
┌──────────────────────────┬──────────────────┐
│ ✅ Resposta Correcta     │ 📊 Resultats     │
│                          │                  │
│ Quina és la capital      │ Correctes: 15    │
│ de França?               │ Incorrectes: 9   │
│                          │                  │
│ [A] Madrid    [B] París✅ │ Distribució:     │
│ [C] Roma      [D] Berlín │ A: 2             │
│                          │ B: 15 ✅         │
│                          │ C: 3             │
│                          │ D: 4             │
└──────────────────────────┴──────────────────┘
```

#### **Classificació:**
```
┌─────────────────────────────────┐
│      📊 Classificació           │
│   Pregunta 3/10                 │
│                                 │
│ 🥇 #1  Maria        520 pts     │
│ 🥈 #2  Joan         480 pts     │
│ 🥉 #3  Pere         450 pts     │
│    #4  Anna         420 pts     │
│    #5  Laura        400 pts     │
│    #6  Marc         380 pts     │
│    ...                          │
└─────────────────────────────────┘
```

---

## ⚙️ Configuració Tècnica

### URLs a recordar:

| Qui | URL | Què mostra |
|-----|-----|------------|
| **Estudiants** | `http://192.168.1.X:8080` | Vista normal (jugar) |
| **Professor** | `http://192.168.1.X:8080/host.html` | Vista control |
| **QR Display** | `qr-display.html?ip=192.168.1.X` | Només QR gran |

---

## 🎯 Millors Pràctiques

### ✅ Configuració Recomanada:

1. **Ordinador professor:**
   - Connectat al projector
   - Obre `/host.html`
   - Pantalla completa (F11)

2. **Estudiants:**
   - Escanegen QR de la pantalla
   - O escriuen l'adreça si no tenen càmera

3. **Wifi:**
   - Tots a la mateixa xarxa
   - Professor comprova IP abans de començar

### 💡 Consells:

1. **Prova abans:** 
   - Obre la vista professor 5 minuts abans
   - Comprova que el QR funciona

2. **Contingència:**
   - Escriu l'URL a la pissarra per si falla el QR
   - Tingues un dispositiu de prova

3. **Presentació:**
   - Pantalla completa (més visual)
   - Volum de l'ordinador activat (opcional)

4. **Durant el joc:**
   - Observa les estadístiques
   - Comenta respostes interessants
   - Celebra els encerts!

---

## 🔧 Solució de Problemes

### ❌ Problema: No es veu la vista professor
**Solució:** Comprova que has escrit `/host.html` al final de l'URL
```
Incorrecte: http://192.168.1.X:8080
Correcte:   http://192.168.1.X:8080/host.html
```

### ❌ Problema: No es veuen les estadístiques en directe
**Solució:** Assegura't que estàs usant la versió actualitzada del servidor (`server.js` amb l'event `player_answered`)

### ❌ Problema: El QR no funciona
**Solució:** 
- Comprova que la IP és correcta
- Prova d'escriure manualment l'URL
- Utilitza `qr-display.html` com a alternativa

---

## 📊 Avantatges de la Vista Professor

| Avantatge | Benefici |
|-----------|----------|
| **Visibilitat** | Tothom veu la pregunta a la pantalla gran |
| **Control** | Professor veu qui ha respost |
| **Engagement** | Estadístiques en directe creen emoció |
| **Transparència** | Estudiants veuen que és just |
| **Pedagogia** | Professor pot comentar respostes |
| **Inclusió** | Qui no veu bé el mòbil, mira la pantalla |

---

## 🎓 Usos Educatius

### Abans de revelar la resposta:
- "Veig que la majoria ha triat B, però alguns A..."
- "Encara queden 5 persones per respondre!"
- "Interessant! Les opcions estan molt repartides"

### Després de revelar:
- "15 de vosaltres ho heu encertat! Molt bé!"
- "Vegem per què C no és correcta..."
- "Qui pot explicar per què B és la resposta?"

### Durant el joc:
- Crea suspens amb el temps
- Anima els que van més lents
- Celebra les respostes ràpides

---

## 📝 Resum Ràpid

```
1. npm start                    → Inicia servidor
2. Projector: /host.html        → Vista professor
3. Estudiants: escanegen QR     → Es connecten
4. Professor: Començar joc      → A jugar!
5. Monitoritza estadístiques    → Veu tot en directe
6. Gaudeix del joc!             → 🎉
```

---

## 🎁 Bonus: Opcions Avançades

### Vols només mostrar el QR?
```
Obre: qr-display.html?ip=TU_IP
Resultat: Pantalla amb QR gegant
```

### Vols dues pantalles?
```
Pantalla 1 (projector): host.html
Pantalla 2 (tablet): qr-display.html
```

### Vols gravar la sessió?
```
Utilitza software de captura de pantalla
Mostra després a classe els moments destacats
```

---

**Bon joc! 🎮📚**
