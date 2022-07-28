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
const { getTimeString } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('queue')
        .setDescription('Lista de canciones'),
    async execute(interaction, args, slash) {
        if (slash) await interaction.deferReply();
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No estás en un canal de voz')
            send(interaction, embed, slash);
            return;
        }
        
        const playlist = playlistMap.get(interaction.guild.id);
        
        if(!playlist || (playlist.head == null && playlist.playing == null))
        {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No hay nada en la lista de reproducción')
            send(interaction, embed, slash);
            return;
        }

        const con = getVoiceConnection(interaction.guild.id);
        var playback = con.state.subscription?.player?.state?.playbackDuration;
        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setTitle("Ahora suena")
            .setDescription(`${hyperlink(playlist.playing.title, playlist.playing.url)} - ${inlineCode(`[${getTimeString(playback)}/${getTimeString(playlist.playing.duration)}]`)}`)
        ;
        var output = "";
        var temp = playlist.head
        while(temp != null) {
            output += `- ${hyperlink(temp.title, temp.url) } - ${inlineCode(`[${getTimeString(temp.duration)}]`)}\n`;
            temp = temp.next; 
        }
        if (output != "") embed.addFields({ name: 'Canciones en cola', value: output });
        send(interaction, embed, slash);
    },
};

const send = (interaction, embed, slash) => {
    if (slash) {
        interaction.editReply({ embeds: [embed] });
        return false;
    }
    interaction.channel.send({ embeds: [embed] });
    return false;
}