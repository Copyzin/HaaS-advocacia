#!/usr/bin/env python3
"""
Servidor de PREVIEW LOCAL — emula a reescrita de URLs limpas do .htaccess.

Por que existe: `python -m http.server` é estático e NÃO lê .htaccess, então
URLs sem .html (ex.: /servicos/previdenciario) dão 404. Este script reproduz
localmente o que a Hostinger (Apache/LiteSpeed) faz em produção:

  /                       -> index.html
  /servicos/              -> servicos/index.html
  /servicos/previdenciario -> servicos/previdenciario.html
  /blog/                  -> blog/index.html
  /sobre                  -> sobre.html
  /assets/...             -> arquivo real (servido como está)

Uso:  python serve.py        (porta 8700; ou: python serve.py 8000)

NÃO é deployado — só para desenvolvimento. Pode adicionar ao .gitignore.
"""
import http.server
import os
import sys
import urllib.parse

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8700
ROOT = os.path.dirname(os.path.abspath(__file__))


class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def _rewrite(self):
        parsed = urllib.parse.urlsplit(self.path)
        path = urllib.parse.unquote(parsed.path)
        fs = os.path.join(ROOT, path.lstrip("/").replace("/", os.sep))

        # Diretório real (/, /servicos/, /blog/) -> deixa o handler servir index.html
        if os.path.isdir(fs):
            return
        # Arquivo real (asset, ou já é .html) -> serve como está
        if os.path.isfile(fs):
            return
        # Extensionless (com ou sem barra final) -> tenta <rota>.html
        candidate = path.rstrip("/")
        fs_html = os.path.join(ROOT, candidate.lstrip("/").replace("/", os.sep)) + ".html"
        if os.path.isfile(fs_html):
            new_path = candidate + ".html"
            if parsed.query:
                new_path += "?" + parsed.query
            self.path = new_path

    def do_GET(self):
        self._rewrite()
        return super().do_GET()

    def do_HEAD(self):
        self._rewrite()
        return super().do_HEAD()


if __name__ == "__main__":
    os.chdir(ROOT)
    httpd = http.server.HTTPServer(("", PORT), CleanURLHandler)
    print(f"Preview (URLs limpas) em http://localhost:{PORT}/  — Ctrl+C para parar")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        httpd.server_close()
