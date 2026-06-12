#!/usr/bin/env python3
"""Lightweight GoalKeeper documentation audit."""

from __future__ import annotations

import argparse
from pathlib import Path


REQUIRED_FILES = [
    "AGENTS.md",
    "README.md",
    "docs/IMPLEMENTATION_STATE.md",
    "docs/IMPLEMENTATION_ORCHESTRATOR.md",
    "docs/IPS_INTEGRATION.md",
    "docs/governance/PROJECT_INVARIANTS.md",
    "docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md",
    "docs/process/OPERATIONAL_GATES.md",
    "docs/process/AGENT_GAP_FILLING_RULES.md",
    "implementation-goals/README.md",
    "implementation-goals/templates/EXECUTION_PLAN.md",
    "implementation-goals/templates/CONTEXT_PACKAGE.md",
    "implementation-goals/templates/CODING_PROMPT.md",
    "implementation-goals/templates/VALIDATION_REPORT.md",
]

TEXT_SUFFIXES = {".md", ".py", ".sh", ".txt", ".json", ".yml", ".yaml"}
SKIP_DIRS = {".git", "node_modules", "__pycache__"}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--format", choices=["text", "markdown"], default="text")
    parser.add_argument("--fail-on-issues", action="store_true")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    issues: list[str] = []

    for rel in REQUIRED_FILES:
        path = root / rel
        if not path.exists():
            issues.append(f"missing required file: {rel}")
        elif path.stat().st_size == 0:
            issues.append(f"empty required file: {rel}")

    state = root / "docs/IMPLEMENTATION_STATE.md"
    if state.exists():
        text = state.read_text(encoding="utf-8")
        if "## Next Action" not in text:
            issues.append("docs/IMPLEMENTATION_STATE.md lacks ## Next Action")
        if "## Validation Evidence Log" not in text:
            issues.append("docs/IMPLEMENTATION_STATE.md lacks ## Validation Evidence Log")

    for path in root.rglob("*"):
        if any(part in SKIP_DIRS for part in path.relative_to(root).parts):
            continue
        if not path.is_file() or path.suffix not in TEXT_SUFFIXES:
            continue
        rel = path.relative_to(root)
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            issues.append(f"text file is not valid UTF-8: {rel}")
            continue
        for line_no, line in enumerate(text.splitlines(), start=1):
            if any(ord(ch) > 127 for ch in line):
                issues.append(f"non-English/non-ASCII text found: {rel}:{line_no}")
                break

    if args.format == "markdown":
        print("# GoalKeeper Strict Documentation Audit")
        print()
        if issues:
            print("## Issues")
            for issue in issues:
                print(f"- {issue}")
        else:
            print("No documentation audit issues found.")
    else:
        if issues:
            print("Documentation audit issues:")
            for issue in issues:
                print(f"- {issue}")
        else:
            print("No documentation audit issues found.")

    return 1 if issues and args.fail_on_issues else 0


if __name__ == "__main__":
    raise SystemExit(main())
