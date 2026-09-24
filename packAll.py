#!/usr/bin/env python3
"""
Walks a root directory tree, finds every folder that looks like a ZET
project (i.e. it has an 'app' subfolder alongside it, like your
productionOverview / storeMonthly / storeToday folders), and runs
`zet pack` inside each one.

Usage:
    python zet_pack_all.py [ROOT_DIR] [--dry-run]

If ROOT_DIR is omitted, it defaults to the current directory.
"""

import argparse
import subprocess
import sys
from pathlib import Path

# Folders we never want to descend into (huge / irrelevant)
SKIP_DIRS = {"node_modules", "dist", ".git", "__pycache__"}

MARKER_DIR = "app"  # presence of this child dir = "this is a ZET project folder"


def find_project_dirs(root: Path):
    """
    Recursively search for directories that directly contain an 'app'
    subfolder. Stops descending into SKIP_DIRS to avoid wasting time.
    """
    project_dirs = []

    def _walk(current: Path):
        try:
            children = [c for c in current.iterdir() if c.is_dir()]
        except PermissionError:
            return

        child_names = {c.name for c in children}

        if MARKER_DIR in child_names:
            project_dirs.append(current)
            # NOTE: we still don't need to go *inside* this project's own
            # subfolders (app/dist/node_modules/server etc.), so skip them.
            return

        for child in children:
            if child.name in SKIP_DIRS:
                continue
            _walk(child)

    _walk(root)
    return project_dirs


def run_zet_pack(project_dir: Path, dry_run: bool = False):
    print(f"\n=== {project_dir} ===")
    if dry_run:
        print("  (dry-run) would run: zet pack")
        return True

    try:
        # On Windows, 'zet' is typically a .cmd/.ps1 shim from a global npm
        # install. subprocess needs shell=True (or a resolved .cmd path) to
        # find those, since Windows only applies PATHEXT resolution through
        # the shell.
        use_shell = sys.platform == "win32"
        cmd = "zet pack" if use_shell else ["zet", "pack"]

        result = subprocess.run(
            cmd,
            cwd=project_dir,
            capture_output=True,
            text=True,
            shell=use_shell,
        )
        if result.stdout:
            print(result.stdout.strip())
        if result.stderr:
            print(result.stderr.strip(), file=sys.stderr)

        if result.returncode != 0:
            print(f"  ❌ FAILED (exit code {result.returncode})")
            return False
        else:
            print("  ✅ success")
            return True
    except FileNotFoundError:
        print("  ❌ 'zet' command not found. Is it installed and on your PATH?")
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Run 'zet pack' in every ZET dashboard project folder."
    )
    parser.add_argument(
        "root",
        nargs="?",
        default=".",
        help="Root directory to scan (default: current dir)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="List what would run, without executing zet pack",
    )
    args = parser.parse_args()

    root = Path(args.root).resolve()
    if not root.is_dir():
        print(f"Error: {root} is not a directory")
        sys.exit(1)

    print(
        f"Scanning {root} for ZET project folders (folders containing an '{MARKER_DIR}' subfolder)..."
    )
    project_dirs = find_project_dirs(root)

    if not project_dirs:
        print("No project folders found.")
        return

    print(f"\nFound {len(project_dirs)} project folder(s):")
    for p in project_dirs:
        print(f"  - {p}")

    failures = []
    for p in project_dirs:
        ok = run_zet_pack(p, dry_run=args.dry_run)
        if not ok:
            failures.append(p)

    print("\n=== Summary ===")
    print(f"Total: {len(project_dirs)}, Failed: {len(failures)}")
    if failures:
        print("Failed folders:")
        for f in failures:
            print(f"  - {f}")
        sys.exit(1)


if __name__ == "__main__":
    main()
