# Instructor Guide

This guide covers everything an instructor needs to manage courses, projects, milestones, and student submissions in Nibras.

---

## Prerequisites

- A GitHub account with **Owner** access on the GitHub organisation your institution uses
- The Nibras GitHub App installed on that organisation
- An instructor or admin account on the Nibras instance (ask your system admin)

---

## 1. Logging In

Open the web dashboard at the URL your admin provides (e.g. `https://nibras.yourschool.edu`). Click **Sign in with GitHub** and authorise the Nibras GitHub App.

---

## 2. Creating a Course

1. In the dashboard sidebar click **Courses → New Course**.
2. Fill in:
   | Field | Example |
   |---|---|
   | Course title | CS 161 — Intro to Algorithms |
   | Course code | CS161 |
   | Term label | Fall 2026 |
   | Slug (URL-friendly ID) | cs161-fall-2026 |
3. Click **Create**. You are automatically added as an instructor.

### Inviting Students

- Go to **Course → Members → Invite Link**.
- Choose a role (`student`, `ta`, or `instructor`), an optional expiry date, and an optional use-limit.
- Share the generated link. Students click it and are enrolled immediately after GitHub authentication.
- You can also add members manually by GitHub login via **Members → Add Member**.

---

## 3. Creating a Project

Inside a course, click **Projects → New Project**.

| Field         | Notes                                       |
| ------------- | ------------------------------------------- |
| Title         | Shown to students on their dashboard        |
| Slug          | Used in repo names (e.g. `cs161-lab1`)      |
| Delivery mode | `individual` (default) or `team`            |
| Description   | Markdown — supports code blocks             |
| Rubric        | Add rubric items for AI/instructor grading  |
| Resources     | Links to starter code, reference docs, etc. |

Projects start in **draft** status. Students cannot see or submit to draft projects. Click **Publish** when ready.

---

## 4. Adding Milestones

Each project can have multiple milestones (e.g. "Design Review", "Final Submission").

1. Open a project → **Milestones → Add Milestone**.
2. Set:
   - **Title** and **Description**
   - **Due date** (deadline enforcement — students cannot submit after this date; instructors/admins can)
   - **Order** (milestones are sorted ascending)
   - **Is final** — mark the last milestone; completion is measured against it

---

## 5. Reviewing Submissions

### Review Queue

**Review Queue** in the sidebar shows all submissions that need attention — either `needs_review` (AI flagged for human review) or `passed` submissions that you want to override.

Filters available:

- By course
- By project
- By status (`queued`, `running`, `passed`, `failed`, `needs_review`)

### Creating a Review

Open a submission → **Add Review**:

- **Status**: `approved`, `changes_requested`, or `graded`
- **Score**: 0–100
- **Feedback**: Markdown — visible to the student
- **Rubric**: Per-criterion score and notes (mirrors the project rubric)

---

## 6. Adding lecture videos

Nibras stores lecture videos on the same **tracking course** you use for projects and grading. Content is embed-only (YouTube, Bilibili, or a direct MP4/embed URL) — there is no file upload in the platform.

1. Open **Course → Lectures** (or `/instructor/courses/<courseId>/content`).
2. Create one or more **sections** (e.g. “Week 1”, “Midterm review”).
3. For each section, **Add video**:
   - **YouTube / Bilibili**: paste the video ID (YouTube id or Bilibili `BV…` id).
   - **MP4 / URL**: paste the full HTTPS URL to the media or embed page.
4. Use **Preview** to confirm playback before students enroll.

Students watch lectures at **`/catalog/<courseId>/videos`**, where `<courseId>` is the tracking course id from the instructor URL (not the legacy student-dashboard catalog ids).

**Legacy student dashboard:** Courses built from static `courseData.js` in the old dashboard are unchanged and do not sync with this feature. Only courses you configure in the main Nibras app use database-backed videos.

---

## 7. Course-Level Dashboard

**Dashboard → Course** shows an overview for your course:

- Total students, submissions, and pass rate
- Per-project progress bars
- At-risk students (submitted but not yet passed)

---

## 8. Archiving a Project

When a project is complete, archive it to hide it from the review queue without deleting data:

- Open the project → **Settings → Archive Project**
- Or via the admin panel if you have admin access

---

## 9. API Access (Advanced)

The full REST API is documented at `/docs` (Swagger UI). All endpoints require a Bearer token or web session cookie.

Example — list your courses via CLI:

```bash
curl -H "Authorization: Bearer <your-token>" \
  https://nibras.yourschool.edu/v1/tracking/courses
```

---

## 10. Getting Help

- Check `/healthz` and `/readyz` for API status
- Metrics at `/metrics` (requires `NIBRAS_METRICS_TOKEN` if set)
- Contact your system administrator for database issues or GitHub App problems
