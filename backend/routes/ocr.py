import os
import re
import uuid
from datetime import datetime

from flask import Blueprint, jsonify, request, send_from_directory
from flask_jwt_extended import get_jwt, jwt_required
from sqlalchemy.orm import joinedload
from werkzeug.security import generate_password_hash
from werkzeug.utils import secure_filename

from models import Choice, Question, Quiz, Submission, SubmissionAnswer, User, db

ocr_bp = Blueprint("ocr", __name__, url_prefix="/api/ocr")

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "..", "uploads")


def _require_professor():
    claims = get_jwt()
    return claims.get("role") == "professor"


def _ensure_upload_dir():
    os.makedirs(UPLOAD_DIR, exist_ok=True)


@ocr_bp.get("/debug/<path:filename>")
def get_debug_image(filename):
    _ensure_upload_dir()
    return send_from_directory(UPLOAD_DIR, filename)


def _slugify(value):
    value = value.lower().strip()
    value = re.sub(r"[^a-z0-9]+", ".", value)
    value = value.strip(".")
    return value or "student"


def _get_or_create_student(name, email=None):
    if email:
        existing = User.query.filter_by(email=email).first()
        if existing:
            return existing

    normalized_name = (name or "").strip()
    if normalized_name:
        existing_by_name = (
            User.query.filter_by(name=normalized_name, role="student").first()
        )
        if existing_by_name:
            return existing_by_name

    slug = _slugify(normalized_name or "student")
    email = email or f"{slug}.{uuid.uuid4().hex[:6]}@scan.local"

    user = User(
        name=normalized_name or "Student",
        email=email,
        password_hash=generate_password_hash(uuid.uuid4().hex),
        role="student",
    )
    db.session.add(user)
    db.session.flush()
    return user


def _warp_to_a4(image):
    import cv2
    import numpy as np

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    edges = cv2.Canny(blur, 50, 150)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None

    contours = sorted(contours, key=cv2.contourArea, reverse=True)
    page = None
    for cnt in contours[:5]:
        peri = cv2.arcLength(cnt, True)
        approx = cv2.approxPolyDP(cnt, 0.02 * peri, True)
        if len(approx) == 4:
            page = approx
            break

    if page is None:
        return None

    pts = page.reshape(4, 2).astype("float32")
    s = pts.sum(axis=1)
    diff = np.diff(pts, axis=1)

    top_left = pts[s.argmin()]
    bottom_right = pts[s.argmax()]
    top_right = pts[diff.argmin()]
    bottom_left = pts[diff.argmax()]

    width = 1700
    height = 2200
    dst = np.array(
        [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]],
        dtype="float32",
    )

    matrix = cv2.getPerspectiveTransform(
        np.array([top_left, top_right, bottom_right, bottom_left], dtype="float32"),
        dst,
    )
    warped = cv2.warpPerspective(image, matrix, (width, height))
    return warped


def _detect_marks(warped):
    import cv2
    import numpy as np

    gray = cv2.cvtColor(warped, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    binary = cv2.adaptiveThreshold(
        blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 31, 10
    )
    binary_inv = cv2.bitwise_not(binary)

    height, width = binary.shape[:2]
    labels = ["A", "B", "C", "D"]

    def find_markers():
        contours, _ = cv2.findContours(binary_inv, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        candidates = []
        min_dim = min(height, width)
        min_size = max(8, int(min_dim * 0.006))
        max_size = int(min_dim * 0.05)
        for cnt in contours:
            x, y, w, h = cv2.boundingRect(cnt)
            if w < min_size or h < min_size:
                continue
            if w > max_size or h > max_size:
                continue
            ratio = w / float(h)
            if ratio < 0.75 or ratio > 1.25:
                continue
            area = w * h
            if area < (min_size * min_size) or area > (max_size * max_size * 1.2):
                continue
            contour_area = cv2.contourArea(cnt)
            if contour_area / float(area) < 0.6:
                continue
            candidates.append((x, y, w, h))
        if len(candidates) < 4:
            return None

        candidates = sorted(candidates, key=lambda c: c[1])
        split = max(2, len(candidates) // 2)
        top = sorted(candidates[:split], key=lambda c: c[0])
        bottom = sorted(candidates[split:], key=lambda c: c[0])
        if len(top) < 2 or len(bottom) < 2:
            return None

        tl = top[0]
        tr = top[-1]
        bl = bottom[0]
        br = bottom[-1]
        return [tl, tr, bl, br]

    marker_boxes = find_markers()

    candidates = [
        (0.2, 0.6, 0.18, 0.82),
        (0.22, 0.62, 0.16, 0.84),
        (0.24, 0.58, 0.2, 0.8),
    ]

    best = None

    if marker_boxes:
        xs = [x for x, _, w, _ in marker_boxes] + [x + w for x, _, w, _ in marker_boxes]
        ys = [y for _, y, _, h in marker_boxes] + [y + h for _, y, _, h in marker_boxes]
        left = min(xs)
        right = max(xs)
        top = min(ys)
        bottom = max(ys)
        sizes = [min(w, h) for _, _, w, h in marker_boxes]
        marker_size = int(np.median(sizes)) if sizes else 12
        pad = max(8, int(marker_size * 1.2))

        candidates.insert(
            0,
            (
                max(0.0, (top + pad) / float(height)),
                min(1.0, (bottom - pad) / float(height)),
                max(0.0, (left + pad) / float(width)),
                min(1.0, (right - pad) / float(width)),
            ),
        )

    def bubble_strength(cx, cy, radius):
        inner_r = max(3, int(radius * 0.55))
        outer_r = max(inner_r + 2, int(radius * 0.95))

        mask_inner = np.zeros(gray.shape, dtype="uint8")
        cv2.circle(mask_inner, (cx, cy), inner_r, 255, -1)
        mask_outer = np.zeros(gray.shape, dtype="uint8")
        cv2.circle(mask_outer, (cx, cy), outer_r, 255, -1)
        ring_mask = cv2.subtract(mask_outer, mask_inner)

        inner_vals = gray[mask_inner == 255]
        ring_vals = gray[ring_mask == 255]
        if inner_vals.size == 0 or ring_vals.size == 0:
            return 0.0

        inner_mean = float(np.mean(inner_vals))
        ring_mean = float(np.mean(ring_vals))
        contrast = max(0.0, ring_mean - inner_mean) / 255.0

        fill_vals = binary_inv[mask_inner == 255]
        fill_ratio = float(np.mean(fill_vals == 255)) if fill_vals.size else 0.0

        return (contrast * 0.7) + (fill_ratio * 0.3)

    for top_r, bottom_r, left_r, right_r in candidates:
        grid_top = int(height * top_r)
        grid_bottom = int(height * bottom_r)
        grid_left = int(width * left_r)
        grid_right = int(width * right_r)

        grid_h = grid_bottom - grid_top
        grid_w = grid_right - grid_left
        if grid_h <= 0 or grid_w <= 0:
            continue

        row_step = grid_h / 11.0
        if row_step <= 0:
            continue

        number_ratio = 0.092
        gap_ratio = 0.018
        number_w = grid_w * number_ratio
        gap_w = grid_w * gap_ratio
        col_w = (grid_w - number_w - (gap_w * 4)) / 4.0
        if col_w <= 0:
            col_w = grid_w / 5.0
            number_w = col_w
            gap_w = 0

        radius = max(6, int(min(row_step, col_w) * 0.32))
        marked = []
        debug = cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)
        noise_rows = 0

        for row in range(10):
            cy = int(grid_top + row_step * (row + 1.5))
            row_marks = []
            strengths = []
            for col in range(4):
                cx = int(grid_left + number_w + gap_w + (col_w * 0.5) + col * (col_w + gap_w))
                strengths.append(bubble_strength(cx, cy, radius))

            max_strength = max(strengths) if strengths else 0
            if max_strength >= 0.12:
                threshold = max(0.12, max_strength * 0.6)
                row_marks = [labels[i] for i, s in enumerate(strengths) if s >= threshold]

            if len(row_marks) > 3:
                ranked = sorted(range(4), key=lambda i: strengths[i], reverse=True)[:3]
                row_marks = [labels[i] for i in ranked if strengths[i] >= 0.12]
                noise_rows += 1

            for col in range(4):
                cx = int(grid_left + number_w + gap_w + (col_w * 0.5) + col * (col_w + gap_w))
                color = (0, 255, 0) if labels[col] in row_marks else (0, 0, 255)
                cv2.circle(debug, (cx, cy), radius, color, 2)

            marked.append(row_marks)

        cv2.rectangle(debug, (grid_left, grid_top), (grid_right, grid_bottom), (255, 0, 0), 2)
        filled_rows = sum(1 for row in marked if row)
        score = filled_rows - noise_rows

        if best is None or score > best["score"]:
            best = {"score": score, "marked": marked, "debug": debug}

    if best is None:
        return [[] for _ in range(10)], cv2.cvtColor(gray, cv2.COLOR_GRAY2BGR)

    return best["marked"], best["debug"]


@ocr_bp.post("/upload")
@jwt_required()
def upload_scan():
    if not _require_professor():
        return jsonify({"error": "professor role required"}), 403

    file = request.files.get("file")
    if not file:
        return jsonify({"error": "file is required"}), 400

    filename = secure_filename(file.filename)
    if not filename:
        return jsonify({"error": "invalid filename"}), 400

    ext = os.path.splitext(filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png"}:
        return jsonify({"error": "only .jpg/.jpeg/.png supported"}), 400

    _ensure_upload_dir()
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    stored_name = f"{timestamp}_{filename}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    file.save(stored_path)

    try:
        import cv2
    except Exception:
        return jsonify(
            {
                "status": "uploaded",
                "processed": False,
                "detail": "opencv-python not installed",
                "file": stored_name,
            }
        ), 501

    image = cv2.imread(stored_path)
    if image is None:
        return jsonify({"error": "could not read image"}), 400

    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    _, thresh = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    processed_name = f"processed_{stored_name}"
    processed_path = os.path.join(UPLOAD_DIR, processed_name)
    cv2.imwrite(processed_path, thresh)

    return jsonify(
        {
            "status": "processed",
            "processed": True,
            "file": stored_name,
            "processed_file": processed_name,
        }
    )


@ocr_bp.post("/grade")
@jwt_required()
def grade_scan():
    if not _require_professor():
        return jsonify({"error": "professor role required"}), 403

    file = request.files.get("file")
    quiz_id = request.form.get("quiz_id")
    student_name = request.form.get("student_name")
    student_email = request.form.get("student_email")

    if not file:
        return jsonify({"error": "file is required"}), 400
    if not quiz_id or not str(quiz_id).isdigit():
        return jsonify({"error": "quiz_id is required"}), 400
    if not student_name:
        return jsonify({"error": "student_name is required"}), 400

    filename = secure_filename(file.filename)
    if not filename:
        return jsonify({"error": "invalid filename"}), 400

    ext = os.path.splitext(filename)[1].lower()
    if ext not in {".jpg", ".jpeg", ".png"}:
        return jsonify({"error": "only .jpg/.jpeg/.png supported"}), 400

    _ensure_upload_dir()
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
    stored_name = f"{timestamp}_{filename}"
    stored_path = os.path.join(UPLOAD_DIR, stored_name)
    file.save(stored_path)

    try:
        import cv2
    except Exception:
        return jsonify({"error": "opencv-python not installed"}), 501

    image = cv2.imread(stored_path)
    if image is None:
        return jsonify({"error": "could not read image"}), 400

    quiz = (
        Quiz.query.options(joinedload(Quiz.questions).joinedload(Question.choices))
        .filter_by(id=int(quiz_id))
        .first()
    )
    if not quiz:
        return jsonify({"error": "quiz not found"}), 404

    questions = sorted(quiz.questions, key=lambda q: q.order)
    if len(questions) != 10:
        return jsonify({"error": "quiz must have exactly 10 questions"}), 400
    for q in questions:
        if len(q.choices) != 4:
            return jsonify({"error": "each question must have exactly 4 choices"}), 400

    warped = _warp_to_a4(image)
    used_fallback = False
    if warped is None:
        # Fallback for clean PDF screenshots where page contour is missing.
        warped = cv2.resize(image, (1700, 2200))
        used_fallback = True

    marked, debug = _detect_marks(warped)
    debug_name = f"debug_{stored_name}"
    debug_path = os.path.join(UPLOAD_DIR, debug_name)
    cv2.imwrite(debug_path, debug)

    student = _get_or_create_student(student_name.strip(), student_email)

    submission = Submission(quiz_id=quiz.id, student_id=student.id, score=0)
    db.session.add(submission)
    db.session.flush()

    score = 0
    answers = []

    for idx, question in enumerate(questions):
        selected = marked[idx]
        if len(selected) > 3:
            return jsonify({"error": "too many selections"}), 400

        correct = [c.label for c in question.choices if c.is_correct]
        selected_set = set(selected)
        correct_set = set(correct)

        points_awarded = question.points if selected_set == correct_set else 0
        score += points_awarded

        selected_label = ",".join(selected)

        db.session.add(
            SubmissionAnswer(
                submission_id=submission.id,
                question_id=question.id,
                selected_label=selected_label,
                points_awarded=points_awarded,
            )
        )

        answers.append(
            {
                "question_id": question.id,
                "selected_label": selected_label,
                "points_awarded": points_awarded,
            }
        )

    submission.score = score
    db.session.commit()

    return jsonify(
        {
            "status": "graded",
            "file": stored_name,
            "debug_file": debug_name,
            "debug_url": f"/api/ocr/debug/{debug_name}",
            "used_fallback": used_fallback,
            "submission_id": submission.id,
            "score": score,
            "answers": answers,
            "marked": marked,
        }
    )
