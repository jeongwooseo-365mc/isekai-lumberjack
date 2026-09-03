#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of ["index.html", "styles.css", "game.js"]) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

const directories = ["bg", "audio", "items", "resources", "foods", "ui", "targets", "fx"];
for (const directory of directories) {
  const source = path.join(root, "assets", directory);
  if (fs.existsSync(source)) fs.cpSync(source, path.join(dist, "assets", directory), { recursive: true });
}
for (const directory of ["axe", "pickaxe", "sword", "rest", "fishing"]) {
  fs.cpSync(path.join(root, "assets", "sprites", directory), path.join(dist, "assets", "sprites", directory), { recursive: true });
}
console.log(`Prepared runtime assets in ${dist}`);
