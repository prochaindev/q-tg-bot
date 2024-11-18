const express = require("express");
const { Telegraf, Markup } = require("telegraf");
const BeeQueue = require("bee-queue");
require('dotenv').config()

// Initialize bot and queue
const bot = new Telegraf(process.env.BOT_TOKEN);
const queue = new BeeQueue("telegram-queue", {
  removeOnSuccess: true, // Automatically remove successful jobs from the queue
});

// Middleware for Express
const app = express();
app.use(express.json());

// Webhook setup
const WEBHOOK_PATH = "/telegram-webhook";
const WEBHOOK_URL = `https://your-domain.com${WEBHOOK_PATH}`;
bot.telegram.setWebhook(WEBHOOK_URL);

// BeeQueue processing with rate limiting
queue.process(async (job) => {
    const { ctx, message, keyboard } = job.data;
  
    try {
      await ctx.reply(message, keyboard);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  
    // Rate limiting: wait for 200ms (1000ms / 5 users = 200ms per reply)
    await new Promise((resolve) => setTimeout(resolve, 200));
  });
  

// Function to add messages to the queue
const addToQueue = (ctx, message, keyboard) => {
  queue.createJob({ ctx, message, keyboard }).save();
};

// Define the bot logic
bot.start((ctx) => {
  if (["group", "supergroup"].includes(ctx.chat.type)) {
    return;
  }

  const welcomeMessage = `Hi @${ctx.from.first_name}, Welcome to the Rats Kingdom!

  ✅ Earn $RATS based on the age of your Telegram account. 

  ✅ Complete tasks and invite friends to maximize your earnings.`;

  const inlineKeyboard = Markup.inlineKeyboard([
    [Markup.button.url("Open App", "http://t.me/RatsKingdom_Bot/join")],
    [Markup.button.url("Join Telegram", "http://t.me/The_RatsKingdom")],
    [Markup.button.url("Follow X", "https://x.com/The_RatsKingdom")],
    [Markup.button.url("Subscribe YouTube", "https://youtube.com/@the_ratskingdom?feature=shared")],
  ]);

  addToQueue(ctx, welcomeMessage, inlineKeyboard); // Add response to the queue
});

// Webhook route
app.post(WEBHOOK_PATH, (req, res) => {
  try {
    bot.handleUpdate(req.body); // Handle updates
    res.status(200).send("OK");
  } catch (error) {
    console.error("Error processing webhook:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Webhook set up at ${WEBHOOK_URL}`);
});
