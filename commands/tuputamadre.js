const { SlashCommandBuilder } = require('@discordjs/builders');
const { MessageAttachment, MessageEmbed } = require('discord.js');

const file = new MessageAttachment('./photos/joseram_traje.jpeg');

const exampleEmbed = new MessageEmbed()
    .setColor('#0099ff')
    .setDescription('Some description here')
    .setImage('attachment://joseram_traje.jpeg')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tuputamadre')
        .setDescription('.'),
    async execute(interaction) {
        exampleEmbed.setDescription(interaction.user.username + ' YA CABRÓN HARTAS TODO EL TIEMPO QUÉ QUÉ QUÉ');
        await interaction.reply({ embeds: [exampleEmbed], files: [file] });
    },
};