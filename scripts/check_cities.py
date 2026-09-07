#!/usr/bin/env python3
"""
Quality of Life - City Count Checker Utility

Queries the Quality of Life API to verify how many cities are populated
in the database compared to the expected total (266 cities from the OpenML dataset).

Usage:
    ./scripts/check_cities.py
    ./scripts/check_cities.py --url https://quality-of-life.lan.codyuhi.online
    ./scripts/check_cities.py --wait
    ./scripts/check_cities.py --json
"""

import argparse
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from typing import Any, Dict, Optional, Tuple

DEFAULT_URL = os.getenv("QUALITY_OF_LIFE_API_URL", "https://quality-of-life.lan.codyuhi.online")
DEFAULT_EXPECTED = 266

# Terminal colors
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
BOLD = "\033[1m"
RESET = "\033[0m"


def build_ssl_context(insecure: bool) -> ssl.SSLContext:
    if insecure:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE
        return ctx
    return ssl.create_default_context()


def fetch_json(url: str, ssl_ctx: ssl.SSLContext, timeout: float = 10.0) -> Tuple[int, Optional[Dict[str, Any]], str]:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "QualityOfLifeChecker/1.0", "Accept": "application/json"}
    )
    try:
        with urllib.request.urlopen(req, context=ssl_ctx, timeout=timeout) as resp:
            status = resp.status
            body = resp.read().decode("utf-8")
            try:
                data = json.loads(body)
                return status, data, ""
            except json.JSONDecodeError:
                return status, None, body
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8", errors="replace")
        return e.code, None, err_body
    except Exception as e:
        return 0, None, str(e)


def get_city_count_via_api(base_url: str, ssl_ctx: ssl.SSLContext) -> Tuple[int, int, bool, str]:
    """
    Queries the /api/cities/count endpoint (or fallback queries).
    Returns (count, expected, is_fully_seeded, error_message).
    """
    clean_base = base_url.rstrip("/")
    
    # 1. Primary endpoint: /api/cities/count
    count_url = f"{clean_base}/api/cities/count"
    status, data, err_text = fetch_json(count_url, ssl_ctx)
    if status == 200 and data and "count" in data:
        count = int(data.get("count", 0))
        expected = int(data.get("expected", DEFAULT_EXPECTED))
        is_fully_seeded = bool(data.get("is_fully_seeded", count >= expected))
        return count, expected, is_fully_seeded, ""

    # 2. Secondary fallback: /api/cities/?count=true
    fallback_url = f"{clean_base}/api/cities/?count=true"
    status, data, err_text = fetch_json(fallback_url, ssl_ctx)
    if status == 200 and data and "count" in data:
        count = int(data.get("count", 0))
        expected = int(data.get("expected", DEFAULT_EXPECTED))
        is_fully_seeded = bool(data.get("is_fully_seeded", count >= expected))
        return count, expected, is_fully_seeded, ""

    # 3. If running on backend version prior to count endpoint, check healthz or return error
    health_url = f"{clean_base}/healthz"
    h_status, h_data, _ = fetch_json(health_url, ssl_ctx)
    if h_status != 200:
        return -1, DEFAULT_EXPECTED, False, f"API health check failed at {health_url} (HTTP {h_status}): {err_text}"

    return -1, DEFAULT_EXPECTED, False, f"API count endpoint returned HTTP {status}. Error: {err_text}"


def render_progress_bar(current: int, total: int, width: int = 30) -> str:
    if total <= 0:
        return ""
    fraction = min(1.0, max(0.0, current / total))
    filled = int(round(width * fraction))
    bar = "█" * filled + "░" * (width - filled)
    percent = fraction * 100.0
    return f"[{bar}] {current}/{total} ({percent:5.1f}%)"


def main():
    parser = argparse.ArgumentParser(
        description="Verify the number of cities stored in the Quality of Life database via the API."
    )
    parser.add_argument(
        "--url", "-u",
        default=DEFAULT_URL,
        help=f"Base URL of the Quality of Life frontend/backend (default: {DEFAULT_URL})"
    )
    parser.add_argument(
        "--expected", "-e",
        type=int,
        default=DEFAULT_EXPECTED,
        help=f"Expected total number of cities (default: {DEFAULT_EXPECTED})"
    )
    parser.add_argument(
        "--wait", "-w",
        action="store_true",
        help="Poll periodically until the database reaches the expected number of cities"
    )
    parser.add_argument(
        "--poll-interval",
        type=int,
        default=5,
        help="Seconds between polling attempts when using --wait (default: 5)"
    )
    parser.add_argument(
        "--timeout",
        type=int,
        default=600,
        help="Maximum seconds to wait when using --wait (default: 600)"
    )
    parser.add_argument(
        "--json", "-j",
        action="store_true",
        help="Output result as JSON"
    )
    parser.add_argument(
        "--no-color",
        action="store_true",
        help="Disable ANSI color output"
    )
    parser.add_argument(
        "--insecure", "-k",
        action="store_true",
        default=True,
        help="Allow self-signed TLS certificates (default: True)"
    )

    args = parser.parse_args()

    ssl_ctx = build_ssl_context(args.insecure)
    base_url = args.url.rstrip("/")

    use_color = not args.no_color and sys.stdout.isatty() and not args.json
    def c(color_code: str, text: str) -> str:
        return f"{color_code}{text}{RESET}" if use_color else text

    start_time = time.time()
    
    while True:
        count, expected, is_fully_seeded, err = get_city_count_via_api(base_url, ssl_ctx)
        target_expected = args.expected if args.expected > 0 else expected

        if count >= 0:
            pct = (count / target_expected * 100.0) if target_expected > 0 else 0.0
            is_done = count >= target_expected

            if args.json:
                res = {
                    "url": base_url,
                    "count": count,
                    "expected": target_expected,
                    "is_fully_seeded": is_done,
                    "percentage": round(pct, 2),
                    "remaining": max(0, target_expected - count)
                }
                print(json.dumps(res, indent=2))
                return 0 if is_done else 2

            bar = render_progress_bar(count, target_expected)
            if is_done:
                print(f"{c(GREEN + BOLD, '✔ Database is fully seeded!')}")
                print(f"  • API URL:      {base_url}")
                print(f"  • City Count:   {c(GREEN, str(count))} / {target_expected}")
                print(f"  • Status:       {bar}")
                return 0
            else:
                remaining = target_expected - count
                status_color = YELLOW if count > 0 else RED
                print(f"{c(status_color + BOLD, '⏳ Database seeding in progress...')}")
                print(f"  • API URL:      {base_url}")
                print(f"  • Current Count:{c(status_color, f' {count}')} / {target_expected}")
                print(f"  • Remaining:    {remaining} cities")
                print(f"  • Progress:     {bar}")

                if not args.wait:
                    return 2

        else:
            if args.json:
                print(json.dumps({"url": base_url, "error": err, "count": -1, "expected": target_expected}, indent=2))
                return 1
            print(f"{c(RED + BOLD, '✖ Error querying API:')} {err}")
            if not args.wait:
                return 1

        elapsed = time.time() - start_time
        if elapsed >= args.timeout:
            print(f"\n{c(RED, f'Timeout of {args.timeout}s exceeded while waiting for cities to seed.')}")
            return 1

        time.sleep(args.poll_interval)


if __name__ == "__main__":
    sys.exit(main())
