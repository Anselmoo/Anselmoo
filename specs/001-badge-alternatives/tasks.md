---
description: "Task list for Badge Alternatives & Resilient Badge Policy"
---

# Tasks: Badge Alternatives & Resilient Badge Policy

**Feature**: `specs/001-badge-alternatives`  
**Branch**: `001-badge-alternatives`  
**Created**: 2025-12-27

---

## Phase 1: Setup (Shared Infrastructure)

- [ ] T001 [P] Create feature branch and initial spec: `specs/001-badge-alternatives/spec.md` — Owner: @anselm
- [ ] T002 [P] Add `BADGE_MANIFEST.json` for the feature: `specs/001-badge-alternatives/BADGE_MANIFEST.json` — Owner: @anselm
- [ ] T003 [P] Replace failing `github-readme-stats` badges with Shields.io badges in `README.md` — Owner: @anselm
- [ ] T004 [P] Add initial automation scripts: `.github/scripts/badge_check.py`, `.github/scripts/generate_badges.py` — Owner: @anselm

---

## Phase 2: Foundational (Blocking Prerequisites)

- [ ] T005 [P] Add advisory badge verification workflow: `.github/workflows/badge-verification.yml` — Owner: @anselm
- [ ] T006 [P] Add weekly badge-regenerator workflow: `.github/workflows/badge-regenerator.yml` — Owner: @anselm
- [ ] T007 [P] Add `assets/badges/` directory and ensure `.gitignore` allows commits of generated assets if chosen — Owner: @anselm
- [ ] T008 [P] Add `specs/001-badge-alternatives/BADGE_MANIFEST.json` contract to list all repo badges and mitigations — Owner: @anselm

---

## Phase 3: User Story 1 - Replace broken badges (Priority: P1)

**Goal**: Replace runtime-dependent `github-readme-stats` badges with resilient alternatives and document mitigations

- [ ] T009 [US1] Update `README.md` to use Shields.io badges (completed for visible examples) — Owner: @anselm
- [ ] T010 [US1] Add or verify entries for all README badges in `specs/001-badge-alternatives/BADGE_MANIFEST.json` — Owner: @anselm
- [ ] T011 [US1] Document migration and mapping steps: `specs/001-badge-alternatives/migration.md` — Owner: @anselm

---

## Phase 4: User Story 2 - Badge Regenerator (Priority: P2)

**Goal**: Provide automated static fallback generation and PR-based updates

- [ ] T012 [US2] Implement badge-regenerator workflow `.github/workflows/badge-regenerator.yml` (opens PR with `assets/badges/`) — Owner: @anselm
- [ ] T013 [US2] Add tests and CI checks for `generate_badges.py` (tests/unit/test_generate_badges.py) — Owner: @anselm
- [ ] T014 [US2] Add integration test to simulate workflow run (optional, can be run via `act` or test runner) — Owner: @anselm

---

## Phase 5: User Story 3 - Self-hosting & Migration Guide (Priority: P3)

**Goal**: Provide guidance for teams that prefer full control via self-hosted badge generators

- [ ] T015 [US3] Add self-hosting guide: `specs/001-badge-alternatives/self-hosting.md` (badgen, github-readme-stats self-host) — Owner: @anselm
- [ ] T016 [US3] Provide example deployment (docker-compose / helm) and example change to README to point at self-hosted URL — Owner: @anselm

---

## Phase N: Polish & Cross-Cutting Concerns

- [ ] T017 [P] Add Constitution Check entry to templates (already added to `plan-template.md` and `tasks-template.md`) — Owner: @anselm
- [ ] T018 [P] Add unit tests for `badge_check.py` and ensure `badge-verification` reports structured JSON for the PR comment — Owner: @anselm
- [ ] T019 [P] Add a scheduled smoke test and monitor to track badge provider availability over time — Owner: @anselm
- [ ] T020 [P] Commit, push branch `001-badge-alternatives`, open PR and request constitution ratification & review — Owner: @anselm
- [ ] T021 [P] Add PR checklist item and template entry: verify README badges have `BADGE_MANIFEST` entries & Constitution Check passed — Owner: @anselm

---

## Dependencies & Execution Order

- Phase 1 → Phase 2 (foundational workflows and scripts must exist before story work runs in CI)
- Phase 2 → Phase 3 & 4 (stories rely on workflows and manifest)
- Polish phase runs after major stories complete

## Parallel Opportunities

- Template and documentation updates can run in parallel with script development (marked [P])
- Adding manifest entries for multiple README badges is parallelizable (multiple authors can add entries in separate files)

## Implementation Strategy

1. MVP (P1): Ensure README uses Shields.io / documented mitigations and manifest entries exist.
2. Add advisory `badge-verification` job on PRs (non-blocking) so maintainers are informed.
3. Implement weekly `badge-regenerator` that opens a PR with static assets for maintainers to review.
4. Provide self-hosting guide and optional deploy examples for teams that require full control.

---

**Owner**: @anselm  
**Contact**: raise issues in `#dev` or open PR review threads
