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
        .setName('play')
        .setDescription('Reproduce canción')
        .addStringOption(option =>
            option.setName('title')
                .setDescription('title')
                .setRequired(false)),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('No estás en un canal de voz');
            return;
        }

        var connection = getVoiceConnection(interaction.guild.id);
        if (!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
        }

        var title = interaction.options.getString('title');
        
        if (!title) {
            if (connection.state.subscription.player.state.status == 'paused') {
                connection.state.subscription.player.unpause();
                await interaction.reply('Reproduciendo');
            }
            else {
                await interaction.reply('N0');
            }
        }
        else {
            const video = await videoFinder(title);
            if (video)
            {
                var playlist = playlistMap.get(interaction.guild.id);
                if (!playlist) {
                    playlistMap.set(interaction.guild.id, new Playlist(video.url, video.title));
                }
                else {
                    playlist.add(video.url, video.title);
                }

                playlist = playlistMap.get(interaction.guild.id);
                
                const getNextResource = () => {
                    let id = interaction.guild.id;
                    let pl = playlistMap.get(id);
                    let current = pl.pop();
                    const stream = ytdl(current.url, { filter: 'audioonly' });
                    const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
                    return {
                        resource: resource,
                        title: current.title,
                    };
                }

                if (!connection.state.subscription) {    

                    let res = getNextResource();
                    
                    const player = createAudioPlayer();
                    player.play(res.resource);
                    connection.subscribe(player);
                    
                    player.on(AudioPlayerStatus.Idle, () => {
                        var id = interaction.guild.id;
                        var channel = interaction.channel;
                        if (playlist.head) {
                            var res = getNextResource();
                            player.play(res.resource);
                            channel.send(`Reproduciendo: ${res.title}`);
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
                    player.on('error', error => {
                        var channel = interaction.channel;
                        console.error(`Error: ${error.message}`);
                        console.log(error);
                        if (playlist.head) {
                            var res = getNextResource();
                            player.play(res.resource);
                            channel.send(`Ocurrió un error. Reproduciendo: ${res.title}`);
                        }
                    });
                    
                    await interaction.reply('Reproduciendo ' + res.title);
                }
                else if (connection.state.subscription.player.state.status != 'playing')
                {
                    let res = getNextResource();
                    connection.state.subscription.player.play(res.resource);
                    await interaction.reply('Reproduciendo ' + res.title);
                }
                else {
                    await interaction.reply('Añadido a la lista ' + video.title);
                }
            }
            else {
                await interaction.reply('No se ha podido reproducir');
            }
        }
    },
};

const videoFinder = async (query) => {
    const videoResult = await ytSearch(query);

    return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
}