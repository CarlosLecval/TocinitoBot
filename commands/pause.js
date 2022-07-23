const {
    SlashCommandBuilder,
    bold,
    italic,
    strikethrough,
    underscore,
    spoiler,
    quote,
    blockQuote,
    hyperlink
} = require('@discordjs/builders');
const {
    AudioPlayerStatus,
    StreamType,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnection,
    getVoiceConnection,
} = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { Playlist, playlistMap } = require('../playlist');
const { send } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pause')
        .setDescription('Pausa canción'),
    async execute(interaction, args, slash) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No estás en un canal de voz')
            send(interaction, embed, slash);
            return;
        }

        const con = getVoiceConnection(interaction.guild.id);
        let output = isPlaying(con);
        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription(output)
        send(interaction, embed, slash);
    },
};

function isPlaying(con) {
    if (!con) {
        return 'Tocinito no está en un canal de voz';
    }
    if (con.state.subscription?.player?.state?.status != 'playing') {
        return "Tocinito no está reproduciendo nada";
    }
    con.state.subscription.player.pause();
    return "Canción pausada";
}