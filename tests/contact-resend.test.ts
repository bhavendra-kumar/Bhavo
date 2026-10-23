import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { POST } from "../src/app/api/contact/route";

describe("Contact Form Resend Integration", () => {
  it("validates that required fields (firstName, email, message) are enforced", async () => {
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "",
        email: "test@example.com",
        message: "Hello world",
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /First name, email, and message are required/i);
  });

  it("validates email format strictly", async () => {
    const req = new Request("http://localhost:3000/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: "Aarav",
        email: "not-an-email",
        message: "This is a legitimate message enquiry.",
      }),
    });

    const res = await POST(req);
    assert.equal(res.status, 400);
    const data = await res.json();
    assert.match(data.error, /valid email address/i);
  });

  it("successfully calls Resend API and delivers email to bhavendrakumar007@gmail.com when RESEND_API_KEY is present", async () => {
    const originalApiKey = process.env.RESEND_API_KEY;
    const originalFetch = globalThis.fetch;
    process.env.RESEND_API_KEY = "re_mock_test_key_12345";

    interface InterceptedRequest {
      url: string;
      headers?: HeadersInit;
      body: {
        to: string[];
        reply_to?: string;
        replyTo?: string;
        subject: string;
        html: string;
      };
    }

    let interceptedRequest: InterceptedRequest | null = null;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      if (url.includes("api.resend.com/emails")) {
        interceptedRequest = {
          url,
          headers: init?.headers,
          body: init?.body ? JSON.parse(init.body as string) : null,
        };
        return new Response(JSON.stringify({ id: "resend_msg_test_abc123" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return originalFetch(input, init);
    };

    try {
      const req = new Request("http://localhost:3000/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "10.0.0.42",
        },
        body: JSON.stringify({
          firstName: "Bhavendra",
          lastName: "Kumar",
          email: "rider@example.com",
          phone: "+91 9999999999",
          subject: "Pet Travel",
          message: "Can I bring my golden retriever on an airport trip?",
        }),
      });

      const res = await POST(req);
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.provider, "resend");

      assert.ok(interceptedRequest as unknown, "Resend HTTP API endpoint should have been called");
      const captured = interceptedRequest as unknown as InterceptedRequest;
      assert.equal(captured.url, "https://api.resend.com/emails");

      const resendBody = captured.body;
      assert.deepEqual(resendBody.to, ["bhavendrakumar007@gmail.com"]);
      assert.equal(resendBody.reply_to, "rider@example.com");
      assert.match(resendBody.subject, /\[BHAVO Contact\] Pet Travel - Bhavendra Kumar/);
      assert.match(resendBody.html, /rider@example.com/);
      assert.match(resendBody.html, /bhavendrakumar007@gmail.com/);
      assert.match(resendBody.html, /Can I bring my golden retriever/);
    } finally {
      globalThis.fetch = originalFetch;
      process.env.RESEND_API_KEY = originalApiKey;
    }
  });
});
