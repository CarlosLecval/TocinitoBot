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
const play = require('play-dl')
const {
    AudioPlayerStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    getVoiceConnection,
} = require('@discordjs/voice');
const { MessageEmbed } = require('discord.js');
const { Playlist, playlistMap } = require('../playlist');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce canción')
        .addStringOption(option =>
            option.setName('input')
                .setDescription('input')
                .setRequired(false)),
    async execute(interaction, args) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No estás en un canal de voz')
            await interaction.reply({ embeds: [embed] });
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
        var title = interaction.options ? interaction.options.getString('input') : args.length > 0 ? args.join(" ") : null;

        if (!title) {
            if (connection.state.subscription){
                if (connection.state.subscription.player.state.status == 'paused') {
                    connection.state.subscription.player.unpause();
                    let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription('Canción resumida')
                    await interaction.reply({ embeds: [embed] });
                }
                else {
                    let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription('La música ya está sonando')
                    await interaction.reply({ embeds: [embed] });
                }
            }
            else {
                let embed = new MessageEmbed()
                    .setColor('#0099ff')
                    .setDescription('No hay nada en reproducción')
                await interaction.reply({ embeds: [embed] });
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
                            title: so_data.name,
                            thumbnails: [so_data.thumbnail]
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
                                    title: songs[i].name,
                                    thumbnails: [so_data.thumbnail]
                                };
                                video.push(vid);
                            }
                        }
                    }
                    break;
                case 'www.youtube.com':
                    let validate = play.yt_validate(title);
                    if (validate == 'playlist') {
                        let yt_info = await play.playlist_info(title, {incomplete: true});
                        let playlistVideos = yt_info.videos;
                        for (var i = 0; i < playlistVideos.length; i++) {
                            let vid = playlistVideos[i];                            
                            if (vid) {
                                video.push(vid);
                            }
                        }
                    }
                    else {
                        let vid = await videoFinder(title);
                        if (vid) {
                            video.push(vid);
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
                        playlistMap.set(interaction.guild.id, new Playlist(video[i].url, video[i].title, video[i].thumbnails[0].url));
                    }
                    else {
                        playlist.add(video[i].url, video[i].title, video[i].thumbnails[0].url);
                    }
                }
                if (video.length > 1) {
                    let embed = new MessageEmbed()
                        .setColor('#26de41')
                        .setDescription('Añadidas a la lista ' + bold(video.length.toString()) + ' canciones')
                    await interaction.reply({ embeds: [embed] });
                }
                else if (video.length < 1) {
                    let embed = new MessageEmbed()
                    .setColor('#de3826')
                    .setDescription('No se ha encontrado ninguna canción')
                    await interaction.reply({ embeds: [embed] });
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
                        url: current.url,
                        thumbnail: current.thumbnail
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
                                let embed = new MessageEmbed()
                                    .setColor('#0099ff')
                                    .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
                                    .setThumbnail(res.thumbnail)
                                channel.send({ embeds: [embed] });
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
                            if (playlist.head) {
                                var res = await getNextResource();
                                player.play(res.resource);
                                let embed = new MessageEmbed()
                                    .setColor('#de3826')
                                    .setDescription(`Ocurrió un error. Reproduciendo: ${hyperlink(res.title, res.url) }`)
                                    .setThumbnail(res.thumbnail)
                                channel.send({ embeds: [embed] });
                            }
                        });
                    }
                    else {
                        var player = connection.state.subscription.player
                    }
                    player.play(res.resource);
                    let embed = new MessageEmbed()
                        .setColor('#0099ff')
                        .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
                        .setThumbnail(res.thumbnail)
                    channel.send({ embeds: [embed] });
                }
                else {
                    if (video.length == 1) {
                        let embed = new MessageEmbed()
                            .setColor('#26de41')
                            .setDescription('Añadido a la lista ' + hyperlink(video[0].title, video[0].url))
                            .setThumbnail(video[0].thumbnails[0].url)
                        channel.send({ embeds: [embed] });
                    }
                }
            }
            else {
                let embed = new MessageEmbed()
                    .setColor('#de3826')
                    .setDescription('No se ha encontrado ninguna canción')
                await interaction.reply({ embeds: [embed] });
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