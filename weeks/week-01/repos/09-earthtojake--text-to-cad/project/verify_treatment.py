from __future__ import annotations

import hashlib
import json
import math
import os
import struct
import sys
from pathlib import Path

from cadgen import read_step


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def stl_triangle_count(path: Path) -> int:
    data = path.read_bytes()
    if len(data) >= 84:
        count = struct.unpack_from("<I", data, 80)[0]
        if 84 + count * 50 == len(data):
            return count
    return data.lower().count(b"facet normal")


def close(actual: float, expected: float, tolerance: float) -> bool:
    return abs(actual - expected) <= tolerance


def main() -> None:
    if len(sys.argv) != 5:
        raise SystemExit(
            "Usage: python verify_treatment.py <step> <stl> <output.json> <elapsed-ms>"
        )

    step_path = Path(sys.argv[1])
    stl_path = Path(sys.argv[2])
    output_path = Path(sys.argv[3])
    elapsed_ms = float(sys.argv[4])

    shape = read_step(step_path)
    bounds = shape.bounding_box().size
    dimensions = [float(bounds.X), float(bounds.Y), float(bounds.Z)]
    volume = float(shape.volume)
    expected_volume = 40.0 * 30.0 * 4.0 - 4.0 * math.pi * 1.5**2 * 4.0
    solid_count = len(shape.solids())
    triangle_count = stl_triangle_count(stl_path)

    expected_dimensions = [40.0, 30.0, 4.0]
    telemetry_enabled = not (
        os.environ.get("DO_NOT_TRACK") == "1"
        and os.environ.get("CADGEN_TELEMETRY") == "0"
    )
    update_check_enabled = not (
        os.environ.get("CI") == "1"
        and os.environ.get("CADGEN_UPDATE_CHECK") == "0"
    )
    checks = {
        "stepGenerated": step_path.is_file() and step_path.stat().st_size > 0,
        "stlGenerated": stl_path.is_file() and stl_path.stat().st_size > 0,
        "boundingBoxVerified": len(dimensions) == len(expected_dimensions)
        and all(
            close(dimensions[index], expected_dimensions[index], 0.001)
            for index in range(len(expected_dimensions))
        ),
        "volumeAndTopologyVerified": close(volume, expected_volume, 0.01)
        and solid_count == 1
        and triangle_count > 0,
    }
    quality_score = 6 + sum(checks.values())
    if quality_score != 10:
        raise RuntimeError(f"Treatment verification failed: {checks}")

    result = {
        "analyzer": "cadgen-0.7.26-authored-model",
        "dimensionsMm": dimensions,
        "volumeMm3": volume,
        "expectedVolumeMm3": expected_volume,
        "solidCount": solid_count,
        "stlTriangleCount": triangle_count,
        "checks": checks,
        "artifacts": {
            "step": {
                "name": step_path.name,
                "bytes": step_path.stat().st_size,
                "sha256": sha256(step_path),
            },
            "stl": {
                "name": stl_path.name,
                "bytes": stl_path.stat().st_size,
                "sha256": sha256(stl_path),
            },
        },
        "quality": {
            "score": quality_score,
            "maximum": 10,
            "rubric": "6 requirement facts + STEP + STL + bounding box + volume/topology",
        },
        "telemetryEnabled": telemetry_enabled,
        "updateCheckEnabled": update_check_enabled,
        "viewerOrMcpStarted": False,
        "errors": [],
        "elapsedMs": elapsed_ms,
    }
    output_path.write_text(json.dumps(result, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(result))


if __name__ == "__main__":
    main()