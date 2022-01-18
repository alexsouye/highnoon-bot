import { CommandInteraction, MessageEmbed } from "discord.js"
import { Discord, MetadataStorage, Slash } from "discordx"
import { Pagination } from "@discordx/pagination"

@Discord()
export abstract class HelpCommand {
  @Slash("commandes", { description: "Liste toutes les commandes du bot" })
  async pages(interaction: CommandInteraction): Promise<void> {
    const commands = MetadataStorage.instance.applicationCommands.map((cmd) => {
      return { name: cmd.name, description: cmd.description }
    })

    const pages = commands.map((cmd, i) => {
      return new MessageEmbed()
        .setFooter(`Page ${i + 1} / ${commands.length}`)
        .setTitle("HN - Toutes les commandes")
        .addField("Nom", cmd.name)
        .addField("Description", cmd.description)
    })

    const pagination = new Pagination(interaction, pages, {
      type: 'BUTTON',
      ephemeral: true,
    })
    await pagination.send()
  }
}
