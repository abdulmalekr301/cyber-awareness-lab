#!/usr/bin/env python3
"""Local Nginx test. Requires EXISTING non-production TLS fixtures; generates no keys.

Every socket connects to loopback and uses a temporary high port. No system Nginx
configuration, production certificate, live domain or VPS is accessed.
"""
import argparse
import http.client
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from pathlib import Path
import socket
import ssl
import subprocess
import tempfile
import threading
import time


def free_port():
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        return probe.getsockname()[1]


class Echo(BaseHTTPRequestHandler):
    def do_GET(self):
        body = json.dumps({"path": self.path, "host": self.headers.get("Host"),
                           "ip": self.headers.get("X-Forwarded-For"), "real_ip": self.headers.get("X-Real-IP"),
                           "proto": self.headers.get("X-Forwarded-Proto"),
                           "cf": self.headers.get("CF-Connecting-IP"), "forwarded": self.headers.get("Forwarded"),
                           "cookie": self.headers.get("Cookie")}).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Set-Cookie", "cyberlab_admin=fixture; Path=/; Secure; HttpOnly; SameSite=Strict")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, *args):
        pass


class LoopbackTLS(http.client.HTTPSConnection):
    def connect(self):
        raw = socket.create_connection(("127.0.0.1", self.port), self.timeout, self.source_address)
        self.sock = self._context.wrap_socket(raw, server_hostname=self.host)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--nginx-bin", required=True, type=Path)
    parser.add_argument("--test-cert", required=True, type=Path)
    parser.add_argument("--test-key", required=True, type=Path)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parent
    assert "default_server" not in (directory / "cyberlab-public.conf").read_text()
    processes = []
    backend = ThreadingHTTPServer(("127.0.0.1", 0), Echo)
    threading.Thread(target=backend.serve_forever, daemon=True).start()
    with tempfile.TemporaryDirectory(prefix="cyberlab-nginx-proxy-") as temporary:
        stage = Path(temporary)
        inner_port, http_port, https_port = free_port(), free_port(), free_port()
        mime = stage / "mime.types"
        mime.write_text("types { text/html html; application/json json; }\n")
        inner = (directory / "nginx.conf").read_text()
        inner = inner.replace("include /etc/nginx/mime.types;", f"include {mime};")
        inner = inner.replace("server app:3000;", f"server 127.0.0.1:{backend.server_port};")
        inner = inner.replace("listen 8080;", f"listen 127.0.0.1:{inner_port};")
        inner = inner.replace("pid /tmp/nginx.pid;", f"pid {stage}/inner.pid;")
        for name in ["client_body", "proxy", "fastcgi", "uwsgi", "scgi"]:
            inner = inner.replace(f"/tmp/{name}", f"{stage}/inner-{name}")
        inner_file = stage / "inner.conf"
        inner_file.write_text(inner)
        trust = stage / "cloudflare-realip.inc"
        # This extra trust is ONLY in the ephemeral test copy. It simulates a
        # Cloudflare edge without binding a Cloudflare IP or altering networking.
        trust.write_text((directory / "cloudflare-realip.inc").read_text() + "\nset_real_ip_from 127.0.0.2;\n")
        game = (directory / "cyberlab-public.conf").read_text()
        game = game.replace("listen 80;", f"listen 127.0.0.1:{http_port};")
        game = game.replace("listen 443 ssl;", f"listen 127.0.0.1:{https_port} ssl;")
        game = game.replace("/etc/nginx/cyberlab/cloudflare-realip.inc", str(trust))
        game = game.replace("/etc/ssl/certs/gameserver.ly.pem", str(args.test_cert.resolve()))
        game = game.replace("/etc/ssl/private/gameserver.ly.key", str(args.test_key.resolve()))
        game = game.replace("http://127.0.0.1:8080;", f"http://127.0.0.1:{inner_port};")
        maintenance = f"""server {{
 listen 127.0.0.1:{http_port} default_server;
 server_name maintenance.invalid;
 return 200 "maintenance:$remote_addr";
}}
server {{
 listen 127.0.0.1:{https_port} ssl default_server;
 server_name maintenance.invalid;
 ssl_certificate {args.test_cert.resolve()};
 ssl_certificate_key {args.test_key.resolve()};
 ssl_protocols TLSv1.2 TLSv1.3;
 return 200 "maintenance:$remote_addr";
}}
"""
        maintenance_file = stage / "maintenance-fixture.conf"
        maintenance_file.write_text(maintenance)
        outer_file = stage / "outer.conf"
        outer_file.write_text(f"""pid {stage}/outer.pid;
error_log stderr;
events {{ worker_connections 128; }}
http {{
 access_log off;
 client_body_temp_path {stage}/outer-client-body;
 proxy_temp_path {stage}/outer-proxy;
 fastcgi_temp_path {stage}/outer-fastcgi;
 uwsgi_temp_path {stage}/outer-uwsgi;
 scgi_temp_path {stage}/outer-scgi;
 include {maintenance_file};
 {game}
}}
""")
        try:
            for config in [inner_file, outer_file]:
                result = subprocess.run([str(args.nginx_bin.resolve()), "-t", "-p", str(stage), "-c", str(config)], capture_output=True, text=True)
                assert result.returncode == 0, result.stderr
                assert "conflicting" not in result.stderr.lower(), result.stderr
            for config in [inner_file, outer_file]:
                log = open(stage / (config.stem + ".log"), "w")
                process = subprocess.Popen([str(args.nginx_bin.resolve()), "-p", str(stage), "-c", str(config),
                                            "-g", "daemon off; master_process off;"], stdout=log, stderr=log)
                processes.append(process)
                log.close()
            for _ in range(100):
                try:
                    with socket.create_connection(("127.0.0.1", https_port), timeout=.2):
                        break
                except OSError:
                    if any(p.poll() is not None for p in processes):
                        raise RuntimeError("Local fixture Nginx exited; no VPS changes occurred")
                    time.sleep(.05)
            else:
                raise RuntimeError("Local fixture Nginx did not start")

            # The pre-existing public test certificate is not issued for the game
            # domain. Verification is disabled ONLY for these loopback fixtures.
            def request(host, path="/api/health?mode=check%2Fvalue&lang=ar", headers=None, peer="127.0.0.1", tls=None):
                context = ssl.SSLContext(ssl.PROTOCOL_TLS_CLIENT)
                context.check_hostname = False
                context.verify_mode = ssl.CERT_NONE
                if tls:
                    context.minimum_version = context.maximum_version = tls
                connection = LoopbackTLS(host, https_port, timeout=5, source_address=(peer, 0), context=context)
                try:
                    connection.request("GET", path, headers={"Host": host, **(headers or {})})
                    protocol = connection.sock.version()
                    response = connection.getresponse()
                    return response.status, dict(response.getheaders()), response.read().decode(), protocol
                finally:
                    connection.close()

            for host in ["gameserver.ly", "www.gameserver.ly"]:
                connection = http.client.HTTPConnection("127.0.0.1", http_port, timeout=5)
                connection.request("GET", "/simulation/wifi/networks?lang=ar", headers={"Host": host})
                response = connection.getresponse()
                assert response.status == 308
                assert response.getheader("Location") == f"https://{host}/simulation/wifi/networks?lang=ar"
                response.read()
                connection.close()
                for version in [ssl.TLSVersion.TLSv1_2, ssl.TLSVersion.TLSv1_3]:
                    status, headers, body, protocol = request(host, headers={"CF-Connecting-IP": "203.0.113.10", "X-Forwarded-For": "198.51.100.99", "Forwarded": "for=198.51.100.99", "Cookie": "cyberlab_admin=fixture"}, tls=version)
                    assert status == 200
                    data = json.loads(body)
                    assert data["path"] == "/api/health?mode=check%2Fvalue&lang=ar"
                    assert data["host"] == host and data["proto"] == "https"
                    assert data["ip"] == data["real_ip"] == "127.0.0.1", data
                    assert data["cf"] is None and data["forwarded"] is None
                    assert data["cookie"] == "cyberlab_admin=fixture"
                    assert "Secure; HttpOnly; SameSite=Strict" in headers["Set-Cookie"]
                    assert protocol == ("TLSv1.2" if version == ssl.TLSVersion.TLSv1_2 else "TLSv1.3")
                _, _, body, _ = request(host, peer="127.0.0.2", headers={"CF-Connecting-IP": "203.0.113.20", "X-Forwarded-For": "198.51.100.77"})
                assert json.loads(body)["ip"] == "203.0.113.20"
                _, _, body, _ = request(host, path="/simulation/wifi/networks?route=react")
                assert json.loads(body)["path"] == "/simulation/wifi/networks?route=react"
            for host in ["maintenance.invalid", "unrelated.invalid"]:
                connection = http.client.HTTPConnection("127.0.0.1", http_port, timeout=5)
                connection.request("GET", "/", headers={"Host": host})
                response = connection.getresponse()
                assert response.status == 200 and response.getheader("Location") is None
                assert response.read().decode() == "maintenance:127.0.0.1"
                connection.close()
                status, _, body, _ = request(host, peer="127.0.0.2", headers={"CF-Connecting-IP": "203.0.113.99"})
                assert status == 200 and body == "maintenance:127.0.0.2", body
            assert maintenance_file.read_text() == maintenance
            print("PASS: Nginx syntax; exact game hosts; HTTP redirects; TLS 1.2/1.3; two-proxy path/query/Host/HTTPS/cookie forwarding; untrusted IP spoof rejection; trusted-edge simulation; unchanged maintenance/default routing and real-IP scope.")
        finally:
            for process in processes:
                process.terminate()
            for process in processes:
                try:
                    process.wait(timeout=5)
                except subprocess.TimeoutExpired:
                    process.kill()
                    process.wait()
            backend.shutdown()
            backend.server_close()


if __name__ == "__main__":
    main()
