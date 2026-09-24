#!/usr/bin/env python3
"""
pack_dashboards.py — runs `zet pack` in every Adroit dashboard folder, so you
don't have to cd into each one by hand after a change.

Each dashboard is a folder containing its own plugin-manifest.json (the zet
project root — where `zet pack` has to be run from). Dashboards are found
automatically by searching for plugin-manifest.json under this script's
folder; known non-dashboard matches (old/legacy zet projects left on disk)
are excluded explicitly below.

Usage:
    python pack_dashboards.py                 Pack every dashboard
    python pack_dashboards.py --changed        Only pack dashboards with uncommitted git changes
    python pack_dashboards.py --only storeToday salesKPIDashboard
                                                Only pack the named folder(s)
    python pack_dashboards.py --list           List discovered dashboards and exit (no packing)
"""

import argparse
import subprocess
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent

# Folders that contain a plugin-manifest.json but are NOT one of the live
# dashboards (e.g. a leftover legacy project) — excluded by relative path
# (forward slashes, matching Path.as_posix()).
EXCLUDE = {
    "service/servicePerformanceSummary/service_z",
}


def discover_dashboards():
    found = []
    for manifest in sorted(REPO_ROOT.glob("**/plugin-manifest.json")):
        folder = manifest.parent
        rel = folder.relative_to(REPO_ROOT).as_posix()
        if rel in EXCLUDE or "node_modules" in folder.parts:
            continue
        found.append(folder)
    return found


def changed_dashboards(all_dashboards):
    """Uses `git status --porcelain` to find dashboards with uncommitted changes
    (staged, unstaged, or untracked) anywhere under their folder."""
    result = subprocess.run("git status --porcelain", cwd=REPO_ROOT, shell=True,
                             capture_output=True, text=True)
    if result.returncode != 0:
        print("!! `git status` failed:", result.stderr.strip())
        return []

    changed_paths = set()
    for line in result.stdout.splitlines():
        if not line.strip():
            continue
        # porcelain format: "XY <path>", or "XY <old> -> <new>" for renames.
        path = line[3:].split(" -> ")[-1].strip().strip('"')
        changed_paths.add((REPO_ROOT / path).resolve())

    changed = []
    for folder in all_dashboards:
        resolved = folder.resolve()
        if any(p == resolved or p.is_relative_to(resolved) for p in changed_paths):
            changed.append(folder)
    return changed


def pack_one(folder):
    label = folder.relative_to(REPO_ROOT)
    print(f"\n=== {label} ===")
    result = subprocess.run("zet pack", cwd=folder, shell=True,
                             capture_output=True, text=True)
    output = (result.stdout or "") + (result.stderr or "")
    if output.strip():
        print(output.strip())
    ok = result.returncode == 0
    print("OK" if ok else f"FAILED (exit code {result.returncode})")
    return ok


def main():
    parser = argparse.ArgumentParser(description="Run `zet pack` across every Adroit dashboard folder.")
    parser.add_argument("--changed", action="store_true",
                         help="Only pack dashboards that have uncommitted git changes")
    parser.add_argument("--only", nargs="+", metavar="FOLDER_NAME",
                         help="Only pack dashboards whose folder name matches exactly (e.g. storeToday)")
    parser.add_argument("--list", action="store_true",
                         help="List discovered dashboards and exit, without packing")
    args = parser.parse_args()

    dashboards = discover_dashboards()
    if not dashboards:
        print(f"No dashboards found (no plugin-manifest.json under {REPO_ROOT})")
        sys.exit(1)

    if args.only:
        wanted = set(args.only)
        matched = [d for d in dashboards if d.name in wanted]
        missing = wanted - {d.name for d in matched}
        if missing:
            print("!! Unknown dashboard folder name(s):", ", ".join(sorted(missing)))
        dashboards = matched

    if args.changed:
        dashboards = changed_dashboards(dashboards)

    if args.list:
        for d in dashboards:
            print(d.relative_to(REPO_ROOT))
        return

    if not dashboards:
        print("Nothing to pack.")
        return

    print(f"Packing {len(dashboards)} dashboard(s)...")
    results = {folder: pack_one(folder) for folder in dashboards}

    print("\n" + "=" * 50)
    print("SUMMARY")
    for folder, ok in results.items():
        print(f"  [{'OK' if ok else 'FAILED'}] {folder.relative_to(REPO_ROOT)}")

    if not all(results.values()):
        sys.exit(1)


if __name__ == "__main__":
    main()
