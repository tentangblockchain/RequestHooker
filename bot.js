#!/usr/bin/env node

require('dotenv').config();
const TelegramBotHandler = require('./bot/telegram');

const token = process.env.TELEGRAM_BOT_TOKEN;

if (!token) {
  console.error('❌ TELEGRAM_BOT_TOKEN tidak ditemukan!');
  console.error('Silakan set environment variable TELEGRAM_BOT_TOKEN');
  process.exit(1);
}

const bot = new TelegramBotHandler(token);
bot.start();

process.on('SIGINT', () => {
  console.log('\n👋 Stopping bot...');
  bot.stop();
  process.exit(0);
});
