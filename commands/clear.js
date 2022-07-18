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
        .setName('clear')
        .setDescription('Limpia la lista de reproducción'),
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
        if (con) {
            try {
                playlist.clear();
                con.state.subscription.player.stop();
            }
            catch (error) {}
            let embed = new MessageEmbed()
            .setColor('#26de41')
            .setDescription('Lista de reproducción limpia')
            send(interaction, embed, slash);
        }
        else {
            let embed = new MessageEmbed()
            .setColor('#de3826')
            .setDescription('Tocinito no está en un canal de voz')
            send(interaction, embed, slash);
        }
    },
};