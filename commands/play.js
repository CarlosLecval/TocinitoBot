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

                    playlist = playlistMap.get(interaction.guild.id);
                    
                    const getNextResource = () => {
                        var current = playlist.pop();
                        const stream = ytdl(current.url, { filter: 'audioonly' });
                        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
                        return {
                            resource: resource,
                            title: current.title,
                        };
                    }

                    var res = getNextResource();

                    const player = createAudioPlayer();
                    player.play(res.resource);
                    connection.subscribe(player);
                    
                    player.on(AudioPlayerStatus.Idle, () => {
                        var channel = interaction.channel;
                        if (playlist.head) {
                            var res = getNextResource();
                            player.play(res.resource);
                            channel.send(`Reproduciendo: ${res.title}`);
                        }
                        else {
                            setTimeout(() => {
                                player.stop();
                                connection.destroy();
                                playlistMap.delete(interaction.guild.id);
                            }, 300000);
                        }
                    });
                    player.on('error', error => {
                        var channel = interaction.channel;
                        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                        console.log(error);
                        var res = getNextResource();
                        player.play(res.resource);
                        channel.send(`Ocurrió un error. Reproduciendo: ${res.title}`);
                    });
                    
                    await interaction.reply('Reproduciendo ' + res.title);
                }
                else {
                    playlist.add(video.url, video.title);
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