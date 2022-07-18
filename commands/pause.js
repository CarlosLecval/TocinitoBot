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
        if (con) {
            if (con.state.subscription && con.state.subscription.player.state.status == 'playing')
            {
                con.state.subscription.player.pause();
                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('Canción pausada')
                send(interaction, embed, slash);
            }
            else {
                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('Tocinito no está reproduciendo nada')
                send(interaction, embed, slash);
            }
        }
        else
        {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('Tocinito no está en un canal de voz')
            send(interaction, embed, slash);
        }
    },
};