#!/usr/bin/env python3
"""Build TWRVision IPK for LG WebOS."""
import os, sys, json, struct, tarfile, io, hashlib, time

ROOT = os.path.dirname(os.path.abspath(__file__))
APP_DIR = os.path.join(ROOT, 'app')

# Read version from appinfo.json
with open(os.path.join(APP_DIR, 'appinfo.json')) as f:
    appinfo = json.load(f)

APP_ID  = appinfo['id']
VERSION = appinfo['version']
OUT     = os.path.join(ROOT, f'{APP_ID}_{VERSION}_all.ipk')

print(f'Building {APP_ID} v{VERSION} ...')

# ── helpers ──────────────────────────────────────────────────────────────────

def make_tar_gz(files_map):
    """files_map: {archive_path: bytes}  → returns bytes of .tar.gz"""
    buf = io.BytesIO()
    with tarfile.open(fileobj=buf, mode='w:gz') as tar:
        for arcname, data in files_map.items():
            info = tarfile.TarInfo(name=arcname)
            info.size  = len(data)
            info.mtime = int(time.time())
            info.mode  = 0o755 if arcname.endswith('/') else 0o644
            tar.addfile(info, io.BytesIO(data))
    return buf.getvalue()

def ar_header(name, size):
    """60-byte ar member header."""
    name_field = name.encode().ljust(16)[:16]
    return (name_field +
            b'0           '[:12] +   # mtime
            b'0     '[:6]  +         # uid
            b'0     '[:6]  +         # gid
            b'100644  '[:8] +        # mode
            str(size).encode().ljust(10)[:10] +
            b'`\n')

def build_ar(members):
    """members: list of (filename, bytes)  → bytes of ar archive"""
    out = b'!<arch>\n'
    for name, data in members:
        out += ar_header(name, len(data))
        out += data
        if len(data) % 2 == 1:
            out += b'\n'   # padding
    return out

# ── control.tar.gz ───────────────────────────────────────────────────────────

installed_size = 0
for dirpath, _, filenames in os.walk(APP_DIR):
    for fn in filenames:
        installed_size += os.path.getsize(os.path.join(dirpath, fn))
installed_size = (installed_size + 1023) // 1024   # KB

control_text = f"""\
Package: {APP_ID}
Version: {VERSION}
Section: misc
Priority: optional
Architecture: all
Installed-Size: {installed_size}
Maintainer: Bensal
Description: TWRVision IPTV app for LG WebOS
webOS-Package-Format-Version: 2
App-Id: {APP_ID}
App-Version: {VERSION}
""".encode()

control_tar = make_tar_gz({'./control': control_text})

# ── data.tar.gz ───────────────────────────────────────────────────────────────

data_files = {}
for dirpath, dirnames, filenames in os.walk(APP_DIR):
    for fn in filenames:
        full = os.path.join(dirpath, fn)
        rel  = os.path.relpath(full, APP_DIR)
        arc  = f'./usr/palm/applications/{APP_ID}/{rel.replace(os.sep, "/")}'
        with open(full, 'rb') as fh:
            data_files[arc] = fh.read()

data_tar = make_tar_gz(data_files)

# ── assemble .ipk ─────────────────────────────────────────────────────────────

debian_binary = b'2.0\n'
ipk_bytes = build_ar([
    ('debian-binary', debian_binary),
    ('control.tar.gz', control_tar),
    ('data.tar.gz',    data_tar),
])

with open(OUT, 'wb') as f:
    f.write(ipk_bytes)

size_kb = len(ipk_bytes) // 1024
print(f'Done → {os.path.basename(OUT)}  ({size_kb} KB)')
