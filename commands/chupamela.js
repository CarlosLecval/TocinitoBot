const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');

const file = new MessageAttachment('./photos/pichi_chupamela.jpeg');

const exampleEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setDescription('Some description here')
    .setImage('attachment://pichi_chupamela.jpeg')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chupamela')
        .setDescription('.'),
    async execute(interaction) {
        exampleEmbed.setDescription(interaction.user.username + ' CHUPAMELA');
        await interaction.reply({ embeds: [exampleEmbed], files: [file] });
    },
};