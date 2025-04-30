require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, Partials, Events } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const { REST, Routes } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

client.commands = new Collection();

const commands = [];
const commandFiles = [ 'moderationstats.js'];

for (const file of commandFiles) {
  const command = require(`./commands/${file}`);
  client.commands.set(command.data.name, command);
  commands.push(command.data.toJSON());
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);
rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: commands })
  .then(() => console.log('✅ Команди зареєстровано!'))
  .catch(console.error);

const db = new sqlite3.Database('./warnings.db');
db.run(`CREATE TABLE IF NOT EXISTS logs (
  user_id TEXT,
  type TEXT,
  reason TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);`);

let forbiddenWords = [], orgForbiddenWords = [];
let warnWords = [], orgwarnWords = [];

try {
  const dataFB = fs.readFileSync(path.join(__dirname, 'forbidden.txt'), 'utf-8');
  forbiddenWords = dataFB.split(',').map(w => w.trim().toLowerCase().replace(/\s/g, ''));
  orgForbiddenWords = dataFB.split(',').map(w => w.trim());
} catch (error) {
  console.log('Файл forbidden.txt не знайдено.');
}

try {
  const dataWW = fs.readFileSync(path.join(__dirname, 'warnWords.txt'), 'utf-8');
  warnWords = dataWW.split(',').map(w => w.trim().toLowerCase().replace(/\s/g, ''));
  orgwarnWords = dataWW.split(',').map(w => w.trim());
} catch (error) {
  console.log('Файл warnWords.txt не знайдено.');
}

client.once('ready', () => {
  console.log(`🤖 Бот активний як ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const cleanMessage = message.content
    .toLowerCase()
    .replace(/[.,!?;:()"'«»\-]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  const wordsInMessage = cleanMessage.split(' ');
  const triggeredForbidden = forbiddenWords.find(word => wordsInMessage.includes(word));
  const triggeredWarn = warnWords.find(word => wordsInMessage.includes(word));

  const logChannel = message.guild.channels.cache.find(c =>
    c.name.toLowerCase() === 'karatel-logs' && c.isTextBased()
  );
  

  if (triggeredWarn) {
    const original = orgwarnWords.find(w => w.toLowerCase().replace(/\s/g, '') === triggeredWarn);
    await message.delete();

    db.run('INSERT INTO logs (user_id, type, reason) VALUES (?, ?, ?)', [
      message.author.id, 'warn', original
    ]);

    await message.author.send(
      `⚠️ Попередження за слово: **${original}**\n"${message.content}"`
    ).catch(() => console.log('Не вдалося надіслати DM'));

    if (logChannel) {
      logChannel.send(`🔔 **${message.author.tag}** отримав попередження за слово: **${original}**`);
    }
    return;
  }

  if (triggeredForbidden) {
    const original = orgForbiddenWords.find(w => w.toLowerCase().replace(/\s/g, '') === triggeredForbidden);
    await message.delete();

    db.run('INSERT INTO logs (user_id, type, reason) VALUES (?, ?, ?)', [
      message.author.id, 'mute', original
    ]);

    await message.author.send(
      `🔇 Ви були зам'ючені за слово: **${original}**\n"${message.content}"`
    ).catch(() => console.log('Не вдалося надіслати DM'));

    const muteRole = message.guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
    if (muteRole) {
      try {
        await message.member.roles.add(muteRole);
        if (logChannel) {
          logChannel.send(`🔇 **${message.author.tag}** зам'ючений за слово: **${original}**`);
        }
      } catch (err) {
        console.log('Помилка видачі мюту:', err);
      }
    }

    return;
  }
});

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);
    await interaction.reply({ content: '❌ Помилка при виконанні команди.', ephemeral: true });
  }
});

client.login(process.env.TOKEN);
