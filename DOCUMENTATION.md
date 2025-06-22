# ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2

## Descriere generală

Acest proiect reprezintă o platformă web pentru generarea, vizualizarea și gestionarea dataset-urilor de tip **array numeric**, **array de caractere**, **matrice**, **grafuri** și **arbori**. Proiectul integrează o interfață de utilizator modernă (frontend JS), un backend PHP și o bază de date Oracle, oferind funcționalități de autentificare, operare și administrare a datelor.

---

## Structură proiect

- **Frontend**: JavaScript (fisiere principale `frontend/js/{profile.js, generator.js, register.js, admin.js}`), HTML, CSS
- **Backend**: PHP (`backend/Models/GeneratorModel.php`, `backend/Models/ProfileModel.php`, `backend/index.php`)
- **Baza de date**: Oracle, script SQL (`Pig_db.sql`)

---

## Funcționalități principale

### 1. Autentificare & Înregistrare Utilizator

- Validare date la înregistrare (`frontend/js/register.js`)
- Login/Logout, sesiuni protejate
- Acces diferențiat: utilizator/admin

### 2. Generator de date

- **Tipuri suportate**: 
  - Array numeric (`number_array`)
  - Array de caractere (`character_array`)
  - Matrice (`matrix`)
  - Grafuri (`graph`)
  - Arbori (`tree`)
- Pentru fiecare tip, datele sunt validate, procesate și stocate.

### 3. Vizualizare și filtrare istoric

- Secțiune "Profil" pentru afișarea și filtrarea dataset-urilor generate de utilizator, pe tipuri (istoric, statistici).
- Fiecare dataset poate fi detaliat, afișând meta-informații relevante.

---

## "Semantics Overlay" - Atenție specială

**Semantics Overlay** se referă la procesarea și vizualizarea sigură a dataset-urilor pentru a preveni interpretarea greșită sau afișarea incorectă a datelor (inclusiv managementul caracterelor speciale și a formatului JSON).

- Funcția `formatParsedOutputSafe(type, rawData)` din `frontend/js/profile.js` este centrală pentru această problemă:
  - Normalizează și protejează datele la afișare (escape HTML, validare tip, parsing JSON, fallback-uri pentru date invalide).
  - Afișează mesaje de eroare explicite pentru date corupte sau lipsă.
  - Asigură separarea clară între tipuri: array numeric, array de caractere, matrice/graf.

- Procesarea pe backend (ex. `GeneratorModel.php` și proceduri SQL din `Pig_db.sql`) asigură stocarea coerentă a datelor, inclusiv gestionarea CLOB/JSON și validarea formatului la scriere/citire.

**De ce e important?**
- Previne injecții de cod sau coruperea interfeței.
- Oferă utilizatorilor feedback clar și sigur la afișarea datelor.
- Permite extinderea facilă cu noi tipuri de date.

---

## Aspecte tehnice relevante

- **Backend PHP + Oracle:** comunicarea se face cu proceduri stocate, validare parametri, manipulare CLOB pentru date complexe (vezi inserări și procesări din `Pig_db.sql`).
- **Frontend JS:** folosește pattern-uri moderne (async/await, clasa ProfileManager, filtrare și actualizare DOM dinamic).
- **Protecție și acces:** paginile sensibile (`generator`, `profile`, `admin`) necesită autentificare sau rol de administrator.

---

## Scripturi și tabele Baza de date

- Tabele principale: `data_set`, `number_array`, `character_array`, `matrix`, `graph`, `tree`
- Legături între tabele conform tipului de dataset
- Proceduri pentru procesare, validare și inserare date în format JSON/CLOB
- Exemple de inserări și structură în `Pig_db.sql`

---

## Administrare

- Modul pentru administratori, logout securizat, gestionare utilizatori și date.

---

## Utilizare

1. Înregistrează un cont sau loghează-te.
2. Accesează generatorul pentru a crea un nou dataset.
3. Vizualizează istoricul și statistici în profil.
4. (Doar admin) Accesează zona de administrare pentru management extensiv.

---

## Extensibilitate

Arhitectura permite adăugarea de noi tipuri de date sau funcționalități cu efort minim, datorită separării pe componente și gestionării sigure a datelor (vezi "Semantics Overlay").

---

## Resurse utile

- [Cod sursă pe GitHub](https://github.com/MihneaDarie/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2)
- [Pig_db.sql](https://github.com/MihneaDarie/ProiectWEB_Darie_Mihnea_Stefan_2A2_Ciurariu_Raluca_Iuliana_2A2/blob/main/Pig_db.sql)
- Frontend JS: `frontend/js/profile.js`, `generator.js`, `register.js`, `admin.js`
- Backend PHP: `backend/Models/GeneratorModel.php`, `ProfileModel.php`, `index.php`

---

## Observații finale

- Pentru orice modificare a logicii de procesare/afișare, verificați funcțiile de tip `formatParsedOutputSafe` și coerența dintre frontend-backend.
- Respectați practicile de validare și "escape" a datelor pentru a menține siguranța aplicației.
