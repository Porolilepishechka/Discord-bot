require('dotenv').config();
const fs = require('fs');
const { Client, GatewayIntentBits } = require('discord.js');

let forbiddenWords = [];
let orgForbiddenWords = [];

let warnWords = [];
let orgwarnWords = [];
const path = require('path');

try {
    const dataFB = fs.readFileSync(path.join(__dirname, 'forbidden.txt'), 'utf-8');
    forbiddenWords = dataFB.split(',').map(word => word.trim().replace(/\s/g, '').toLowerCase());
    orgForbiddenWords = dataFB.split(',').map(word => word.trim());
    console.log("dataFB: " ,orgForbiddenWords);
    console.log('слова зчитано');
} catch (error) {
    console.log('Файл forbidden.txt не знайдено. Список заборонених слів буде порожній.', error);
}

try {
    const dataWW = fs.readFileSync(path.join(__dirname, 'warnWords.txt'), 'utf-8');
    warnWords = dataWW.split(',').map(word => word.trim().replace(/\s/g, '').toLowerCase());
    orgwarnWords = dataWW.split(',').map(word => word.trim());
    console.log("dataWW: " ,orgwarnWords);
    console.log('слова зчитано');
} catch (error) {
    console.log('Файл warnWords.txt не знайдено. Список заборонених слів буде порожній.', error);
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

    const cleanMessage = message.content
        .toLowerCase()
        .replace(/[.,!?;:()"'«»\-]/g, '')
        .replace(/\s+/g, ' ')
        .trim();

    const wordsInMessage = cleanMessage.split(' ');

    if (!wordsInMessage) return;

    const triggeredForbiddenWords = forbiddenWords.find(word => wordsInMessage.includes(word));
    const triggeredWarnWords = warnWords.find(word => wordsInMessage.includes(word));

    const logChannel = message.guild.channels.cache.find(channel => 
        channel.name.toLowerCase() === 'karatel-logs' && channel.isTextBased()
    );

    if (triggeredWarnWords) {
        const originalWord = orgwarnWords.find(w => w.toLowerCase().replace(/\s/g, '') === triggeredWarnWords);
        const AdminRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === '★bot assistant★');

        await message.delete();
        console.log(`Виявлено заборонене слово: ${originalWord}`);
        if (message.author.tag.length != 0) {
            const content = `user {${message.author.tag}}\n`
            WriteToFile(content);
        }

        try {
            await message.author.send(
                `🚫 Твій меседж містив заборонене слово: **${originalWord}**\nПовідомлення: "${message.content}"\nЦе тільки варн тому будь уважним наступного разу.`
            );
        } catch (err) {
            console.log('Не вдалось відправити DM:', err);
        }

        if (logChannel) {
            logChannel.send(
                `${AdminRole}\n Користувачу **${message.author.tag}** був виданний варн за використання забороненого слова: **${originalWord}**\nПовідомлення: "${message.content}"\nЧас: <t:${Math.floor(Date.now() / 1000)}:F>`
            );
        } else {
            console.log('Канал logs не знайдено.');
        }
    }

    if (triggeredForbiddenWords) {
        const originalWord = orgForbiddenWords.find(w => w.toLowerCase().replace(/\s/g, '') === triggeredForbiddenWords);
        
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
