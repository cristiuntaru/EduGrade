EduGrade - Quiz & Grading Management System
==========================================

EduGrade is a web platform for professors and students to create, take, and grade quizzes.
It supports online quizzes and a scan-and-upload workflow for paper answer sheets.

1. Overview
-----------
EduGrade streamlines quiz creation, grading, and feedback. The project uses a static
frontend (HTML/CSS/JS) and a real Flask backend with PostgreSQL for persistence.

Core highlights:
- Role-based dashboards (professor / student)
- Quiz creation and management
- Submissions and scoring
- Analytics and AI feedback summaries
- CSV import/export tools
- OCR scan-and-upload workflow (accuracy tuning ongoing)

2. Main Features
----------------

Professor:
- Create, edit, publish, and delete quizzes
- View student submissions and scores
- Analytics dashboard with KPIs and charts
- Scan & upload paper answer sheets (OCR)

Student:
- See available quizzes
- Take quizzes online
- View grades and submission details
- AI feedback summary and recommendations

3. Project Structure
--------------------
backend/   - Flask backend (routes, models, migrations)
CSS/       - styles (base, professor, student)
HTML/      - pages (general, professor, student)
JS/        - frontend logic (API client, pages)
MEDIA/     - logos and icons
README.md  - documentation

Role separation:
- /HTML/student/, /CSS/student/, /JS/student/
- /HTML/professor/, /CSS/professor/, /JS/professor/

4. Tech Stack
-------------
Frontend:
- HTML5, CSS3, JavaScript
- Chart.js (analytics charts)

Backend:
- Python Flask
- Flask-JWT-Extended (auth)
- Flask-SQLAlchemy (ORM)
- Flask-Migrate + Alembic (migrations)

Database:
- PostgreSQL

OCR:
- OpenCV (scan processing)

5. Install and Run
------------------

5.1 Clone project
- Download ZIP from: https://github.com/cristiuntaru/EduGrade
  or
- git clone https://github.com/cristiuntaru/EduGrade.git

5.2 Backend setup
Open PowerShell and run:

cd "C:\Users\untar\Documents\Visual Studio Code Projects\Tehnologii Web\Edugrade - Proiect TW\Edugrade\backend"
.venv\Scripts\activate
pip install -r requirements.txt

Set env variables (example):
$env:DATABASE_URL="postgresql+psycopg2://edugrade_user:parola_puternica@localhost:5432/edugrade"
$env:JWT_SECRET="schimba-acest-secret"

Run migrations:
flask db upgrade

Start backend:
python app.py

5.3 Frontend
Open with Live Server or directly in browser:
http://127.0.0.1:5500/Edugrade/HTML/general/login.html

6. API Endpoints (implemented)
------------------------------
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me

- GET  /api/quizzes
- POST /api/quizzes
- GET  /api/quizzes/<id>
- PUT  /api/quizzes/<id>
- DELETE /api/quizzes/<id>

- POST /api/submissions
- GET  /api/submissions/<id>
- GET  /api/submissions/quiz/<id>
- GET  /api/submissions/me

- GET  /api/csv/quizzes/<id>/export-results
- POST /api/csv/quizzes/import

- POST /api/ocr/grade
- GET  /api/ocr/debug/<filename>

- GET  /api/health

7. Testing
----------
Manual testing via UI and API calls. OCR accuracy tuning is ongoing.

8. Current Limitations
----------------------
- OCR accuracy is still being improved.
- Scan quality affects OCR reliability (lighting, alignment, print settings).
- No automated test suite yet.

9. Authors
----------
Cristian Untaru - cristian.untaru05@e-uvt.ro
Catalin Pavel - catalin.pavel04@e-uvt.ro
