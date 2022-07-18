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
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    getVoiceConnection,
} = require('@discordjs/voice');
const play = require('play-dl');
const { Playlist, playlistMap } = require('../playlist');
const { MessageEmbed } = require('discord.js');
const { send } = require('../utils');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('next')
        .setDescription('Siguiente canción'),
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

        const getNextResource = async () => {
            var current = playlist.pop();
            let stream = await play.stream(current.url);
            const resource = createAudioResource(stream.stream, { inputType: stream.type });
            return {
                resource: resource,
                title: current.title,
                thumbnail: current.thumbnail,
                url: current.url
            };
        }

        if(playlist && playlist.head != null)
        {
            const con = getVoiceConnection(interaction.guild.id);
    
            if (!con) {
                let connection = joinVoiceChannel({
                    channelId: voiceChannel.id,
                    guildId: interaction.guild.id,
                    adapterCreator: interaction.guild.voiceAdapterCreator,
                });

                const player = createAudioPlayer();
                var res = await getNextResource();
                player.play(res.resource);
                connection.subscribe(player);


                player.on(AudioPlayerStatus.Idle, async () => {
                    let interact = interaction;
                    if (playlist.head) {
                        var res = await getNextResource();
                        player.play(res.resource);
                        let embed = new MessageEmbed()
                            .setColor('#0099ff')
                            .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
                            .setThumbnail(res.thumbnail)
                        send(interact, embed, false);
                    }
                    else {
                        setTimeout(() => {
                            const con = getVoiceConnection(id);
                            if (con.state.subscription.player.state.status != 'playing') {
                                player.stop();
                                connection.destroy();
                                playlistMap.delete(interaction.guild.id);
                            }
                        }, 300000);
                    }
                });
                player.on('error', async error => {
                    let interact = interaction;
                    console.error(`Error: ${error.message}`);
                    console.error(error);
                    if (playlist.head) {
                        var res = await getNextResource();
                        player.play(res.resource);
                        let embed = new MessageEmbed()
                            .setColor('#de3826')
                            .setDescription(`Ocurrió un error. Reproduciendo: ${hyperlink(res.title, res.url)}`)
                            .setThumbnail(res.thumbnail)
                        send(interact, embed, false);
                    }
                });

                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
                    .setThumbnail(res.thumbnail)
                await interaction.reply({ embeds: [embed] });
            }
            else
            {
                var res = await getNextResource();
                con.state.subscription.player.play(res.resource);
                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
                    .setThumbnail(res.thumbnail)
                // await interaction.reply({ embeds: [embed] });
                send(interaction, embed, slash);
            }
        }
        else
        {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No hay canciones en la lista')
            // await interaction.reply({ embeds: [embed] });
            send(interaction, embed, slash);
        }
    },
};
