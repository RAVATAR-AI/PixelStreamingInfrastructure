---
name: /openspec-plan-proposal
id: openspec-plan-proposal
category: OpenSpec
description: Generate a valid /openspec-proposal prompt from user requirements.
---

## Phase 1: Clarification (in chat, NOT in plan)

Ask 3-5 clarifying questions about:
- Technical approach and implementation details
- Edge cases and error handling
- Integration points and dependencies
- Performance and scalability considerations
- Security and validation requirements

Wait for user answers before proceeding.

## Phase 2: Generate Plan

Run `openspec list` to verify `[change-id]` is unique.

**CRITICAL**: The plan must contain EXACTLY ONE task, nothing else. No headers, no explanations, no summary. The single task must be to execute the `/openspec-proposal` command—no other tasks, no preparatory steps, no follow-up actions.

Plan format (copy exactly):
```
- [ ] Execute: `/openspec-proposal [change-id]. [complete-requirements-description]`
```

The `[complete-requirements-description]` must be self-contained with ALL context, scope, acceptance criteria, and constraints—the `/openspec-proposal` command must work without any prior conversation context.