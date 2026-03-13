#!/usr/bin/env node
import { Server } from "socket.io";
import chokidar from "chokidar";
import { readFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
import express from "express";

const command = process.argv[2];

if (command !== "dev") {
  console.error(`Unknown command: ${command ?? "(none)"}`);
  console.error("Usage: sequenza dev");
  process.exit(1);
}

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const distDir = join(__dirname, "..", "app");
const userCwd = process.cwd();

const UI_PORT = 3000;
const SOCKET_PORT = 3001;

const app = express();
app.use(express.static(distDir));

app.get("/{*path}", (_req, res) => res.sendFile(join(distDir, "index.html")));
app.listen(UI_PORT, () => {
  console.log(`Editor:  http://localhost:${UI_PORT}`);
});

const io = new Server(SOCKET_PORT, { cors: { origin: "*" } });
const fragMap = {};

const watcher = chokidar.watch(userCwd, {
  ignored: [
    /node_modules/,
    (path, stats) => (stats?.isFile() ?? false) && !path.endsWith(".frag"),
  ],
  persistent: true,
});

watcher
  .on("add", (path) => {
    fragMap[path] = readFileSync(path, "utf-8");
    io.emit("shaders-found", fragMap);
  })
  .on("change", (path) => {
    fragMap[path] = readFileSync(path, "utf-8");
    io.emit("shaders-found", fragMap);
  })
  .on("unlink", (path) => {
    delete fragMap[path];
    io.emit("shaders-found", fragMap);
  });

io.on("connection", (socket) => {
  socket.emit("shaders-found", fragMap);
});

console.log(`Watcher: watching ${userCwd} on :${SOCKET_PORT}`);
