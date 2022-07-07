const { SlashCommandBuilder } = require('@discordjs/builders');
const {
    AudioPlayerStatus,
    StreamType,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    VoiceConnection,
    getVoiceConnection,
} = require('@discordjs/voice');
const play = require('play-dl');
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

        const getNextResource = async () => {
            var current = playlist.pop();
            let stream = await play.stream(current.url);
            const resource = createAudioResource(stream.stream, { inputType: stream.type });
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
                var res = await getNextResource();
                player.play(res.resource);
                connection.subscribe(player);


                player.on(AudioPlayerStatus.Idle, async () => {
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
                    console.error(error);
                    if (playlist.head) {
                        var res = await getNextResource();
                        player.play(res.resource);
                        channel.send(`Ocurrió un error. Reproduciendo: ${res.title}`);
                    }
                });

                await interaction.reply('Reproduciendo ' + res.title);
            }
            else
            {
                var res = await getNextResource();
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
