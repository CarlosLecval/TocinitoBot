const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    AudioPlayerStatus,
    StreamType,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnection,
    getVoiceConnection,
} = require('@discordjs/voice');
const { Playlist, playlistMap } = require('../playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausa canción'),
    async execute(interaction, args) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('No estás en un canal de voz');
            return;
        }

        const con = getVoiceConnection(interaction.guild.id);
        if (con) {
            if (con.state.subscription.player.state.status == 'playing')
            {
                con.state.subscription.player.pause();
                await interaction.reply('Canción pausada');
            }
            else {
                await interaction.reply('No hay nada reproduciendo');
            }
        }
        else
        {
            await interaction.reply('tocinitobot no está en un canal de voz');
        }
    },
};