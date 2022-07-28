const fs = require('fs');
const { Client, Collection, Intents, MessageEmbed } = require('discord.js');
const { inlineCode, } = require('@discordjs/builders');
const play = require('play-dl');
require('dotenv').config();

var prefix = process.env.NODE_ENV === 'production' ? '-' : '$';

var setTokens = async () => {
    await play.setToken({
        spotify: {
            client_id: process.env.SPOTIFY_CLIENT_ID,
            client_secret: process.env.SPOTIFY_CLIENT_SECRET,
            refresh_token: process.env.SPOTIFY_REFRESH_TOKEN,
            market: 'MX'
        }
    })
    play.getFreeClientID().then((clientID) => {
        play.setToken({
            soundcloud: {
                client_id: clientID
            }
        });
    });
}

setTokens();

const client = new Client({ intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_VOICE_STATES, Intents.FLAGS.GUILD_MESSAGES] });


client.commands = new Collection();
const commandFiles = fs.readdirSync('./commands').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const command = require(`./commands/${file}`);
    client.commands.set(command.data.name, command);
}

client.once('ready', () => {
    console.log('Ready!');
    // client.user.setActivity('-help');
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;

    const command = client.commands.get(interaction.commandName);

    if (!command) return;

    try {
        await command.execute(interaction, null, true);
    } catch (error) {
        console.error(error);
        await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on("messageCreate", async message => {
    if (message.author.bot) return;

    if (message.content.indexOf(prefix) !== 0) return;

    const args = message.content.slice(prefix.length).trim().split(/ +/g);
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (!command) return;

    try {
        await command.execute(message, args, false);
    } catch (error) {
        console.error(error);
        await message.channel.send({ content: 'There was an error while executing this command!', ephemeral: true });
    }
});

client.on("guildCreate", async guild => {
    let embed = new MessageEmbed()
        .setColor('#8585E5')
        .setTitle("Tocinito")
        .setDescription("¡Gracias por invitarme!")
        .addField("\u200B", `Para empezar, únete a un canal de voz y reproduce una canción con ${inlineCode("/play")}`)
    guild.systemChannel.send({ embeds: [embed] });
});

client.login(process.env.TOKEN);