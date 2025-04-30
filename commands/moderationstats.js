const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./warnings.db');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warnstats')
    .setDescription('Показати статистику по Попередженнях та мютах'),

  async execute(interaction) {
    db.all('SELECT user_id, type FROM logs', async (err, rows) => {
      if (err) return interaction.reply({ content: '❌ Помилка бази даних.', ephemeral: true });
      if (rows.length === 0) return interaction.reply({ content: '✅ Немає жодних записів.', ephemeral: true });

      const stats = {};
      rows.forEach(({ user_id, type }) => {
        if (!stats[user_id]) stats[user_id] = { warn: 0, mute: 0 };
        stats[user_id][type]++;
      });

      const entries = await Promise.all(
        Object.entries(stats).map(async ([id, counts]) => {
          const user = await interaction.client.users.fetch(id).catch(() => null);
          const tag = user?.tag || Unknown (id);
          return ` **${tag}** — ${counts.warn} Попереджень(ня), ${counts.mute} мют(и)`;
        })
      );

      const embed = new EmbedBuilder()
        .setTitle('📊 Загальна модераційна статистика')
        .setDescription(entries.join('\n'))
        .setColor(0x00bfff);

      await interaction.reply({ embeds: [embed], ephemeral: true });
    });
  }
};