import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("formal launcher", () => {
  it("reads the DeepSeek key from stdin without placing it in command arguments", () => {
    const source = readFileSync(new URL("../scripts/start-formal.mjs", import.meta.url), "utf8");
    expect(source).toContain("createInterface");
    expect(source).toContain("process.stdin.setRawMode");
    expect(source).toContain("DEEPSEEK_API_KEY: apiKey.trim()");
    expect(source).not.toContain("process.argv");
  });
});
