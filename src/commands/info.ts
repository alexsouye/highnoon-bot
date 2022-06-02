import { CommandInteraction, MessageEmbed, Client } from "discord.js"
import { Discord, Slash } from "discordx"

@Discord()
export abstract class InfoCommand {
  @Slash("info", { description: "A propos du bot" })
  async info(interaction: CommandInteraction, client: Client): Promise<void> {
    const embedMessage = new MessageEmbed()
      .setColor("GREEN")
      .setAuthor(
        "High Noon BOT",
        client.user?.displayAvatarURL()
      )
      .setFooter("Fait avec ❤ par Alexsouye v2.2.0")
      .setDescription(
        "Bot discord du groupe de potes High Noon",
      )

    return interaction.reply({ embeds: [embedMessage] })
  }
}
