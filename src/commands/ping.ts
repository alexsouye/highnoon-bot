import { CommandInteraction, MessageEmbed, Client } from "discord.js"
import { Discord, Slash } from "discordx"

@Discord()
export abstract class PingCommand {
  @Slash("ping", { description: "ping du bot" })
  async ping(interaction: CommandInteraction, client: Client): Promise<void> {
    const embedMessage = new MessageEmbed()
      .setColor("PURPLE")
      .setTitle("Ping du bot")
      .setDescription(
        `Pong 🏓! ${Math.round(client.ws.ping)} ms`,
      )

    return interaction.reply({ embeds: [embedMessage], ephemeral: true })
  }
}
