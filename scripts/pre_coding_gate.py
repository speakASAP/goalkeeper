#!/usr/bin/env python3
"""Lightweight pre-coding gate for GoalKeeper goal execution."""

from __future__ import annotations

import argparse
from pathlib import Path


CRITICAL_MARKERS = ("[MISSING:", "[UNKNOWN:")
REQUIRED_PROCESS_FILES = [
    "docs/IPS_INTEGRATION.md",
    "docs/governance/PROJECT_INVARIANTS.md",
    "docs/process/DOCUMENTATION_COMPLETENESS_STANDARD.md",
    "docs/process/OPERATIONAL_GATES.md",
    "docs/process/AGENT_GAP_FILLING_RULES.md",
]


def read(path: Path) -> str:
    return path.read_text(encoding="utf-8") if path.exists() else ""


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    parser.add_argument("--goal", help="Goal prompt or execution plan to check")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    issues: list[str] = []

    for rel in REQUIRED_PROCESS_FILES:
        if not (root / rel).exists():
            issues.append(f"missing process file: {rel}")

    target = Path(args.goal) if args.goal else root / "docs/IMPLEMENTATION_STATE.md"
    if not target.is_absolute():
        target = root / target
    if not target.exists():
        issues.append(f"missing target artifact: {target.relative_to(root)}")
    else:
        text = read(target)
        for heading in ("Acceptance Criteria", "Validation", "Forbidden", "Allowed"):
            if heading not in text:
                issues.append(f"target artifact may lack section containing: {heading}")
        if any(marker in text for marker in CRITICAL_MARKERS):
            issues.append(f"target artifact contains unresolved markers: {target.relative_to(root)}")

    print("# GoalKeeper Pre-Coding Gate")
    print()
    if issues:
        print("Status: failed")
        print()
        for issue in issues:
            print(f"- {issue}")
        print()
        print("Next action: fix the artifact, split the goal, or record a human-approved exception.")
        return 1

    print("Status: passed")
    print("Next action: proceed only within the approved goal or execution-plan scope.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
