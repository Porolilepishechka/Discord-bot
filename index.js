require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');

let forbiddenWords = [];
let orgForbiddenWords = [];

try {
    const data = fs.readFileSync('forbidden.txt', 'utf-8');
    forbiddenWords = data.split(',').map(word => word.trim().replace(/\s/g, '').toLowerCase());
    orgForbiddenWords = data.split(',').map(word => word.trim());
    console.log(orgForbiddenWords);
    console.log('слова зчитано');
} catch (error) {
    console.log('ти даун:', error);
}

async function WriteToFile(content) {
    fs.appendFile('log.txt', content, err => {
        if (err) {
            console.error(err);
        } else {
            console.log("text has been writed")
        }
    });
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

    const messageContent = message.content.toLowerCase().replace(/\s/g, '').trim();

    const triggeredWord = forbiddenWords.find(word => messageContent.includes(word));

    const logChannel = message.guild.channels.cache.find(channel => 
        channel.name.toLowerCase() === 'karatel-logs' && channel.isTextBased()
    );

    if (triggeredWord) {
        const originalWord = orgForbiddenWords.find(w => w.toLowerCase().replace(/\s/g, '') === triggeredWord);
        
        await message.delete();
        console.log(`Виявлено заборонене слово: ${originalWord}`);
        if (message.author.tag.length != 0) {
            const content = `user {${message.author.tag}}\n`
            WriteToFile(content);
        }

        try {
            await message.author.send(
                `🚫 Твій меседж містив заборонене слово: **${originalWord}**\nПовідомлення: "${message.content}"\nБудь уважним наступного разу.`
            );
        } catch (err) {
            console.log('Не вдалось відправити DM:', err);
        }

        const muteRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
        const AdminRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === '★bot assistant★');
        if (muteRole) {
            try {
                await message.member.roles.add(muteRole);
                if (logChannel) {
                    logChannel.send(
                        `${AdminRole}\n🔇 Користувач **${message.author.tag}** був зам'ючений за використання забороненого слова: **${originalWord}**\nПовідомлення: "${message.content}"\nЧас: <t:${Math.floor(Date.now() / 1000)}:F>`
                    );
                } else {
                    console.log('Канал logs не знайдено.');
                }

            } catch (err) {
                console.log('Не вдалось видати мут:', err);
            }
        } else {
            console.log('Роль Muted не знайдена на сервері.');
        }

        return;
    }
});

client.login(process.env.TOKEN);
