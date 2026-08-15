/*import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
// To this correct version:
import Anthropic from '@anthropic-ai/sdk'; 


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});*/

// 1. WHATSAPP WEBHOOK VERIFICATION (Required by Meta to link your server)
// 1. WHATSAPP WEBHOOK VERIFICATION (Strict plain text validation)

// 1. WHATSAPP WEBHOOK VERIFICATION (Adaptive Parameter Extraction)
/*app.get('/webhook', (req, res) => {
  // Destructure query attributes cleanly
  const mode = req.query['hub.mode'] || req.query?.hub?.mode;
  const token = req.query['hub.verify_token'] || req.query?.hub?.verify_token;
  const challenge = req.query['hub.challenge'] || req.query?.hub?.challenge;

  console.log('--- Incoming Webhook Verification Attempt ---');
  console.log('Extracted Mode:', mode);
  console.log('Extracted Token:', token);
  console.log('Expected Token from Env:', process.env.WHATSAPP_VERIFY_TOKEN);
  console.log('Extracted Challenge:', challenge);

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('🚀 Verification match successful!');
    res.setHeader('Content-Type', 'text/plain');
    return res.status(200).send(challenge);
  } else {
    console.log('❌ Handshake failed: Token mismatch or invalid structure.');
    return res.sendStatus(403);
  }
});*/

// 2. RECEIVE WHATSAPP MESSAGES & REPLY WITH CLAUDE
/*app.post('/webhook', async (req, res) => {
  try {
    const body = req.body;

    // Check if the incoming webhook is a standard text message from a user
    if (body.object && body.entry?.[0]?.changes?.[0]?.value?.messages?.[0]) {
      const message = body.entry[0].changes[0].value.messages[0];
      const userPhoneNumber = message.from; 
      const userText = message.text.body;

      console.log(`Received message from ${userPhoneNumber}: ${userText}`);

      // Forward user text to Claude API
      const msg = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1000,
        messages: [{ role: "user", content: userText }],
      });

      const claudeReply = msg.content[0].text;

      // Send Claude's response back to WhatsApp via Meta API
      await sendWhatsAppMessage(userPhoneNumber, claudeReply);
    }

    res.sendStatus(200); // Always tell WhatsApp you received the webhook safely
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.sendStatus(500);
  }
});

// Helper Function to post data back to Meta's WhatsApp servers
async function sendWhatsAppMessage(recipient, text) {
  const url = `https://facebook.com{process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
  
  await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: recipient,
      type: "text",
      text: { body: text }
    })
  });
}

const PORT = process.env.PORT || 3000;
export default app;*/

//app.listen(PORT, () => console.log(`Server globally listening on port ${PORT}`));
