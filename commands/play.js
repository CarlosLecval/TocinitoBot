const { SlashCommandBuilder } = require('@discordjs/builders');
const play = require('play-dl')
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
            option.setName('input')
                .setDescription('input')
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

        var channel = interaction.channel;
        var title = interaction.options.getString('input');
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
            var isURL = isValidUrl(title);
            var video = [];
            switch (isURL) {
                case 'open.spotify.com':
                    if (play.is_expired()) {
                        await play.refreshToken()
                    }
                    let sp_data = await play.spotify(title);
                    if (sp_data.type == 'track') {
                        let vid = await videoFinder(`${sp_data.name} - ${sp_data.artists[0].name}`);
                        if (vid) {
                            video.push(vid);
                        }
                    }
                    else {
                        var songs = sp_data.fetched_tracks.get("1");
                        for (var i = 0; i < songs.length; i++) {
                            let vid = await videoFinder(`${songs[i].name} - ${songs[i].artists[0].name}`);
                            if (vid) {
                                video.push(vid);
                            }
                        }
                    }
                    break;
                case 'soundcloud.com':
                    let so_data = await play.soundcloud(title);
                    if (so_data.type == 'track') {
                        let vid = {
                            url: title,
                            title: so_data.name
                        };
                        if (vid) {
                            video.push(vid);
                        }
                    }
                    else {
                        var songs = so_data.tracks;
                        for (var i = 0; i < so_data.tracksCount; i++) {
                            if (songs[i].fetched) {
                                let vid = {
                                    url: songs[i].permalink,
                                    title: songs[i].name
                                };
                                video.push(vid);
                            }
                        }
                    }
                    break;
                default:
                    let vid = await videoFinder(title);
                    if (vid) {
                        video.push(vid);
                    }
            }
            if (video) {
                for (var i = 0; i < video.length; i++) {
                    let playlist = playlistMap.get(interaction.guild.id);
                    if (!playlist) {
                        playlistMap.set(interaction.guild.id, new Playlist(video[i].url, video[i].title));
                    }
                    else {
                        playlist.add(video[i].url, video[i].title);
                    }
                }
                if (video.length > 1) {
                    await interaction.reply('Añadido a la lista ' + video.length + ' canciones');
                }
                else if (video.length < 1) {
                    await interaction.reply('No se ha encontrado ninguna canción');
                    return;
                }

                var playlist = playlistMap.get(interaction.guild.id);

                const getNextResource = async () => {
                    let id = interaction.guild.id;
                    let pl = playlistMap.get(id);
                    let current = pl.pop();
                    let stream = await play.stream(current.url);
                    const resource = createAudioResource(stream.stream, { inputType: stream.type });
                    return {
                        resource: resource,
                        title: current.title,
                    };
                }

                if (!connection.state.subscription || connection.state.subscription.player.state.status != 'playing') {
                    let res = await getNextResource();
                    if (!connection.state.subscription) {
                        var player = createAudioPlayer();
                        connection.subscribe(player);

                        player.on(AudioPlayerStatus.Idle, async () => {
                            var id = interaction.guild.id;
                            var channel = interaction.channel;
                            if (playlist.head) {
                                var res = await getNextResource();
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
                        player.on('error', async error => {
                            var channel = interaction.channel;
                            console.error(`Error: ${error.message}`);
                            console.log(error);
                            if (playlist.head) {
                                var res = await getNextResource();
                                player.play(res.resource);
                                channel.send(`Ocurrió un error. Reproduciendo: ${res.title}`);
                            }
                        });
                    }
                    else {
                        var player = connection.state.subscription.player
                    }
                    player.play(res.resource);
                    await channel.send('Reproduciendo ' + res.title);
                }
                else {
                    if (video.length == 1) {
                        await interaction.reply('Añadido a la lista ' + video[0].title);
                    }
                }
            }
            else {
                await interaction.reply('No se ha podido reproducir');
            }
        }
    },
};

const videoFinder = async (query) => {
    let yt_info = await play.search(query, {
        limit: 1
    });

    return yt_info[0] ? yt_info[0] : null;
}

function isValidUrl(string) {
    let url;

    try {
        url = new URL(string);
    } catch (_) {
        return false;
    }

    return url.hostname;
}