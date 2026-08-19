import http.server
import socketserver
import os

PORT = 8000

class CleanURLHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Strip query strings and hash anchors
        clean_path = self.path.split('?')[0].split('#')[0]
        
        # Root path
        if clean_path in ('/', ''):
            if os.path.exists('index.html'):
                self.path = '/index.html'
        else:
            rel_path = clean_path.lstrip('/')
            # If the exact file/directory doesn't exist, try appending .html
            if not os.path.exists(rel_path) and os.path.exists(rel_path + '.html'):
                self.path = clean_path + '.html'
        
        return super().do_GET()

if __name__ == '__main__':
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", PORT), CleanURLHandler) as httpd:
        print(f"Server running with clean URL support at http://localhost:{PORT}")
        httpd.serve_forever()
