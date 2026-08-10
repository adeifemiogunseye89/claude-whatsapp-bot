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
});