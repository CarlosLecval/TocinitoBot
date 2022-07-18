module.exports.send = (interaction, embed, slash) => {
    slash ? interaction.reply({ embeds: [embed] }) : interaction.channel.send({ embeds: [embed] });
}