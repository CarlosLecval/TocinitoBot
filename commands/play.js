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
    VoiceConnectionStatus,
    entersState,
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
    async execute(interaction, args, slash) {
        if (slash) await interaction.deferReply();
        if (play.is_expired()) await play.refreshToken();

        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No estás en un canal de voz')
            send(interaction, embed, slash);
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

        var title = interaction.options ? interaction.options.getString('input') : args.length > 0 ? args.join(" ") : null;
        

        if (!title) {
            let output = noArgs(connection);
            let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription(output)
            send(interaction, embed, slash);
            return;
        }

        var isURL = isValidUrl(title);
        var video = [];
        switch (isURL) {
            case 'open.spotify.com':
                video = await spotify(title, video);
                break;
            case 'soundcloud.com':
                video = await soundcloud(title, video);
                break;
            case 'www.youtube.com':
                video = await youtube(title, video);
                break;
            default:
                video = await def(title, video);
        }

        if (video.length == 0) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No se ha encontrado ninguna canción')
            await interaction.reply({ embeds: [embed] });
            return;
        }
        
        for (let i = 0; i < video.length; i++) {
            let playlist = playlistMap.get(interaction.guild.id);
            if (!playlist) {
                playlistMap.set(interaction.guild.id, new Playlist(video[i].url, video[i].title, video[i].thumbnails[0].url, video[i].artist, video[i].source));
                continue;
            }
            playlist.add(video[i].url, video[i].title, video[i].thumbnails[0].url, video[i].artist, video[i].source);
        }
        
        if ((connection.state.subscription?.player?.state?.status == 'playing' || connection.state.subscription?.player?.state?.status == 'paused') && video.length == 1) {
            let embed = new MessageEmbed()
                .setColor('#26de41')
                .setDescription('Añadido a la lista ' + hyperlink(video[0].title, video[0].url))
                .setThumbnail(video[0].thumbnails[0].url)
            send(interaction, embed, slash);
            return;
        }
        
        if (video.length > 1) {
            let embed = new MessageEmbed()
                .setColor('#26de41')
                .setDescription('Añadidas a la lista ' + bold(video.length.toString()) + ' canciones')
            slash = send(interaction, embed, slash);
            if (connection.state.subscription?.player?.state?.status == 'paused' || connection.state.subscription?.player?.state?.status == 'playing') return;
        }

        var playlist = playlistMap.get(interaction.guild.id);

        let res = await getNextResource(interaction, slash);
        var player = await getPlayer(connection, interaction, playlist);
        player.play(res.resource);
        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
            .setThumbnail(res.thumbnail)
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

function noArgs(connection)
{
    if (!connection.state.subscription) {
        return "No hay nada en reproducción";
    }
    if (connection.state.subscription.player.state.status != 'paused') {
        return "La música ya está sonando";
    }
    connection.state.subscription.player.unpause();
    return "Canción resumida";
}

async function spotify(title, video)
{
    return new Promise(async (resolve) => {
        let sp_data = await play.spotify(title);
        if (sp_data.type == 'track') {
            let vid = await videoFinder(`${sp_data.name} - ${sp_data.artists[0].name}`);
            if (vid) {
                vid.source = 'youtube';
                vid.artist = vid.channel.name;
                video.push(vid);
            }
            resolve(video);
            return;
        }
        let songs = sp_data.fetched_tracks.get("1");
        for (var i = 0; i < songs.length; i++) {
            songs[i].source = 'spotify';
            songs[i].thumbnails = [sp_data.thumbnail];
            songs[i].title = songs[i].name;
            songs[i].artist = songs[i].artists[0].name;
            video.push(songs[i]);
        }
        resolve(video);
    });
}

async function youtube(title, video)
{
    return new Promise(async (resolve) => {
        let validate = play.yt_validate(title);
        if (validate != 'playlist') {
            let yt_info = await play.video_info(title);
            let vid = yt_info.video_details;
            if (vid) {
                vid.source = 'youtube';
                vid.artist = vid.channel.name;
                video.push(vid);
            }
            resolve(video);
            return;
        }
        let yt_info = await play.playlist_info(title, { incomplete: true });
        let playlistVideos = yt_info.videos;
        for (var i = 0; i < playlistVideos.length; i++) {
            let vid = playlistVideos[i];
            vid.source = 'youtube';
            vid.artist = vid.channel.name;
            video.push(vid);
        }
        resolve(video);
    });
}

async function soundcloud(title, video)
{
    return new Promise(async (resolve) => {
        let so_data = await play.soundcloud(title);
        if (so_data.type == 'track') {
            let vid = {
                url: title,
                title: so_data.name,
                thumbnails: [{url: so_data.thumbnail}],
                source: 'soundcloud',
                artist: so_data.user.name
            };
            video.push(vid);
            resolve(video);
            return;
        }
        var songs = so_data.tracks;
        for (var i = 0; i < so_data.tracksCount; i++) {
            if (songs[i].fetched) {
                let vid = {
                    url: songs[i].permalink,
                    title: songs[i].name,
                    thumbnails: [{url: songs[i].thumbnail}],
                    source: 'soundcloud',
                    artist: songs[i].user.name
                };
                video.push(vid);
            }
        }
        resolve(video);
    });
}

function def(title, video)
{
    return new Promise(async resolve => {
        let vid = await videoFinder(title);
        if (vid) {
            vid.source = 'youtube';
            vid.artist = vid.channel.name;
            video.push(vid);
        }
        resolve(video);
    });
}

async function getPlayer(connection, interaction, playlist)
{
    return new Promise(async (resolve) => {
        if (connection.state.subscription?.player) {
            let player = connection.state.subscription.player
            resolve(player);
            return;
        }
        
        let player = createAudioPlayer();
        connection.subscribe(player);

        connection.on(VoiceConnectionStatus.Disconnected, async (oldState, newState) => {
            try {
                await Promise.race([
                    entersState(connection, VoiceConnectionStatus.Signalling, 5_000),
                    entersState(connection, VoiceConnectionStatus.Connecting, 5_000),
                ]);
            } catch (error) {
                connection.destroy();
            }
        });
        
        player.on(AudioPlayerStatus.Idle, async () => {
            var id = interaction.guild.id;
            var channel = interaction.channel;
            if (playlist.head) {
                var res = await getNextResource(interaction, false);
                player.play(res.resource);
                let embed = new MessageEmbed()
                .setColor('#0099ff')
                .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
                .setThumbnail(res.thumbnail)
                channel.send({ embeds: [embed] });
                return;
            }
            setTimeout(() => {
                const con = getVoiceConnection(id);
                if (con.state.subscription.player.state.status != 'playing') {
                    player.stop();
                    con.destroy();
                    playlistMap.delete(interaction.guild.id);
                }
            }, 300000);
        });
        player.on('error', async error => {
            var channel = interaction.channel;
            console.error(`Error: ${error.message}`);
            if (playlist.head) {
                var res = await getNextResource(interaction, false);
                player.play(res.resource);
                let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription(`Ocurrió un error. Reproduciendo: ${hyperlink(res.title, res.url)}`)
                .setThumbnail(res.thumbnail)
                channel.send({ embeds: [embed] });
            }
        });
        resolve(player);
    });
}

const getNextResource = async (interaction, slash) => {
    let id = interaction.guild.id;
    let pl = playlistMap.get(id);
    let current = pl.pop();
    if (current.source == 'spotify') {
        let vid = await videoFinder(`${current.title} - ${current.artist}`);
        if (!vid) {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription(`No se encontró ${current.title}. Reproduciendo siguiente canción}`)
                .setThumbnail(res.thumbnail)
            slash = send(interaction, embed, slash);
            return getNextResource(interaction, slash);
        }
        vid.thumbnail = vid.thumbnails[0].url;
        current = vid;
    }
    let stream = await play.stream(current.url);
    const resource = createAudioResource(stream.stream, { inputType: stream.type });
    return {
        resource: resource,
        title: current.title,
        url: current.url,
        thumbnail: current.thumbnail,
        slash: slash
    };
}