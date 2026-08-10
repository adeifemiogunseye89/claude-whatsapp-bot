// Replace Line 1 with this exact version-locked stable web-server module:
import { serve } from "https://deno.land"

//import { serve } from "https://deno.land"

serve(async (req) => {
  const url = new URL(req.url);

  // 1. HANDLE META WEBHOOK VERIFICATION (GET request)
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    // Fetch the verification password safely from Supabase environment variables
    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("🚀 Webhook verified successfully!");
      // Returns the exact unquoted raw challenge string Meta demands
      return new Response(challenge, {
        status: 200,
        headers: { "Content-Type": "text/plain" },
      });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // 2. HANDLE INCOMING MESSAGES FROM USERS (POST request)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      
      if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
        const message = body.entry[0].changes[0].value.messages[0];
        const userPhoneNumber = message.from;
        const userText = message.text.body;

        // Forward message data to Claude
        const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");
        const response = await fetch("https://anthropic.com", {
          method: "POST",
          headers: {
            "x-api-key": anthropicApiKey!,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-3-5-sonnet-20241022",
            max_tokens: 1000,
            messages: [{ role: "user", content: userText }],
          }),
        });

        const claudeData = await response.json();
        const claudeReply = claudeData.content[0].text;

        // Dispatch response back to WhatsApp
        const phoneId = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID");
        const accessToken = Deno.env.get("WHATSAPP_ACCESS_TOKEN");
        
        await fetch(`https://facebook.com{phoneId}/messages`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: userPhoneNumber,
            type: "text",
            text: { body: claudeReply },
          }),
        });
      }
      return new Response("OK", { status: 200 });
    } catch (err) {
      return new Response(String(err), { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
})
