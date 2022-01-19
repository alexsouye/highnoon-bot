import { CommandInteraction, MessageEmbed, Client } from "discord.js"
import { Discord, Slash, SlashOption } from "discordx"
import { Pagination } from "@discordx/pagination"
import axios from 'axios'

@Discord()
export abstract class R34Command {
  @Slash("r34", { description: "NSFW, moteur de recherche r34", })
  async r34(
    @SlashOption('recherche', { description: "Mot clé", type: 'STRING' })
    @SlashOption('limite', { description: "Limite le nombre de résultats a afficher (exemple: 2)", required: false, type: 'NUMBER' })
    recherche: string,
    limite: number,
    interaction: CommandInteraction,
    bot: Client,
  ): Promise<void> {
    const r34: any[] = []
    const limitResults = limite ? limite : 10
    await axios(`https://r34-json.herokuapp.com/posts?tags=${recherche.replace(' ', '_')}&limit=${limitResults}`, {
      method: 'GET',
    })
      .then((response) => {
        if (response.status === 500) {
          interaction.reply({ content: "Impossible d'accéder aux résultats" })
        } else {
          if (response.data.posts.length === 0) {
            interaction.reply({ content: `Aucun résultat pour ${recherche}` })
          }
          if (response.data.posts.length > 0) {
            const results = response.data.posts.filter((el: any) => el.type !== "video")
            results.map((_i: any, index: number) => {
              const params = new URL(results[index].sample_url).searchParams
              r34.push({
                "footer": `page ${index + 1}/${results.length}`,
                "url": `${params.get('url')}`,
                "tags": `${results[index].tags[0] || '/'}, ${results[index].tags[1] || '/'}, ${results[index].tags[2] || '/'}, ${results[index].tags[3] || '/'}, ${results[index].tags[4] || '/'}`,
              })
            })
          }
        }
      })
    const pages = r34.map((page) => {
      const {
        footer,
        url,
        tags,
      } = page

      return new MessageEmbed()
        .setTitle(`Résultats pour ${recherche}`)
        .setURL(url)
        .setImage(url)
        .setColor('RED')
        .setFooter(footer, bot.user?.displayAvatarURL())
        .addField('tags associés', tags)
    })

    const pagination = new Pagination(interaction, pages, { type: 'BUTTON', showStartEnd: false })
    await pagination.send()
  }
}
