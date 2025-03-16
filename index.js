require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

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

client.on('messageCreate', message => {
    if (message.author.bot) return;

    if (forbiddenWords.some(word => message.content.toLowerCase().replace(/\s/g, '').trim().includes(word))) {
        message.delete().catch(console.error);
        message.channel.send(`${message.author}, твій меседж містить заборонене слово! 🚫`);
        return;
    }

    if (message.content.toLowerCase() === 'привіт') {
        message.reply('Привіт! 👋');
    }
});

client.login(process.env.TOKEN);
