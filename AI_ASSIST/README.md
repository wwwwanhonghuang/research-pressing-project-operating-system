# Shared AI Assistance

This shared folder is for **common agent guidance and reusable AI patterns** across stages. Stage-specific materials remain in `pipeline/<stage>/AI_ASSIST/` (including the original `Agent_Support/` and `common_prompts/` folders).

- Place general prompt design patterns and tool constraints here, not duplicate copies of every stage task prompt.
- Link prompts to identifiable task definitions and record their purpose, expected inputs, review requirements, and unsafe inputs.
- `AGENTS.md` / `CLAUDE.md` generated inside project instances are concise local entry points. They refer to shared OS rules and never themselves grant approval rights.
- No AI invocation or autonomous agent runtime is implemented here.

Read `../core/policies/HUMAN_ACCOUNTABILITY.md` before enabling AI actions.
