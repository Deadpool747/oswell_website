#!/usr/bin/env python3
"""Safely deploy only Oswell static files to Hostinger's public_html/ops path."""

from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path, PurePosixPath

from deploy_hostinger_ops import DeployError, output_files, security_scan


DESTINATION_PREFIX = "ops"
SSH_HOST = "93.127.208.127"
SSH_PORT = "65002"
SSH_USER = "u944630721"
SSH_KEY = Path.home() / ".ssh" / "oswell_hostinger_deploy"
REMOTE_OPS_DIR = "/home/u944630721/domains/oswelltechnologies.com/public_html/ops"


def validated_remote_path(target: str) -> str:
    path = PurePosixPath(target)
    if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] != DESTINATION_PREFIX:
        raise DeployError(f"Unsafe destination path rejected: {target!r}")
    remote_path = PurePosixPath(REMOTE_OPS_DIR) / path.relative_to(DESTINATION_PREFIX)
    if not str(remote_path).startswith(f"{REMOTE_OPS_DIR}/"):
        raise DeployError(f"Unsafe remote destination path rejected: {target!r}")
    return str(remote_path)


def rsync_command(output_dir: Path, *, dry_run: bool) -> list[str]:
    command = [
        "rsync",
        "-az",
        "--omit-dir-times",
        "--no-links",
        "-e",
        f"ssh -i {SSH_KEY} -o BatchMode=yes -o StrictHostKeyChecking=accept-new -p {SSH_PORT}",
    ]
    if dry_run:
        command.append("--dry-run")
    command.extend(
        [
            f"{output_dir}/",
            f"{SSH_USER}@{SSH_HOST}:{REMOTE_OPS_DIR}/",
        ]
    )
    return command


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group(required=True)
    mode.add_argument("--dry-run", action="store_true", help="Check the scoped rsync transfer without server writes.")
    mode.add_argument("--deploy", action="store_true", help="Upload matching files only; never delete remote files.")
    parser.add_argument("--output-dir", type=Path, default=Path("out"), help="Static export directory (default: out).")
    args = parser.parse_args()

    try:
        if not SSH_KEY.is_file():
            raise DeployError(f"SSH deployment key is missing: {SSH_KEY}")

        output_dir = args.output_dir.resolve()
        files = output_files(output_dir)
        security_scan(files)
        remote_paths = [validated_remote_path(target) for _, target in files]
        total_bytes = sum(source.stat().st_size for source, _ in files)

        print(f"Files: {len(files)}")
        print(f"Bytes: {total_bytes}")
        print("Sample destinations:")
        for remote_path in remote_paths[:10]:
            print(f"  {remote_path}")

        result = subprocess.run(rsync_command(output_dir, dry_run=args.dry_run), check=False)
        if result.returncode != 0:
            raise DeployError(f"Scoped rsync {'dry-run' if args.dry_run else 'upload'} failed: exit {result.returncode}")

        if args.dry_run:
            print("Dry-run complete: no remote files were changed.")
        else:
            print(f"Deployment complete: {len(files)} files uploaded under {REMOTE_OPS_DIR}/ only.")
        return 0
    except DeployError as error:
        print(f"DEPLOYMENT_FAILED: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
