
import json
import os
import tempfile
from pathlib import Path

from collector.backend_sender import send_to_backend

QUEUE_DIR = Path(__file__).resolve().parent / "pending_measurements"


def save_pending(payload):
    """Persist a measurement with its original UUID."""
    measurement_id = payload.get("measurementId")

    if not isinstance(measurement_id, str):
        raise ValueError("Missing measurement ID")

    # UUID is expected; reject unsafe filenames.
    import uuid
    try:
        parsed_id = uuid.UUID(measurement_id)
    except (ValueError, AttributeError) as error:
        raise ValueError("Invalid measurement UUID") from error

    if str(parsed_id) != measurement_id:
        raise ValueError("Measurement ID must be canonical UUID")

    QUEUE_DIR.mkdir(parents=True, exist_ok=True)

    destination = QUEUE_DIR / f"{measurement_id}.json"

    # Do not overwrite a previously queued measurement.
    if destination.exists():
        existing = json.loads(
            destination.read_text(encoding="utf-8")
        )
        if existing != payload:
            raise ValueError(
                "Conflicting payload for existing measurement ID"
            )
        return destination

    temp_path = None

    try:
        with tempfile.NamedTemporaryFile(
            mode="w",
            encoding="utf-8",
            dir=QUEUE_DIR,
            suffix=".tmp",
            delete=False
        ) as file:
            temp_path = Path(file.name)
            json.dump(payload, file, indent=2)
            file.flush()
            os.fsync(file.fileno())

        # Atomic replacement on the same filesystem.
        os.replace(temp_path, destination)

        print("Measurement queued:", measurement_id)
        return destination

    finally:
        if temp_path is not None:
            temp_path.unlink(missing_ok=True)


def retry_pending(max_items=10):
    """Retry queued measurements using their original IDs."""
    if not QUEUE_DIR.exists():
        return 0

    recovered = 0

    files = sorted(QUEUE_DIR.glob("*.json"))[:max_items]

    for path in files:
        try:
            payload = json.loads(
                path.read_text(encoding="utf-8")
            )

            if not isinstance(payload, dict):
                raise ValueError("Invalid queue payload")

            if path.stem != payload.get("measurementId"):
                raise ValueError("Queue filename/ID mismatch")

            print("Retrying:", path.stem)

            if send_to_backend(payload):
                path.unlink()
                recovered += 1
            else:
                # Keep the file for a future retry.
                print("Still pending:", path.stem)

        except (OSError, ValueError, TypeError) as error:
            print("Queue item error:", path.name, error)

    return recovered


def pending_count():
    if not QUEUE_DIR.exists():
        return 0

    return len(list(QUEUE_DIR.glob("*.json")))
