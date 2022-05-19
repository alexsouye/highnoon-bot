import {
  CommandInteraction,
  MessageEmbed,
  Client,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import db from "quick.db";

@Discord()
export abstract class PollCommand {
  @Slash("poll", { description: "Créer un sondage facilement" })
  async createPoll(
    @SlashOption("temps", {
      description: "Date de fin du sondage (en minutes)",
      type: "INTEGER",
      required: true,
    })
    @SlashOption("question", {
      description: "Question",
      required: true,
      type: "STRING",
    })
    @SlashOption("choix1", {
      description: "Choix n°1",
      required: true,
      type: "STRING",
    })
    @SlashOption("choix2", {
      description: "Choix n°2",
      required: true,
      type: "STRING",
    })
    @SlashOption("choix3", {
      description: "Choix n°3",
      required: false,
      type: "STRING",
    })
    @SlashOption("choix4", {
      description: "Choix n°4",
      required: false,
      type: "STRING",
    })
    @SlashOption("choix5", {
      description: "Choix n°5",
      required: false,
      type: "STRING",
    })
    temps: number,
    question: string,
    choix1: string,
    choix2: string,
    choix3: string,
    choix4: string,
    choix5: string,
    interaction: CommandInteraction,
    bot: Client
  ): Promise<void> {
    const time = temps < 1 ? 1 : temps > 60 * 24 * 7 ? 60 * 24 * 7 : temps;
    const poll: any = {
      question,
      choix1,
      choix1_votes: 0,
      choix2,
      choix2_votes: 0,
      choix3: choix3 ?? undefined,
      choix3_votes: 0,
      choix4: choix4 ?? undefined,
      choix4_votes: 0,
      choix5: choix5 ?? undefined,
      choix5_votes: 0,
      members: [],
      startDate: interaction.createdTimestamp,
      endDate: interaction.createdTimestamp + 1000 * 60 * time,
    };
    let components = [];

    for (let i = 1; i <= 5; i++) {
      if (poll[`choix${i}`] !== undefined) {
        components.push(
          new MessageActionRow().addComponents(
            new MessageButton()
              .setLabel(`${poll[`choix${i}`]} [0]`)
              .setStyle("PRIMARY")
              .setCustomId(`choix${i}`)
          )
        );
      }
    }

    const channel: any = await interaction.channel;
    const message = await channel.send({
      embeds: [
        new MessageEmbed()
          .setTitle(question)
          .setDescription(
            `Date de fin du sondage: <t:${~~(poll.endDate / 1000)}:F>`
          ),
      ],
      components: components,
    });
    await db.set(`polls.p${message.id}`, poll);
    interaction.reply({
      content: `Le sondage :\nhttps://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
      ephemeral: true,
    });

    // Create thread
    message
      .startThread({
        name: `[Discussion autour du Sondage] ${poll.question.substring(
          0,
          20
        )}`,
        autoArchiveDuration: time,
      })
      .then(async (thread: any) => {
        thread.send(`${interaction.user}`).then((m: any) => m.delete());
        thread.send(
          `Voter ici:\nhttps://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
        );
      });

    // Create event
    if (time > 1)
      interaction.guild?.scheduledEvents.create({
        name: `[SONDAGE] ${poll.question}`,
        scheduledStartTime: poll.startDate + 1000 * 60,
        scheduledEndTime: poll.endDate,
        privacyLevel: `GUILD_ONLY`,
        entityType: `EXTERNAL`,
        description: `Sondage: ${poll.question}\npar ${interaction.user.username}`,
        entityMetadata: {
          location: `https://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
        },
        reason: `Sondage: "${poll.question}" par ${interaction.user.username}`,
      });

    // Collect
    const collector = interaction.channel.createMessageComponentCollector({
      filter,
      time: 15000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "primary") {
        await i.update({ content: "A button was clicked!", components: [] });
      }
    });

    collector.on("end", (collected) =>
      console.log(`Collected ${collected.size} items`)
    );
  }
}
