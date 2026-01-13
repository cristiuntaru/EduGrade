🎓 EduGrade -- Quiz & Grading Management System
==============================================

O aplicație web modernă pentru profesori și studenți, care permite crearea, gestionarea și corectarea testelor tip quiz. Platforma suportă atât teste online, cât și scanarea foilor completate pe hârtie.

* * * * *

📌 1. Descriere generală
------------------------

EduGrade simplifică modul în care profesorii creează și corectează teste, iar studenții primesc rezultate și feedback instant.\
Aplicația funcționează 100% în browser și este construită pe un frontend static (HTML, CSS, JS), cu plan de extindere către un backend real (Flask + OCR + AI).

Proiectul demonstrează:

-   organizarea unei platforme educaționale

-   crearea și evaluarea quiz-urilor

-   afișarea de analize statistice

-   generarea de feedback inteligent pentru studenți

* * * * *

⭐ 2. Funcționalități principale
-------------------------------

### 👨‍🏫 Profesor

-   Creare quiz-uri cu întrebări multiple-choice

-   Editare / ștergere / publicare quiz-uri

-   Vizualizare răspunsuri trimise de studenți

-   Dashboard cu statistici și analize (grafice, KPI-uri)

-   Modul „Scan & Upload" pentru viitorul OCR

### 🎓 Student

-   Vizualizare quiz-uri disponibile

-   Completare teste online

-   Vizualizare note și status per test

-   Feedback inteligent generat automat

-   Dashboard și „Tip of the Day"

* * * * *

🗂️ 3. Structura proiectului
----------------------------

CSS/        → stilurile aplicației (general + pagini)\
HTML/       → paginile pentru student & profesor\
JS/         → logica aplicației (gestionare quiz-uri, analytics, feedback)\
MEDIA/      → iconițe și logo-uri\
README.md   → documentația proiectului

Platforma este complet separată pe roluri:

-   `/HTML/student/`
-   `/HTML/professor/`
-   `/CSS/student/`
-   `/CSS/professor/`
-   `/JS/student/`
-   `/JS/professor/`

* * * * *

🛠️ 4. Tehnologii utilizate
---------------------------

### Frontend (implementat)

-   **HTML5, CSS3, JavaScript**
-   **Chart.js** -- grafice și statistici
-   **LocalStorage API** -- stocarea datelor pentru demonstrație
-   **SVG Assets** -- logo + favicon

### Planned for full version

-   **Python Flask** -- backend REST API
-   **PostgreSQL / MySQL** -- baza de date
-   **OpenCV** -- OCR pentru corectarea testelor scanate
-   **LLM / NLP** -- AI Feedback Assistant

* * * * *

🔧 5. Instalare și rulare
-------------------------

### 🔹 Instalare

Clonează repository-ul:

`git clone https://github.com/cristiuntaru/EduGrade.git`

Apoi deschide folderul proiectului în **VS Code**.

* * * * *

### 🔹 Rulare

Fiind o aplicație statică, poate fi rulată direct în browser:

1.  Deschide fișierul:

`HTML/general/home.html`

și

2.  Rulează cu extensia **Live Server** din VS Code.

* * * * *

📡 6. Documentație API (planificare)
------------------------------------

Backend-ul final va expune endpoint-uri precum:

-   `POST /auth/login`
-   `GET /quizzes`
-   `POST /submit`
-   `GET /analytics/:quizId`

*Notă: acestea nu sunt încă implementate în versiunea curentă.*

* * * * *

🧪 7. Testare
-------------

În prezent proiectul este numai frontend, deci nu include un framework de testare.\
În versiunea completă, backend-ul Flask va utiliza:

-   teste unitare
-   teste de integrare
-   Pytest

* * * * *

⚠️ 8. Limitări actuale
----------------------

-   Nu există backend real (doar LocalStorage).
-   OCR și AI Feedback sunt doar prototipuri.
-   Nu există management real de utilizatori (login autentic).
-   Datele nu sunt persistente în afara browserului.

* * * * *

🚀 9. Plan de dezvoltare viitor
-------------------------------

-   Implementare backend Flask + baza de date
-   Modul OCR complet (scanare + detecție răspunsuri)
-   AI Feedback Assistant (LLM + generare de recomandări)
-   Export / Import CSV pentru rezultate
-   Administrare conturi, clase și permisiuni
-   Dashboard multi-rol pentru Admin / Profesor / Student

* * * * *

👤 10. Authors
------------

**Cristian Untaru**\
Email: **cristian.untaru05@e-uvt.ro**\
**Cătălin Pavel**\
Email: **catalin.pavel04@e-uvt.ro**