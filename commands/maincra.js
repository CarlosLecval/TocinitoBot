const { SlashCommandBuilder } = require('@discordjs/builders');
var flag = require('../index.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maincra')
        .setDescription('Checa el status del servidor'),
    async execute(interaction) {
        const res = await fetch('http://crujoserver.duckdns.org:3000/api/maincra', { method: 'GET' })
        if (res.ok) {
            let data = await res.json();
            var encendido = data.encendido;
        }
        await interaction.reply(encendido ? 'El servidor está online' : 'El servidor está offline');
    },
};