"""Validate handoff kit structure and demo fixtures; no external dependencies."""
from pathlib import Path
import json
import sys

ROOT = Path(__file__).resolve().parent.parent
NEEDED = [
    "README.md", "AGENTS.md", "prototype/index.html",
    "docs/00_PROJECT_CONTEXT.md", "docs/01_REQUIREMENTS.md",
    "docs/02_ARCHITECTURE.md", "docs/03_UI_SPEC.md",
    "docs/04_SECURITY.md", "docs/05_DATA_AND_API.md",
    "docs/06_INTEGRATIONS.md", "docs/07_ROADMAP.md",
    "docs/08_COLLABORATION.md", "docs/09_COST_AND_DEPLOY.md",
    "docs/10_TEST_PLAN.md", "docs/11_EVIDENCE_AND_UNKNOWN.md",
    "docs/TASK_BOARD.md", "docs/WORK_LOG.md", "docs/HANDOFF.md",
    "prompts/ANTIGRAVITY_INITIAL.md", "prompts/CODEX_INITIAL.md",
    ".agents/skills/visual-qa/SKILL.md",
    ".agents/skills/safe-integration/SKILL.md", "references/monitor_crop.jpg",
    "fixtures/demo-events.json", "fixtures/demo-briefing.json",
]
missing = [p for p in NEEDED if not (ROOT / p).exists()]
if missing:
    print("MISSING:", *missing, sep="\n")
    sys.exit(1)
for name in ["fixtures/demo-events.json", "fixtures/demo-briefing.json"]:
    obj = json.loads((ROOT / name).read_text(encoding="utf-8"))
    if name.endswith("demo-events.json"):
        assert all(e["mode"] == "DEMO" for e in obj)
    else:
        assert obj["data_mode"] == "DEMO"
print(f"PASS: {len(NEEDED)} required files and safe demo fixtures are present")
