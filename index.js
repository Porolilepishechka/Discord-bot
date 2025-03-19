require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits, MessageFlags } = require('discord.js');

let forbiddenWords = [];

try {
    const data = fs.readFileSync('forbidden.txt', 'utf-8');
    forbiddenWords = data.split(',').map(word => word.trim().replace(/\s/g, '').toLowerCase());
    console.log(forbiddenWords);
    console.log('слова зчитано');
} catch (error) {
    console.log('ти даун:', error);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once('ready', () => {
    console.log(`✅ Бот запущено як ${client.user.tag}`);
});

client.on('messageCreate', async message => {
    if (message.author.bot) return;

    if (forbiddenWords.some(word => message.content.toLowerCase().replace(/\s/g, '').trim().includes(word))) {
        message.delete();
        await message.author.send(`${message.author}, твій меседж містить заборонене слово!\nmessage: **${message.content}**\nБудь уважним наступного разу.`);
        return;
    }

    if (message.content.toLowerCase() === 'привіт') {
        message.reply('Привіт! 👋');
    }
});

client.login(process.env.TOKEN);
