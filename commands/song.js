const {
    SlashCommandBuilder,
    bold,
    italic,
    strikethrough,
    underscore,
    spoiler,
    quote,
    blockQuote,
    hyperlink,
    inlineCode
} = require('@discordjs/builders');
const { MessageEmbed } = require('discord.js');
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
const play = require('./play');
const { send, getTimeString } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('song')
        .setDescription('Información de canción actual'),
    async execute(interaction, args, slash) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No estás en un canal de voz')
            send(interaction, embed, slash);
            return;
        }

        const playlist = playlistMap.get(interaction.guild.id);
        const con = getVoiceConnection(interaction.guild.id);

        if (!playlist || (playlist.head == null && playlist.playing == null) || (con?.state?.subscription?.player?.state?.status != 'playing' && con?.state?.subscription?.player?.state?.status != 'paused')) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No hay nada sonando')
            send(interaction, embed, slash);
            return;
        }

        var playback = con.state.subscription?.player?.state?.playbackDuration;
        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Ahora suena")
            .setDescription(`${hyperlink(playlist.playing.title, playlist.playing.url)} - ${inlineCode(`[${getTimeString(playback)}/${getTimeString(playlist.playing.duration)}]`)}`)
        ;
        send(interaction, embed, slash);
    },
};