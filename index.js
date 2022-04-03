const TelegramApi = require('node-telegram-bot-api');
// options
const { gameOptions, againOptions } = require('./options');
// db
const sequelize = require('./db.js');
// models
const UserModel = require('./models');

const token = process.env.TOKEN;
const bot = new TelegramApi(token, { polling: true });

const chats = {};

const startGame = async (chatId) => {
  await bot.sendMessage(
    chatId,
    `Now I will think of a number from 0 to 9, and you have to guess it!`
  );

  const randomNum = Math.floor(Math.random() * 10);
  chats[chatId] = randomNum;

  await bot.sendMessage(chatId, 'Guess', gameOptions);
};

(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
  } catch (e) {
    console.log('Database NOT connected');
  }

  bot.setMyCommands([
    { command: '/start', description: 'Initial greeting' },
    { command: '/game', description: 'Guess the number game' },
    { command: '/info', description: 'Game history' },
  ]);

  bot.on('message', async (msg) => {
    const text = msg.text;
    const chatId = msg.chat.id;

    try {
      if (text === '/start') {
        const user = await UserModel.findOne({ chatId });

        if (!user) {
          await UserModel.create({ chatId });
        }

        await bot.sendSticker(
          chatId,
          'https://tlgrm.ru/_/stickers/ccd/a8d/ccda8d5d-d492-4393-8bb7-e33f77c24907/1.jpg'
        );

        return bot.sendMessage(chatId, `Welcome to tg bot`);
      }

      if (text === '/game') {
        return startGame(chatId);
      }

      if (text === '/info') {
        const user = await UserModel.findOne({ chatId });
        return bot.sendMessage(
          chatId,
          `Amount of guessed numbers: ${user.right}, incorrect: ${user.wrong}`
        );
      }

      return bot.sendMessage(chatId, 'I don"t understand you. Try again!)');
    } catch (e) {
      return bot.sendMessage(chatId, 'Something went wrong)');
    }
  });

  bot.on('callback_query', async (msg) => {
    const data = msg.data;
    const chatId = msg.message.chat.id;

    if (data === '/again') {
      return startGame(chatId);
    }

    const user = await UserModel.findOne({ chatId });

    if (data == chats[chatId]) {
      user.right += 1;

      await bot.sendMessage(
        chatId,
        `Congrats, you guessed the number ${chats[chatId]}`,
        againOptions
      );
    } else {
      user.wrong += 1;

      await bot.sendMessage(
        chatId,
        `Unfortunately you didn't guess, the bot guessed the number ${chats[chatId]}`,
        againOptions
      );
    }

    await user.save();
  });
})();
