# Togel Telegram Bot

## Overview
A Telegram bot for togel (lottery) predictions with accurate analysis. The bot uses web scraping, statistical analysis, and pattern recognition to provide predictions.

**Current State**: Project imported and set up in Replit environment.

## Recent Changes
- **2024-11-01**: Initial project import to Replit
  - Installed Node.js 20 runtime
  - Configured workflow for bot execution
  - Set up environment variable requirements

## Project Architecture

### Structure
```
bot/                    - Telegram bot handlers
  keyboards.js          - Bot keyboard layouts
  scheduler.js          - Scheduled tasks
  telegram.js           - Main Telegram bot handler
config/                 - Configuration files
  config.js             - Main configuration
  scraper_config.json   - Web scraper settings
data/                   - Data storage
  admins.json           - Admin user list
  togel_data.json       - Togel prediction data
services/               - Core services
  backtesting.js        - Prediction backtesting
  prediction.js         - Prediction algorithms
  scraper.js            - Web scraping service
  storage.js            - Data storage service
utils/                  - Utility functions
  formulas.js           - Mathematical formulas
  pattern.js            - Pattern recognition
  statistics.js         - Statistical analysis
```

### Key Dependencies
- **node-telegram-bot-api**: Telegram bot integration
- **puppeteer**: Web scraping with headless browser
- **axios**: HTTP requests
- **cheerio**: HTML parsing
- **node-cron**: Scheduled tasks
- **lodash**: Utility functions

## Required Environment Variables
- `TELEGRAM_BOT_TOKEN`: Telegram bot token (required)

## Running the Bot
The bot starts automatically via the configured workflow. It requires a valid Telegram bot token to operate.
