const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');

const file = new MessageAttachment('./photos/joseram_lewd.jpeg');

const exampleEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setDescription('Some description here')
    .setImage('attachment://joseram_lewd.jpeg')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('lewd')
        .setDescription('.'),
    async execute(interaction) {
        exampleEmbed.setDescription(interaction.user.username + ' está pensando en cosas pervertidas');
        await interaction.reply({ embeds: [exampleEmbed], files: [file] });
    },
};