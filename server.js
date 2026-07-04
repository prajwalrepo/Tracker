const https = require("https");
const fs = require("fs");
const path = require("path");
const url = require("url");

const rootDir = __dirname;
const port = Number(process.env.PORT || 8443);
const pfxPath = path.join(rootDir, "localhost-devcert.pfx");
const pfxPassphrase = "devcert";

if (!fs.existsSync(pfxPath)) {
  throw new Error(`Missing certificate file: ${pfxPath}`);
}

const server = https.createServer(
  {
    pfx: fs.readFileSync(pfxPath),
    passphrase: pfxPassphrase
  },
  (req, res) => {
    const parsedUrl = url.parse(req.url || "/");
    let requestPath = decodeURIComponent(parsedUrl.pathname || "/");

    if (requestPath === "/") {
      requestPath = "/index.html";
    }

    const filePath = path.join(rootDir, requestPath);
    if (!filePath.startsWith(rootDir)) {
      res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Forbidden");
      return;
    }

    fs.readFile(filePath, (error, data) => {
      if (error) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("Not found");
        return;
      }

      res.writeHead(200, { "Content-Type": getContentType(filePath) });
      res.end(data);
    });
  }
);

server.listen(port, "127.0.0.1", () => {
  console.log(`HTTPS server running at https://localhost:${port}`);
});

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".html") return "text/html; charset=utf-8";
  if (ext === ".css") return "text/css; charset=utf-8";
  if (ext === ".js") return "text/javascript; charset=utf-8";
  if (ext === ".jsx") return "text/javascript; charset=utf-8";
  if (ext === ".json") return "application/json; charset=utf-8";
  if (ext === ".svg") return "image/svg+xml";
  return "application/octet-stream";
}
