require('dotenv').config();
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

const forbiddenWords = ['хуй', 'пизда'];

client.once('ready', () => {
    console.log(`✅ Бот запущено як ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (forbiddenWords.some(word => message.content.toLowerCase().replace(/\s/g, '').trim().includes(word))) {
        message.delete();
        await message.author.send(`${message.author}, твій меседж містить заборонене слово! 🚫`);
        return;
    }

    if (message.content.toLowerCase() === 'привіт') {
        message.reply('Привіт! 👋');
    }
});

client.login(process.env.TOKEN);
