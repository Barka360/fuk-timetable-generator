"""Serve only the FUK Timetable Office app assets on the local network."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse

ROOT = Path(__file__).resolve().parent
ALLOWED = {"index.html", "app.js", "styles.css", "cloud.css", "sample-courses.csv", "sample-venues.csv"}


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def _allowed_path(self):
        name = unquote(urlsplit(self.path).path).lstrip("/") or "index.html"
        return name if name in ALLOWED else None

    def do_GET(self):
        name = self._allowed_path()
        if name is None:
            self.send_error(404, "Not found")
            return
        self.path = "/" + name
        super().do_GET()

    def do_HEAD(self):
        name = self._allowed_path()
        if name is None:
            self.send_error(404, "Not found")
            return
        self.path = "/" + name
        super().do_HEAD()

    def log_message(self, fmt, *args):
        print("[%s] %s" % (self.log_date_time_string(), fmt % args))


def main():
    parser = argparse.ArgumentParser(description="Serve the timetable app on this computer or local network.")
    parser.add_argument("--host", default="127.0.0.1", help="Use 0.0.0.0 to allow other devices on your Wi-Fi")
    parser.add_argument("--port", type=int, default=8000)
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), AppHandler)
    print("FUK Timetable Office is available at http://127.0.0.1:%d/" % args.port)
    if args.host == "0.0.0.0":
        print("For phone access, use http://<this-computer-wi-fi-ip>:%d/ on the same Wi-Fi network." % args.port)
        print("Only the app HTML, JavaScript, styles, and sample CSV files are served. Press Ctrl+C to stop.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
