const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maincraserver')
        .setDescription('Prende o apaga el servidor'),
    async execute(interaction) {
        const res = await fetch('http://crujoserver.duckdns.org:3000/api/maincra', {method: 'POST'})
        if (res.ok) {
            let data = await res.json();
            var encendido = data.encendido;
        }
        var reply = '';
        switch (encendido) {
            case 0:
                reply = 'El servidor tardará en iniciar';
                break;
            case 1:
                reply = 'El servidor se está iniciando';
                break;
            case 2:
                reply = 'Servidor cerrandose';
                break;
        }
        await interaction.reply(reply);
    },
};