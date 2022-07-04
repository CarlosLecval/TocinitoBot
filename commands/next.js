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
        .setName('next')
        .setDescription('Siguiente canción'),
    async execute(interaction) {
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('No estás en un canal de voz');
            return;
        }

        const playlist = playlistMap.get(interaction.guild.id);

        const getNextResource = () => {
            var current = playlist.pop();
            const stream = ytdl(current.url, { filter: 'audioonly' });
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
            return {
                resource: resource,
                title: current.title,
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
                var res = getNextResource();
                player.play(res.resource);
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

                await interaction.reply('Reproduciendo ' + res.title);
            }
            else
            {
                var res = getNextResource();
                con.state.subscription.player.play(res.resource);
                await interaction.reply('Reproduciendo ' + res.title);
            }
        }
        else
        {
            await interaction.reply('No hay canciones en la lista');
        }
    },
};