import { describe, expect, it } from "vitest";
import { POST } from "./route";

describe("POST /api/analyze", () => {
  it("validates and returns the real whycrash package diagnosis", async () => {
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "TypeError: Cannot read properties of undefined (reading 'map')" }),
    });

    const response = await POST(request);
    const body = await response.json() as { result: { diagnosis: { id: string; confidence: string } | null }; metadata: { engine: string; supported: boolean } };

    expect(response.status).toBe(200);
    expect(body.result.diagnosis?.id).toBe("property-of-undefined");
    expect(body.metadata).toMatchObject({ engine: "whycrash", supported: true });
  });

  it("rejects empty input before calling the engine", async () => {
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ input: "  " }),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: "Paste an error or stack trace first." });
  });
});
