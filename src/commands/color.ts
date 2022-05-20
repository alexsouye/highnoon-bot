import {
  CommandInteraction,
  MessageActionRow,
  SelectMenuInteraction,
  MessageSelectMenu,
  Client,
} from "discord.js";
import { Discord, Slash, SelectMenuComponent } from "discordx";

const roles = [
  { label: "Cyan", value: "cyan" },
  { label: "Orange", value: "orange" },
  { label: "Rose", value: "rose" },
  { label: "Rouge", value: "rouge" },
  { label: "Bleu", value: "bleu" },
  { label: "Gris", value: "gris" },
  { label: "Violet", value: "violet" },
  { label: "Jaune", value: "jaune" },
  { label: "Rouge Sombre", value: "rouge-sombre" },
];

@Discord()
export abstract class buttons {
  @SelectMenuComponent("color-menu")
  async handle(interaction: SelectMenuInteraction, bot: Client): Promise<unknown> {
    await interaction.deferReply();

    // extract selected value by member
    const roleValue = interaction.values?.[0];

    // if value not found
    if (!roleValue) {
      return await interaction.followUp("Le rôle sélectionné n'est pas disponible, merci de réessayer.");
    }

    await bot.guilds.cache.get("717098392409879552")?.members.cache.get(interaction.user.id)?.roles.add(roleValue);

    await interaction.followUp(
      `Tu as sélectionné la couleur : ${roles.find((r) => r.value === roleValue)?.label
      }`
    );
    return;
  }

  @Slash("color", { description: "Change ton role et ta couleur" })
  async color(interaction: CommandInteraction): Promise<unknown> {
    await interaction.deferReply();

    // create menu for roles
    const menu = new MessageSelectMenu()
      .addOptions(roles)
      .setCustomId("color-menu");

    // create a row for message actions
    const buttonRow = new MessageActionRow().addComponents(menu);

    // send it
    interaction.editReply({
      content: "Sélectionne une couleur !",
      components: [buttonRow],
    });
    return;
  }
}