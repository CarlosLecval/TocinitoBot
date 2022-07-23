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
const play = require('./play');
const { send } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Lista de canciones'),
    async execute(interaction, args, slash) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            // let embed = new MessageEmbed()
            //     .setColor('#de3826')
            //     .setDescription('No estás en un canal de voz')
            await interaction.reply('No estás en un canal de voz');
            return;
        }

        const playlist = playlistMap.get(interaction.guild.id);

        if(!playlist)
        {
            await interaction.reply('No hay nada en la lista de reproducción');
            return;
        }
        var output = "";
        var temp = playlist.head
        while(temp != null) {
            output += `- ${temp.title}\n`;
            temp = temp.next;
        }
        await interaction.reply(output != "" ? output : "No hay nada en la lista de reproducción");
    },
};