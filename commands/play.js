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
                con.state.subscription.player.unpause();
                await interaction.reply('Reproduciendo');
            }
            else {
                await interaction.reply('No hay nada reproduciendo');
            }
        }
        else {
            const video = await videoFinder(title);
            if (video)
            {
                const playlist = playlistMap.get(interaction.guild.id);
                if (!playlist) {
                    
                    playlistMap.set(interaction.guild.id, new Playlist(video.url, video.title));
                    
                    const getNextResource = () => {
                        var current = playlist.pop();
                        const stream = ytdl(current.url, { filter: 'audioonly' });
                        const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
                        return {
                            resource: resource,
                            title: current.title,
                        };
                    }

                    const player = createAudioPlayer();
                    player.play(getNextResource());
                    connection.subscribe(player);
                    
                    player.on(AudioPlayerStatus.Idle, () => {
                        var id = interaction.guild.id;
                        if (playlist.head) {
                            var res = getNextResource();
                            player.play(res.resource);
                            client.channels.cache.get(id).send(`Reproduciendo: ${res.title}`);
                        }
                        else {
                            connection.unsubscribe(player);
                            player.destroy();
                            connection.destroy();
                            playlistMap.delete(interaction.guild.id);
                        }
                    });
                    player.on('error', error => {
                        var id = interaction.guild.id;
                        console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                        var res = getNextResource();
                        player.play(res.resource);
                        client.channels.cache.get(id).send(`Ocurrió un error. Reproduciendo: ${res.title}`);
                    });
                    
                    await interaction.reply('Reproduciendo ' + video.title);
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