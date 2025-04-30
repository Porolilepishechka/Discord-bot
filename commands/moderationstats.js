const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./warnings.db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnstats')
    .setDescription('Показати статистику по Попередженнях та мютах'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    db.all('SELECT user_id, type FROM logs', async (err, rows) => {
      if (err) {
        return interaction.editReply({ content: '❌ Помилка бази даних.' });
      }

      if (rows.length === 0) {
        return interaction.editReply({ content: '✅ Немає жодних записів.' });
      }

      const stats = {};
      rows.forEach(({ user_id, type }) => {
        if (!stats[user_id]) {
          stats[user_id] = { warn: 0, mute: 0 };
        }
        if (type === 'warn' || type === 'mute') {
          stats[user_id][type]++;
        }
      });

      const entries = await Promise.all(
        Object.entries(stats).map(async ([id, counts]) => {
          const user = await interaction.client.users.fetch(id).catch(() => null);
          const tag = user?.tag || `Unknown (${id})`;
          return `**${tag}** — ${counts.warn} попереджень(ня), ${counts.mute} мют(и)`;
        })
      );

      const embed = new EmbedBuilder()
        .setTitle('📊 Модераційна статистика')
        .setDescription(entries.join('\n'))
        .setColor(0x00bfff)

      await interaction.editReply({ embeds: [embed] });
    });
  },
};