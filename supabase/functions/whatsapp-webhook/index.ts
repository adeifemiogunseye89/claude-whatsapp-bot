/*Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. HANDLE META WEBHOOK VERIFICATION (GET request)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("🚀 Webhook verified successfully!");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    console.error("❌ Webhook verification failed. Token mismatch.");
    return new Response("Forbidden", { status: 403 });
  }

  // 2. HANDLE INCOMING PAYLOADS FROM META (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();

      if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];

        if (message.type === "text" && message.text?.body) {
          const userPhoneNumber = message.from;
          const userText = message.text.body;

          const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
          const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicApiKey!,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-5",
              max_tokens: 1000,
              messages: [{ role: "user", content: userText }],
            }),
          });

          if (!anthropicResponse.ok) {
            const errorText = await anthropicResponse.text();
            throw new Error(`Anthropic API Error: ${errorText}`);
          }

          const claudeData = await anthropicResponse.json();
          const claudeReply = claudeData.content[0].text;

          const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
          const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

          const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: userPhoneNumber,
              type: "text",
              text: { body: claudeReply },
            }),
          });

          if (!metaResponse.ok) {
            const metaError = await metaResponse.text();
            console.error(`❌ Meta Outbound API Error: ${metaError}`);
          }
        }
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Internal Function Error:", err);
      return new Response(String(err), { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});*/

// supabase/functions/whatsapp-webhook/index.ts

// ---- Rate limiting (simple in-memory, per sender) ----
// Note: this resets if the function instance restarts/cold-starts.
// Good enough as a first line of defense against cost abuse on a small civic bot;
// for stronger guarantees later, move this to a Supabase table instead.
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute window
const RATE_LIMIT_MAX_MESSAGES = 10;  // max messages per sender per window

function isRateLimited(phoneNumber: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(phoneNumber) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  rateLimitMap.set(phoneNumber, recent);
  return recent.length > RATE_LIMIT_MAX_MESSAGES;
}

// ---- Webhook signature verification ----
// Confirms the POST request actually came from Meta, not an imposter.
async function isValidMetaSignature(req: Request, rawBody: string): Promise<boolean> {
  const signatureHeader = req.headers.get("x-hub-signature-256");
  const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
  if (!signatureHeader || !appSecret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const expectedSignature =
    "sha256=" +
    Array.from(new Uint8Array(mac))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

  return expectedSignature === signatureHeader;
}

Deno.serve(async (req) => {
  const url = new URL(req.url);

  // 1. HANDLE META WEBHOOK VERIFICATION (GET request)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("🚀 Webhook verified successfully!");
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    console.error("❌ Webhook verification failed. Token mismatch.");
    return new Response("Forbidden", { status: 403 });
  }

  // 2. HANDLE INCOMING PAYLOADS FROM META (POST request)
  if (req.method === "POST") {
    try {
      // Read the raw body FIRST — signature must be checked against raw bytes,
      // not the parsed JSON.
      const rawBody = await req.text();

      const validSignature = await isValidMetaSignature(req, rawBody);
      if (!validSignature) {
        console.error("❌ Invalid webhook signature. Rejecting request.");
        return new Response("Forbidden", { status: 403 });
      }

      const body = JSON.parse(rawBody);

      if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];

        if (message.type === "text" && message.text?.body) {
          const userPhoneNumber = message.from;
          const userText = message.text.body;

          // Rate limit check
          if (isRateLimited(userPhoneNumber)) {
            console.warn(`⚠️ Rate limit hit for ${userPhoneNumber}`);
            return new Response("OK", { status: 200 }); // silently drop, still 200 to Meta
          }

          const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
          const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "x-api-key": anthropicApiKey!,
              "anthropic-version": "2023-06-01",
              "content-type": "application/json",
            },
            body: JSON.stringify({
              model: "claude-sonnet-5",
              max_tokens: 1000,
              messages: [{ role: "user", content: userText }],
            }),
          });

          if (!anthropicResponse.ok) {
            const errorText = await anthropicResponse.text();
            throw new Error(`Anthropic API Error: ${errorText}`);
          }

          const claudeData = await anthropicResponse.json();
          const claudeReply = claudeData.content[0].text;

          const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
          const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");

          const metaResponse = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              messaging_product: "whatsapp",
              recipient_type: "individual",
              to: userPhoneNumber,
              type: "text",
              text: { body: claudeReply },
            }),
          });

          if (!metaResponse.ok) {
            const metaError = await metaResponse.text();
            console.error(`❌ Meta Outbound API Error: ${metaError}`);
          }
        }
      }

      return new Response("OK", { status: 200 });
    } catch (err) {
      console.error("Internal Function Error:", err);
      return new Response(String(err), { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});