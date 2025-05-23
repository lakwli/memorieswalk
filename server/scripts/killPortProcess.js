#!/usr/bin/env node
// filepath: /workspace/server/scripts/killPortProcess.js

/**
 * This script helps kill any process that's using a specific port.
 * Useful when you have a lingering Node process that didn't shut down properly.
 *
 * Usage: node scripts/killPortProcess.js [port]
 * Example: node scripts/killPortProcess.js 3000
 */

import { execSync } from "child_process";

// Get port from command line argument, default to 3000
const port = process.argv[2] || 3000;

console.log(`Checking for processes using port ${port}...`);

try {
  // Find process using the port
  const findCommand = `lsof -i :${port} | grep LISTEN`;
  console.log(`Running: ${findCommand}`);

  const output = execSync(findCommand, { encoding: "utf8" });
  console.log("Found processes:");
  console.log(output);

  // Extract PID from output
  const lines = output.trim().split("\n");
  const pids = [];

  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length > 1) {
      const pid = parts[1];
      pids.push(pid);
    }
  }

  if (pids.length === 0) {
    console.log("No process found using this port.");
    process.exit(0);
  }

  // Kill each process
  for (const pid of pids) {
    console.log(`Killing process with PID ${pid}...`);
    execSync(`kill -9 ${pid}`);
  }

  console.log(
    `Successfully killed ${pids.length} process(es) using port ${port}`
  );
} catch (error) {
  if (error.status === 1) {
    console.log("No process found using this port.");
  } else {
    console.error("Error:", error.message);
  }
}
