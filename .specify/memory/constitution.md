<!--
Sync Impact Report
- Version change: none → 0.1.0
- Modified principles: added 'Stability of Public Artifacts' (new principle IV)
- Added sections: Badge & Public Artifact Policy (Additional Constraints)
- Removed sections: none
- Templates requiring updates: 
  - .specify/templates/plan-template.md ✅ updated (Badge & Public Artifact Policy text added)
  - .specify/templates/tasks-template.md ✅ updated (task to replace unstable badges added)
  - .specify/templates/spec-template.md ⚠ pending review
  - .specify/templates/checklist-template.md ⚠ pending review
  - .specify/templates/agent-file-template.md ⚠ pending review
- Follow-up TODOs: RATIFICATION_DATE (TODO)
-->

# Anselmoo Constitution

## Core Principles

### I. Library-First
Every feature or tool we deliver MUST be designed as a reusable library or module where practical. Libraries MUST be self-contained, independently testable, and documented. This prevents monolithic code and preserves reusability across projects.

### II. Test-First (NON-NEGOTIABLE)
Tests MUST be specified before implementation (TDD). Tests MUST fail before new code is added, then pass after implementation. All tests MUST be automated, deterministic, and included in CI pipelines.

### III. Observability & Auditing
All services and libraries MUST include structured logging and observable metrics. Critical flows MUST emit events that enable root-cause analysis and auditability. Logs and metrics retention policies MUST be specified for production systems.

### IV. Stability of Public Artifacts (NEW)
Documentation and public-facing artifacts (README badges, hosted images, cards) MUST not rely on a single ephemeral third-party host. For any dynamic badge or image: teams MUST choose one of the following mitigations:  
- Use Shields.io or an equivalent resilient service, OR  
- Self-host the badge (via a GitHub Action that regenerates and commits a static image), OR  
- Commit a static fallback image in the repo and document update procedure.  
Plans and PRs that introduce or change badges MUST document the chosen mitigation and include an automated test or CI check verifying the badge URL is reachable.

### V. Versioning, Simplicity & Security
Follow semantic versioning (MAJOR.MINOR.PATCH). Simplicity is a primary design constraint (prefer simple, auditable solutions). Security MUST be considered in design decisions and reviewed before release.

## Additional Constraints (Badge & Public Artifact Policy)
- Badges and public assets MUST have explicit fallback or automated generation mechanisms.  
- Dynamic badges that query external APIs MUST have documented rate limits and failure modes in the feature plan.  
- README or docs MUST include a short note when a moved or replaced badge is due to external service instability.

## Development Workflow & Quality Gates
- Plans MUST include a "Constitution Check" section that verifies compliance with the Stability of Public Artifacts principle.  
- Reviews MUST validate badge fallbacks or automated regeneration steps before merging.  
- CI jobs SHOULD include a lightweight check that fetches each external image used in documentation and fails if core artifacts are unreachable for an extended period.

## Governance
- Amendments: Changes to this constitution MUST be proposed in a documented PR, include a migration plan for affected templates/docs, and be ratified by at least two project maintainers.  
- Versioning: This file follows semantic versioning and increments according to the scale of changes (MAJOR for incompatible governance changes, MINOR for new principles, PATCH for wording/typo fixes).  
- Compliance: Feature plans and PRs MUST reference this constitution in their "Constitution Check" section and document any deviations.

**Version**: 0.1.0 | **Ratified**: TODO(RATIFICATION_DATE): please provide adoption date | **Last Amended**: 2025-12-27
