import time
import subprocess
import httpx
import sys

def verify_live_server():
    print("Starting uvicorn app.main:app on port 8000...")
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    time.sleep(2)
    try:
        with httpx.Client(base_url="http://127.0.0.1:8000") as client:
            resp = client.get("/health")
            print(f"HTTP GET /health -> Status Code: {resp.status_code}")
            print(f"Response JSON: {resp.text}")
            assert resp.status_code == 200
            assert resp.json() == {"status": "ok", "version": "1.0.0"}
            print("LIVE SERVER VERIFICATION SUCCESSFUL!")
    finally:
        proc.terminate()
        proc.wait()

if __name__ == "__main__":
    verify_live_server()
