#!/usr/bin/env python3
"""Lightweight deployment/closure readiness gate for GoalKeeper."""

from __future__ import annotations

import argparse
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    issues: list[str] = []

    state = root / "docs/IMPLEMENTATION_STATE.md"
    invariants = root / "docs/governance/PROJECT_INVARIANTS.md"
    reports = root / "reports/validation"

    if not state.exists():
        issues.append("missing docs/IMPLEMENTATION_STATE.md")
    else:
        text = state.read_text(encoding="utf-8")
        if "Validation Evidence Log" not in text:
            issues.append("implementation state lacks validation evidence log")
        if "Required Session Report" not in text:
            issues.append("implementation state lacks required session report")

    if not invariants.exists():
        issues.append("missing docs/governance/PROJECT_INVARIANTS.md")

    if not reports.exists():
        issues.append("missing reports/validation directory for gate evidence")

    print("# GoalKeeper Deployment Readiness Gate")
    print()
    if issues:
        print("Status: failed")
        print()
        for issue in issues:
            print(f"- {issue}")
        print()
        print("Next action: collect validation evidence and resolve process gaps before deployment or closure.")
        return 1

    print("Status: passed")
    print("Next action: deployment still requires explicit owner approval.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
