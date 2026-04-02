const fs = require("fs");
const path = require("path");

const IGNORE = [
  "node_modules",
  ".git",
  ".next",
  "dist",
  "build",
  ".turbo"
];

const MAX_DEPTH = 5;

function printTree(dir, depth = 0) {
  if (depth > MAX_DEPTH) return;

  const items = fs.readdirSync(dir);

  items.forEach((item) => {
    if (IGNORE.includes(item)) return;

    const fullPath = path.join(dir, item);
    const isDir = fs.statSync(fullPath).isDirectory();

    const indent = "  ".repeat(depth);
    console.log(`${indent}- ${item}`);

    if (isDir) {
      printTree(fullPath, depth + 1);
    }
  });
}

// roda a partir da raiz
printTree(process.cwd());
