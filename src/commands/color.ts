import {
  CommandInteraction,
  MessageActionRow,
  SelectMenuInteraction,
  MessageSelectMenu,
  Message,
  Client,
} from "discord.js";
import { Discord, Slash, SelectMenuComponent, Permission } from "discordx";
import db from "quick.db";

const roles = [
  { label: "Cyan", value: "cyan" },
  { label: "Orange", value: "orange" },
  { label: "Rose", value: "rose" },
  { label: "Rouge", value: "rouge" },
  { label: "Bleu", value: "bleu" },
  { label: "Gris", value: "gris" },
  { label: "Marron", value: "marron" },
  { label: "Jaune", value: "jaune" },
  { label: "Rouge Sombre", value: "rouge-sombre" },
];

@Discord()
export abstract class buttons {
  @SelectMenuComponent("color-menu")
  @Permission({ id: "981940598980366366", type: "ROLE", permission: true })
  @Permission({ id: "981940795592556585", type: "ROLE", permission: true })
  @Permission({ id: "981940898193604659", type: "ROLE", permission: true })
  @Permission({ id: "981940994746491022", type: "ROLE", permission: true })
  @Permission({ id: "981941033153757234", type: "ROLE", permission: true })
  @Permission({ id: "981941099931267203", type: "ROLE", permission: true })
  @Permission({ id: "981941177119031368", type: "ROLE", permission: true })
  @Permission({ id: "981941340172603502", type: "ROLE", permission: true })
  @Permission({ id: "981941416064348200", type: "ROLE", permission: true })
  async handle(
    interaction: SelectMenuInteraction,
    client: Client
  ): Promise<unknown> {
    const guild = await client.guilds.fetch("981569920385040405");
    const member = guild.members.cache.get(interaction.user.id);

    await interaction.deferReply();

    // Get the actual role color from database
    const userColor = await db.get(`colors.hn${interaction.user.id}`);
    const roleValue = interaction.values?.[0];
    const role: any = guild.roles.cache.find((r) => r.name === roleValue);

    // if value not found
    if (!roleValue) {
      return await interaction.followUp(
        "Le rôle sélectionné n'est pas disponible, merci de réessayer."
      );
    }

    // Check if the user already has a color
    if (userColor) {
      const { selectedColor } = userColor;
      const precedentRole: any = guild.roles.cache.find(
        (r) => r.name === selectedColor
      );
      await member?.roles.remove(precedentRole);
      await db.delete(`colors.hn${interaction.user.id}`);
      await member?.roles.add(role);
      await db.set(`colors.hn${interaction.user.id}`, {
        selectedColor: roleValue,
      });
    } else {
      await member?.roles.add(role);
      await db.set(`colors.hn${interaction.user.id}`, {
        selectedColor: roleValue,
      });
    }

    await interaction.followUp({
      content: `Tu as sélectionné la couleur : ${
        roles.find((r) => r.value === roleValue)?.label
      }`,
      ephemeral: true,
    });
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
