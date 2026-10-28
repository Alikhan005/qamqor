"""Package reviewable source, documentation and screenshots without generated files."""

from pathlib import Path
from os import walk
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
destination = root.parent / "qamqor-source.zip"
excluded = {
    ".git", ".tools", "node_modules", ".angular", "dist", "target", "data",
    "out-tsc", "test-results", "playwright-report", "coverage", "__pycache__",
}

with ZipFile(destination, "w", ZIP_DEFLATED) as archive:
    for directory, folders, files in walk(root):
        folders[:] = sorted(folder for folder in folders if folder not in excluded)
        for filename in sorted(files):
            path = Path(directory) / filename
            if path.name.startswith(".env") or path.suffix in {".log", ".db", ".zip"}:
                continue
            archive.write(path, Path(root.name) / path.relative_to(root))

print(f"Created {destination} ({destination.stat().st_size:,} bytes)")
