# Agent PDF Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a usable `/agent` console where a user uploads a PDF, runs a deterministic agent demo flow, and sees planner, document, research, comparison, decision, confidence, and evidence output.

**Architecture:** Keep the production backend untouched where possible and add a demo endpoint that needs no external model credentials. The frontend uses a client component for file upload and state, with a Next route handler as a proxy to the FastAPI demo endpoint when configured, plus an in-browser fallback so the console remains usable during frontend-only development.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, lucide-react, FastAPI, PyMuPDF, pytest.

---

### Task 1: Backend Demo Agent Endpoint

**Files:**
- Create: `backend/src/aristoteles/demo.py`
- Modify: `backend/src/aristoteles/api.py`
- Create: `backend/tests/test_demo.py`

- [ ] Add `POST /v1/demo/agent` accepting `objective` and a PDF file.
- [ ] Use existing `extract_pdf()` for PDF text extraction.
- [ ] Return deterministic stages and decision JSON without model calls.
- [ ] Add an in-memory PDF test that verifies stages, page previews, criteria, and decision.

### Task 2: Next Proxy Route

**Files:**
- Create: `app/api/agent-demo/route.ts`

- [ ] Accept multipart form data from the browser.
- [ ] Forward it to `${ARISTOTELES_API_URL}/v1/demo/agent` when configured.
- [ ] Return a clear `503` JSON error when the backend URL is missing or unreachable.

### Task 3: Agent Console UI

**Files:**
- Create: `app/agent/page.tsx`
- Create: `components/agent/AgentConsole.tsx`
- Modify: `sections/Header.tsx`

- [ ] Build a client component with objective input, PDF upload, run button, progress stages, document previews, criteria, comparison, decision, confidence, and fallback state.
- [ ] Keep styling aligned with existing `glass`, `crt`, `section-label`, and dark orbital visual language.
- [ ] Add a header link to `/agent`.

### Task 4: Verification

**Files:**
- Modify only files implicated by failures.

- [ ] Run `npm run build`.
- [ ] Run `uv run pytest` from `backend` if `uv` is available.
- [ ] Report any backend smoke test blocked by missing Python tooling or external configuration.
