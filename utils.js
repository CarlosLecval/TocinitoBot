module.exports.send = (interaction, embed, slash) => {
    slash ? interaction.reply({ embeds: [embed] }) : interaction.channel.send({ embeds: [embed] });
}

module.exports.getTimeString = (ms) => {
    if (!ms) return "0:00";

    var seconds = Math.floor(ms / 1000);
    var minutes = Math.floor(seconds / 60);

    minutes %= 60;
    seconds %= 60;

    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
}