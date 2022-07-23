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
        
        if(!playlist || playlist.head == null)
        {
            let embed = new MessageEmbed()
                .setColor('#de3826')
                .setDescription('No hay canciones en la lista')
            send(interaction, embed, slash);
            return;
        }

        const con = getVoiceConnection(interaction.guild.id);

        let res = await getNextResource(interaction, slash);
        var player = await getPlayer(con, interaction, playlist);
        player.play(res.resource);
        let embed = new MessageEmbed()
            .setColor('#0099ff')
            .setDescription('Reproduciendo ' + hyperlink(res.title, res.url))
            .setThumbnail(res.thumbnail)
        send(interaction, embed, slash);
    },
};

async function getPlayer(connection, interaction, playlist) {
    return new Promise(async (resolve) => {
        if (connection.state.subscription?.player) {
            let player = connection.state.subscription.player
            resolve(player);
            return;
        }

        if(!connection) {
            connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: interaction.guild.id,
                adapterCreator: interaction.guild.voiceAdapterCreator,
            });
        }

        let player = createAudioPlayer();
        connection.subscribe(player);

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
