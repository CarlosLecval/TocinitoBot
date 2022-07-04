const { SlashCommandBuilder } = require('@discordjs/builders');
const ytdl = require('ytdl-core');
const ytSearch = require('yt-search');
const {
    AudioPlayerStatus,
    StreamType,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
} = require('@discordjs/voice');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Música')
        .addStringOption(option =>
            option.setName('url')
                .setDescription('URL')
                .setRequired(false)),
    async execute(interaction) {
        //console.log(interaction.member.voice.channel);
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply('No estás en un canal de voz');
        }

        const connection = joinVoiceChannel({
            channelId: voiceChannel.id,
            guildId: interaction.guild.id,
            adapterCreator: interaction.guild.voiceAdapterCreator,
        });

        const videoFinder = async (query) => {
            const videoResult = await ytSearch(query);

            return (videoResult.videos.length > 1) ? videoResult.videos[0] : null;
        }

        const video = await videoFinder(interaction.options.getString('url'));

        if (video) {
            const stream = ytdl(video.url, { filter: 'audioonly' });
            //const stream = ytdl(interaction.options.getString('url'), { filter: 'audioonly' });
            const resource = createAudioResource(stream, { inputType: StreamType.Arbitrary });
            const player = createAudioPlayer();
            player.play(resource);
            connection.subscribe(player);

            player.on(AudioPlayerStatus.Idle, () => connection.destroy());
            player.on('error', error => {
                console.error(`Error: ${error.message} with resource ${error.resource.metadata.title}`);
                player.play(getNextResource());
            });

            await interaction.reply('Reproduciendo ' + video.title);
        }
        else {
            await interaction.reply('No se ha podido reproducir');
        }
    },
};