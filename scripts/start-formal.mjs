import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

process.stdout.write("Waiting for DEEPSEEK_API_KEY on stdin...\n");

const supportsRawInput = typeof process.stdin.setRawMode === "function";
if (supportsRawInput) process.stdin.setRawMode(true);

const reader = createInterface({
  input: process.stdin,
  terminal: false,
});

const apiKey = await new Promise((resolve) => {
  reader.once("line", resolve);
});
reader.close();
if (supportsRawInput) process.stdin.setRawMode(false);

if (typeof apiKey !== "string" || !apiKey.trim().startsWith("sk-") || apiKey.trim().length < 20) {
  process.stderr.write("A valid DeepSeek API key is required.\n");
  process.exit(1);
}

const nextProcess = spawn(process.execPath, ["node_modules/next/dist/bin/next", "dev"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    DEEPSEEK_API_KEY: apiKey.trim(),
    DOMEL_DEMO_MODE: "false",
  },
  stdio: ["inherit", "inherit", "inherit"],
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => nextProcess.kill(signal));
}

nextProcess.once("exit", (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});
