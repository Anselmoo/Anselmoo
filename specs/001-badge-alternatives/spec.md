# Feature Specification: Badge Alternatives & Resilient Badge Policy

**Feature Branch**: `001-badge-alternatives`  
**Created**: 2025-12-27  
**Status**: Draft  
**Input**: User description: "Replace failing `github-readme-stats` badges with resilient alternatives and add policy and automation for badge reliability (Shields.io, self-hosting, static fallback via GitHub Actions)."
## User Scenarios & Testing *(mandatory)*

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.
  
  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - Replace broken badges with resilient alternatives (Priority: P1)

As a repository maintainer, I want all README badges to be resilient (use Shields.io, Badgen, self-hosted generators, or committed static fallback images) so that public documentation does not break when a single third-party host becomes unavailable.

**Why this priority**: Keeps public documentation professional and robust; reduces user confusion and maintenance burden caused by broken images.

**Independent Test**: Review `README.md` and documentation pages and verify (1) every badge originates from an approved source or has a documented fallback and (2) CI check that fetches each badge URL returns HTTP 200 within 5s.

**Acceptance Scenarios**:

1. **Given** a README with previous `github-readme-stats` badges, **When** this feature is applied, **Then** badges are replaced with Shields.io (or equivalent) badges or static fallback images and the README renders correctly in GitHub preview.
2. **Given** a PR that adds/changes badges, **When** the PR runs CI, **Then** a badge-verification job verifies each badge URL or fallback and passes or reports a clear failure/warning depending on policy.

---

### User Story 2 - Automated static fallback generation (Priority: P2)

As a maintainer, I want a GitHub Action that can (optionally) fetch badge SVGs and commit them as static assets on a scheduled basis or on-demand, so documentation remains intact even if the external provider goes down.

**Why this priority**: Automated fallback minimizes manual maintenance and removes single-point-of-failure risk for public docs.

**Independent Test**: Run the Action manually and observe that updated static assets are committed to the repo (or a dedicated branch) and that the README references the committed assets.

**Acceptance Scenarios**:

1. **Given** a scheduled run or a manual trigger, **When** the Action runs, **Then** it fetches current badge SVGs, stores them under `assets/badges/`, and opens a PR or commits directly (depending on configuration).

---

### User Story 3 - Self-hosting & migration guide (Priority: P3)

As an operator, I want documentation and a small guide for self-hosting badge generators (e.g., `github-readme-stats` self-host or `badgen/badgen.net`) so teams can choose a full-control option when needed.

**Why this priority**: Some organizations prefer not to rely on public services for instrumentation or branding.

**Independent Test**: Follow the guide to deploy a self-hosted badge generator to a test environment and validate that the same badges produce equivalent SVGs when queried.

**Acceptance Scenarios**:

1. **Given** the self-hosting guide, **When** a maintainer follows it, **Then** they can deploy a local badge service and update README links to point to the new host.

---

### Edge Cases

- Private repositories with badges that require authentication (skip or mark as AUTH_REQUIRED)
- Rate-limited or geo-restricted badge sources (Action must handle 429s and backoff)
- Markdown renderers that block remote images or strip SVGs (provide PNG fallbacks if necessary)

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The README and public docs MUST not include badges that rely solely on an unapproved single third-party host without a documented mitigation strategy (Shields.io, self-host, or static fallback committed to the repo).
- **FR-002**: For every dynamic badge included in repo documentation, a mitigation MUST be recorded in a `BADGE_MANIFEST.md` file (fields: `location`, `badge_url`, `recommended_mitigation`, `owner`, `notes`).
- **FR-003**: CI MUST include a lightweight `badge-verification` job that fetches each external badge URL (from `BADGE_MANIFEST.md`) and reports status: `OK` (200 within 5s), `WARN` (non-200 or slow), or `AUTH_REQUIRED`.
- **FR-004**: Provide an optional GitHub Action (`badge-regenerator`) that can (a) fetch badges and commit them to `assets/badges/` on a schedule or (b) open a PR with updated assets when changes are detected.
- **FR-005**: Update project templates (`plan-template.md`, `tasks-template.md`, spec-template.md) to include a Constitution Check entry and a task to validate badge mitigations for any feature that adds or modifies public badges.
- **FR-006**: Provide a migration guide to convert existing `github-readme-stats` usages to approved mitigations, including example code snippets and sample GitHub Action workflows.

*Clarifications (NEEDS CLARIFICATION)*

- **FR-007 (Decision)**: The `badge-verification` job will be **advisory** (non-blocking); it will post a PR comment and report statuses but will not block merges by default.
- **FR-008 (Decision)**: The `badge-regenerator` will **open a PR** with updated assets for maintainers to review and merge (safer default).
- **FR-009 (Decision)**: Badge regeneration cadence will be **weekly** by default; manual `workflow_dispatch` triggers are supported for on-demand runs.

### Key Entities *(include if feature involves data)*

- **BadgeManifest**: A small, versioned YAML/MD document that lists every badge used by the repo with attributes: `location` (file path), `badge_url`, `mitigation` (`shields|badgen|static|self-host`), `owner`, `last_checked`.
- **BadgeAsset**: Static asset file (SVG/PNG) committed under `assets/badges/` optionally referenced by `location` when mitigation=`static`.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of repository README badges have an approved mitigation recorded in `specs/001-badge-alternatives/BADGE_MANIFEST.md` or equivalent within one week of merge.
- **SC-002**: `badge-verification` CI job reports `OK` for at least 95% of badges over a 30-day rolling window (measured after the feature is live).
- **SC-003**: In the event of an external badge provider outage, at least 90% of previously generated static badge assets remain available via the repo or cached fallback until the outage is resolved.
- **SC-004**: All new PRs that add or change badges include a `mitigation` entry and pass the plan's Constitution Check in >90% of cases after rollout.
