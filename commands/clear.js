const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
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
        .setName('clear')
        .setDescription('Limpia la lista de reproducción'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('No estás en un canal de voz');
            return;
        }

        const playlist = playlistMap.get(interaction.guild.id);
        const con = getVoiceConnection(interaction.guild.id);
        if (con) {
            if (playlist && playlist.head != null) {
                playlist.clear();
                con.state.subscription.player.stop();
                await interaction.reply('Lista de reproducción limpia');
            }
            else if (con.state.subscription.player.state.status == 'playing') {
                con.state.subscription.player.stop();
                await interaction.reply('Lista de reproducción limpia');
            }
            else {
                await interaction.reply('No hay nada en la lista de reproducción');
            }
        }
        else {
            await interaction.reply('tocinitobot no está en un canal de voz');
        }
    },
};