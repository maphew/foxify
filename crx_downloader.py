#!/usr/bin/env -S uv run --script
# /// script
# requires-python = ">=3.8"
# dependencies = [
#     "requests",
#     "typer",
#     "rich",
#     "python-magic",
#     "jsonschema"
# ]
# ///
"""
CRX Downloader - Download Chrome/Edge extensions directly from the web store
"""

import json
import os
import re
import shutil
import sys
import uuid
import zipfile
from pathlib import Path
from urllib.parse import urlparse

import magic
import requests
import typer
from jsonschema import validate
from rich.console import Console
from rich.progress import (
    BarColumn,
    Progress,
    SpinnerColumn,
    TextColumn,
    TimeRemainingColumn,
)

# JSON Schema for manifest v3
MANIFEST_V3_SCHEMA = {
    "type": "object",
    "properties": {
        "manifest_version": {"const": 3},
        "name": {"type": "string"},
        "version": {"type": "string"},
    },
    "required": ["manifest_version", "name", "version"],
}

# JSON Schema for manifest v2
MANIFEST_V2_SCHEMA = {
    "type": "object",
    "properties": {
        "manifest_version": {"const": 2},
        "name": {"type": "string"},
        "version": {"type": "string"},
    },
    "required": ["manifest_version", "name", "version"],
}

# Constants
CHROME_CDN_URL = "https://clients2.google.com/service/update2/crx"
CHROME_VERSION = "130.0.0.0"  # Using the version from the userscript
EDGE_CDN_URL = "https://edge.microsoft.com/extensionwebstorebase/v1/crx"

app = typer.Typer(help="Download Chrome/Edge extensions directly from the web store")
console = Console()

def extract_extension_id(url: str) -> str:
    """Extract extension ID from Chrome Web Store or Edge Add-ons URL"""
    # Handle direct ID input
    if re.match(r'^[a-z]{32}$', url.lower()):
        return url
        
    # Extract from URL
    patterns = [
        r'chromewebstore\.google\.com/detail/[^/]+/([a-z]{32})',
        r'chrome\.google\.com/webstore/detail/[^/]+/([a-z]{32})',
        r'microsoftedge\.microsoft\.com/addons/detail/([a-z]{32})'
    ]
    
    for pattern in patterns:
        match = re.search(pattern, url, re.IGNORECASE)
        if match:
            return match.group(1)
    
    # If no match, assume the input is already an ID
    return url.split('?')[0]  # Remove query params if present

def construct_download_url(extension_id: str, is_edge: bool = False) -> str:
    """Construct the CDN download URL for the extension"""
    if is_edge:
        return f"{EDGE_CDN_URL}?response=redirect&x=id%3D{extension_id}%26installsource%3Dondemand%26uc"
    else:
        return (
            f"{CHROME_CDN_URL}?response=redirect&acceptformat=crx2,crx3"
            f"&prodversion={CHROME_VERSION}&x=id%3D{extension_id}%26installsource%3Dondemand%26uc"
        )

def download_file(url: str, output_path: Path) -> bool:
    """Download a file from URL to the specified path"""
    try:
        with requests.get(url, stream=True) as r:
            r.raise_for_status()
            total_size = int(r.headers.get('content-length', 0))
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(bar_width=None),
                "•",
                "[progress.percentage]{task.percentage:>3.0f}%",
                "•",
                TimeRemainingColumn(),
            ) as progress:
                task = progress.add_task("Downloading...", total=total_size)
                
                with open(output_path, 'wb') as f:
                    for chunk in r.iter_content(chunk_size=8192):
                        f.write(chunk)
                        progress.update(task, advance=len(chunk))
            
            return True
    except Exception as e:
        console.print(f"[red]Error downloading file: {e}[/red]")
        return False

def is_crx_file(file_path: Path) -> bool:
    """Check if a file is a valid CRX file"""
    try:
        with open(file_path, 'rb') as f:
            # CRX files start with 'Cr24' (0x43723234) in the header
            return f.read(4) == b'Cr24'
    except Exception:
        return False

def extract_crx(crx_path: Path, output_dir: Path = None) -> bool:
    """Extract a CRX file to the specified directory"""
    if not crx_path.exists():
        console.print(f"[red]Error: File not found: {crx_path}[/red]")
        return False
    
    if not is_crx_file(crx_path):
        console.print(f"[red]Error: Not a valid CRX file: {crx_path}[/red]")
        return False
    
    # Set default output directory if not specified
    if output_dir is None:
        output_dir = crx_path.parent / crx_path.stem
    
    try:
        # Create output directory if it doesn't exist
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # CRX files have a 307-byte header before the ZIP data
        with open(crx_path, 'rb') as f:
            # Skip the CRX header (first 307 bytes)
            f.seek(307)
            
            # Create a temporary ZIP file
            zip_path = crx_path.with_suffix('.zip')
            with open(zip_path, 'wb') as zip_file:
                shutil.copyfileobj(f, zip_file)
        
        # Extract the ZIP file
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            total_files = len(zip_ref.namelist())
            
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(bar_width=None),
                "•",
                "[progress.percentage]{task.percentage:>3.0f}%",
                "•",
                "[blue]{task.completed}/{task.total} files",
            ) as progress:
                task = progress.add_task("Extracting...", total=total_files)
                
                for file in zip_ref.namelist():
                    zip_ref.extract(file, output_dir)
                    progress.update(task, advance=1)
        
        # Clean up the temporary ZIP file
        zip_path.unlink()
        
        console.print(f"[green]Extracted to: {output_dir.absolute()}[/green]")
        return True
        
    except Exception as e:
        console.print(f"[red]Error extracting CRX file: {e}[/red]")
        # Clean up partially extracted files
        if output_dir.exists():
            shutil.rmtree(output_dir, ignore_errors=True)
        return False

@app.command()
def download(
    url_or_id: str = typer.Argument(..., help="Extension URL or ID"),
    output: Path = typer.Option(
        None,
        "--output", "-o",
        help="Output file path (default: ./{extension_id}.crx)",
        dir_okay=False,
    ),
    edge: bool = typer.Option(
        False,
        "--edge", "-e",
        help="Download from Microsoft Edge Add-ons",
    ),
    extract: bool = typer.Option(
        False,
        "--extract", "-x",
        help="Extract the CRX file after downloading",
    ),
    firefox: bool = typer.Option(
        False,
        "--firefox", "-f",
        help="Convert to Firefox .xpi format after downloading and extracting",
    ),
    extract_dir: Path = typer.Option(
        None,
        "--extract-dir", "-d",
        help="Directory to extract the CRX file to (default: ./{extension_id})",
        dir_okay=True,
        file_okay=False,
    ),
    firefox_id: str = typer.Option(
        None,
        "--firefox-id",
        help="Firefox extension ID (default: generated UUID)",
    ),
):
    """Download a Chrome/Edge extension CRX file"""
    # Extract extension ID
    extension_id = extract_extension_id(url_or_id)
    if not re.match(r'^[a-z]{32}$', extension_id, re.IGNORECASE):
        console.print("[red]Error: Invalid extension ID or URL format[/red]")
        raise typer.Exit(1)
    
    # Set default output path if not provided
    if output is None:
        output = Path(f"{extension_id}.crx")
    
    # Construct download URL
    download_url = construct_download_url(extension_id, edge)
    
    console.print(f"Extension ID: {extension_id}")
    console.print(f"Download URL: {download_url}")
    console.print(f"Output file: {output.absolute()}")
    
    # Download the file
    console.print("\nStarting download...")
    if download_file(download_url, output):
        console.print(f"\n[green]Successfully downloaded to: {output.absolute()}[/green]")
        
        # Extract if requested
        if extract or firefox:
            console.print("\nExtracting CRX file...")
            if extract_dir is None:
                extract_dir = Path(f"./{extension_id}")
            extract_crx(output, extract_dir)
            
            # Convert to Firefox if requested
            if firefox:
                xpi_path = output.with_suffix('.xpi')
                convert_to_xpi(
                    extract_dir,
                    xpi_path,
                    firefox_id or f"{extension_id}@foxify"
                )
                console.print(f"\n[green]Firefox XPI created at: {xpi_path.absolute()}[/green]")
        
        console.print("\nInstallation instructions:")
        if firefox:
            console.print("\nFor Firefox:")
            console.print("1. Open about:debugging#/runtime/this-firefox")
            console.print("2. Click 'Load Temporary Add-on'")
            console.print(f"3. Select: {xpi_path.absolute()}")
        
        console.print("\nFor Chrome/Edge:")
        console.print("1. Open chrome://extensions/ or edge://extensions/")
        console.print("2. Enable 'Developer mode' (top-right toggle)")
        if extract:
            console.print("3. Click 'Load unpacked' and select the extracted directory")
        else:
            console.print("3. Drag and drop the .crx file into the page")
    else:
        console.print("\n[red]Download failed[/red]")
        raise typer.Exit(1)

@app.command()
def validate_manifest(manifest_path: Path) -> dict:
    """Validate and parse the extension manifest file"""
    try:
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            
        # Check manifest version and validate against schema
        if manifest.get('manifest_version') == 3:
            validate(manifest, MANIFEST_V3_SCHEMA)
        else:
            # Default to v2 if not specified
            manifest['manifest_version'] = 2
            validate(manifest, MANIFEST_V2_SCHEMA)
            
        return manifest
    except json.JSONDecodeError:
        console.print("[red]Error: Invalid JSON in manifest file[/red]")
        raise typer.Exit(1)
    except Exception as e:
        console.print(f"[red]Error in manifest: {e}[/red]")
        raise typer.Exit(1)

def convert_to_xpi(extracted_dir: Path, output_path: Path, extension_id: str):
    """Convert an extracted Chrome extension to Firefox XPI format"""
    manifest_path = extracted_dir / 'manifest.json'
    if not manifest_path.exists():
        console.print("[red]Error: manifest.json not found in extracted directory[/red]")
        raise typer.Exit(1)
    
    console.print("\nConverting to Firefox XPI format...")
    
    try:
        # Read and validate the manifest
        manifest = validate_manifest(manifest_path)
        
        # Update manifest for Firefox compatibility
        if 'applications' not in manifest:
            manifest['applications'] = {}
        if 'gecko' not in manifest['applications']:
            manifest['applications']['gecko'] = {}
            
        # Set the extension ID
        manifest['applications']['gecko']['id'] = extension_id
        
        # Add strict_min_version for Firefox
        if 'strict_min_version' not in manifest['applications']['gecko']:
            manifest['applications']['gecko']['strict_min_version'] = "91.0"
        
        # Save the updated manifest
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, indent=2, ensure_ascii=False)
        
        # Create XPI file
        with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(extracted_dir):
                for file in files:
                    file_path = Path(root) / file
                    arcname = os.path.relpath(file_path, extracted_dir)
                    zipf.write(file_path, arcname)
        
        return True
        
    except Exception as e:
        console.print(f"[red]Error converting to XPI: {e}[/red]")
        if output_path.exists():
            output_path.unlink()
        raise typer.Exit(1)

def extract(
    crx_file: Path = typer.Argument(..., help="Path to the CRX file to extract"),
    output_dir: Path = typer.Option(
        None,
        "--output", "-o",
        help="Output directory (default: ./{crx_filename_without_extension})",
        dir_okay=True,
        file_okay=False,
    ),
    firefox: bool = typer.Option(
        False,
        "--firefox", "-f",
        help="Convert to Firefox .xpi format after extracting",
    ),
    firefox_id: str = typer.Option(
        None,
        "--firefox-id",
        help="Firefox extension ID (default: generated UUID)",
    ),
):
    """Extract a downloaded CRX file and optionally convert to Firefox XPI"""
    if not crx_file.exists():
        console.print(f"[red]Error: File not found: {crx_file}[/red]")
        raise typer.Exit(1)
    
    if output_dir is None:
        output_dir = Path(crx_file.stem)
    
    extract_crx(crx_file, output_dir)
    
    if firefox:
        xpi_path = crx_file.with_suffix('.xpi')
        convert_to_xpi(
            output_dir,
            xpi_path,
            firefox_id or f"{output_dir.name}@foxify"
        )
        console.print(f"\n[green]Firefox XPI created at: {xpi_path.absolute()}[/green]")

if __name__ == "__main__":
    try:
        app()
    except KeyboardInterrupt:
        console.print("\n[red]Operation cancelled[/red]")
        sys.exit(1)
