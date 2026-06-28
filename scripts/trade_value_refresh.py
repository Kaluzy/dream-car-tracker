#!/usr/bin/env python3
"""API-ready trade-in value refresh helper for Dream Car Tracker.

This script intentionally does NOT scrape consumer valuation forms or expose secrets.
If licensed/private API credentials become available, set environment variables and
fill in the provider adapters below. The public GitHub Pages site reads only data.json.

Supported future provider env vars (examples):
- KBB_API_KEY / KBB_API_BASE
- JDPOWER_API_KEY / JDPOWER_API_BASE
- BLACKBOOK_API_KEY / BLACKBOOK_API_BASE

Until credentials exist, the script validates and preserves the manual baseline.
"""
from __future__ import annotations

import json
import os
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data.json"


def load_data() -> dict:
    return json.loads(DATA_PATH.read_text())


def save_data(data: dict) -> None:
    DATA_PATH.write_text(json.dumps(data, indent=2) + "\n")


def provider_status() -> list[dict]:
    providers = [
        ("Kelley Blue Book", "KBB_API_KEY", "KBB_API_BASE"),
        ("J.D. Power / NADA", "JDPOWER_API_KEY", "JDPOWER_API_BASE"),
        ("Black Book", "BLACKBOOK_API_KEY", "BLACKBOOK_API_BASE"),
    ]
    out = []
    for name, key_var, base_var in providers:
        out.append({
            "name": name,
            "configured": bool(os.getenv(key_var) and os.getenv(base_var)),
            "keyVar": key_var,
            "baseVar": base_var,
        })
    return out


def main() -> int:
    data = load_data()
    tracker = data.setdefault("tradeValueTracker", {})
    statuses = provider_status()
    configured = [p["name"] for p in statuses if p["configured"]]

    tracker["lastUpdated"] = date.today().isoformat()
    if configured:
        # Placeholder for licensed API calls. Do not put credentials in public JS.
        tracker["status"] = "api-configured-adapter-needed"
        tracker["apiStatus"] = (
            "Private valuation credentials detected for: "
            + ", ".join(configured)
            + ". Provider adapter implementation is required before live values are written."
        )
    else:
        tracker["status"] = "manual-baseline-api-ready"
        tracker["apiStatus"] = (
            "No private valuation API key configured. Public site does not expose API keys; "
            "licensed valuation APIs should run only in private cron/backend."
        )

    save_data(data)
    print(json.dumps({"ok": True, "configuredProviders": configured, "status": tracker["status"]}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
