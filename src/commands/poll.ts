import {
  CommandInteraction,
  MessageEmbed,
  Client,
  MessageActionRow,
  MessageButton,
} from "discord.js";
import { Discord, Slash, SlashOption } from "discordx";
import db from "quick.db";
import { randomUUID } from "crypto";

@Discord()
export abstract class PollCommand {
  @Slash("poll", { description: "Créer un sondage facilement" })
  async createPoll(
    @SlashOption("duree", {
      description: "Durée du sondage (en heures)",
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
    duree: number,
    question: string,
    choix1: string,
    choix2: string,
    choix3: string,
    choix4: string,
    choix5: string,
    interaction: CommandInteraction,
    client: Client
  ): Promise<void> {
    const pollAlreadyExist = await db.get("pollAlreadyExist");
    if (!pollAlreadyExist) {
      db.set("pollAlreadyExist", true);
      const time = duree < 1 ? 1 : duree > 60 * 24 * 7 ? 60 * 24 * 7 : duree;

      const poll: any = {
        id: randomUUID(),
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
        endDate: interaction.createdTimestamp + 1000 * 60 * 60 * time,
      };
      let components = [];

      for (let i = 1; i <= 5; i++) {
        if (poll[`choix${i}`] !== undefined) {
          components.push(
            new MessageActionRow().addComponents(
              new MessageButton()
                .setLabel(
                  `${poll[`choix${i}`]} (${poll[`choix${i}_votes`]} vote)`
                )
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
            )
            .setAuthor({
              name: interaction.user?.username,
              iconURL: interaction.user.displayAvatarURL(),
              url: `https://discordapp.com/users/${interaction.user.id}/`,
            }),
        ],
        components: components,
      });
      await db.set(`polls.p${poll.id}`, poll);
      await interaction.reply({
        content: `Le sondage :\nhttps://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`,
        ephemeral: true,
      });

      // Create thread
      message
        .startThread({
          name: `[Sondage] ${poll.question.substring(0, 20)}`,
        })
        .then(async (thread: any) => {
          thread.send(`${interaction.user}`).then((m: any) => m.delete());
          thread.send(
            `Voter ici:\nhttps://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
          );
          let newComponents: any = [];
          let pollOptions: any = [];
          const pollResults = await db.get(`polls.p${poll.id}`);
          const { members, endDate } = pollResults;
          if (interaction.createdTimestamp > endDate) {
            for (let i = 1; i <= 5; i++) {
              if (poll[`choix${i}`] !== undefined) {
                pollOptions.push({
                  label: `${poll[`choix${i}`]}`,
                  value: db.get(`polls.p${poll.id}.choix${i}_votes`),
                });
                newComponents.push(
                  new MessageActionRow().addComponents(
                    new MessageButton()
                      .setLabel(
                        `${poll[`choix${i}`]} (${await db.get(
                          `polls.p${poll.id}.choix${i}_votes`
                        )} vote${members.length > 1 ? "s" : ""})`
                      )
                      .setStyle("PRIMARY")
                      .setCustomId(`choix${i}`)
                      .setDisabled(true)
                  )
                );
              }
            }
            const highestToLowest = pollOptions.sort(
              (a: any, b: any) => b.value - a.value
            );
            message.edit({
              embeds: [
                new MessageEmbed()
                  .setTitle("Résultat du sondage")
                  .setDescription(`${poll.question}`)
                  .addFields(
                    highestToLowest.map((option: any, index: number) => {
                      return {
                        name: `${
                          index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : ""
                        } ${option.label}`,
                        value: `avec ${option.value} vote${
                          option.value > 1 ? "s" : ""
                        } / ${members.length}`,
                      };
                    })
                  ),
              ],
              components: newComponents,
            });
            db.set("pollAlreadyExist", false);
            thread.send(
              `Le sondage est terminé (le canal va être archivé automatiquement) ! Voici les résultats:\nhttps://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
            );
            client.off("interactionCreate", listener);
            setTimeout(() => {
              thread.setArchived(true);
            }, 60000);
          }
        });
      // Create event
      setTimeout(() => {
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
      }, 5000);

      // Collect
      const listener = async (interaction: any) => {
        if (interaction.isButton()) {
          if (interaction.customId.match(/(choix)([12345])/i)) {
            const pollResults = await db.get(`polls.p${poll.id}`);
            const {
              choix1_votes,
              choix2_votes,
              choix3_votes,
              choix4_votes,
              choix5_votes,
              members,
            } = pollResults;
            if (!members.includes(interaction.user.id)) {
              switch (interaction.customId) {
                case `choix1`:
                  await db.set(`polls.p${poll.id}`, {
                    ...pollResults,
                    choix1_votes: choix1_votes + 1,
                    members: [...members, interaction.user.id],
                  });
                  const newChoix1 = await db.get(
                    `polls.p${poll.id}.choix1_votes`
                  );
                  interaction.component.label = `${poll.choix1} (${newChoix1} ${
                    newChoix1 === 1 ? "vote" : "votes"
                  })`;
                  break;
                case `choix2`:
                  await db.set(`polls.p${poll.id}`, {
                    ...pollResults,
                    choix2_votes: choix2_votes + 1,
                    members: [...members, interaction.user.id],
                  });
                  const newChoix2 = await db.get(
                    `polls.p${poll.id}.choix2_votes`
                  );
                  interaction.component.label = `${poll.choix2} (${newChoix2} ${
                    newChoix2 === 1 ? "vote" : "votes"
                  })`;
                  break;
                case `choix3`:
                  await db.set(`polls.p${poll.id}`, {
                    ...pollResults,
                    choix3_votes: choix3_votes + 1,
                    members: [...members, interaction.user.id],
                  });
                  const newChoix3 = await db.get(
                    `polls.p${poll.id}.choix3_votes`
                  );
                  interaction.component.label = `${poll.choix3} (${newChoix3} ${
                    newChoix3 === 1 ? "vote" : "votes"
                  })`;
                  break;
                case `choix4`:
                  await db.set(`polls.p${poll.id}`, {
                    ...pollResults,
                    choix4_votes: choix4_votes + 1,
                    members: [...members, interaction.user.id],
                  });
                  const newChoix4 = await db.get(
                    `polls.p${poll.id}.choix4_votes`
                  );
                  interaction.component.label = `${poll.choix4} (${newChoix4} ${
                    newChoix4 === 1 ? "vote" : "votes"
                  })`;
                  break;
                case `choix5`:
                  await db.set(`polls.p${poll.id}`, {
                    ...pollResults,
                    choix5_votes: choix5_votes + 1,
                    members: [...members, interaction.user.id],
                  });
                  const newChoix5 = await db.get(
                    `polls.p${poll.id}.choix5_votes`
                  );
                  interaction.component.label = `${poll.choix5} (${newChoix5} ${
                    newChoix5 === 1 ? "vote" : "votes"
                  })`;
                  break;
              }
              await interaction.update({
                components: message.components,
              });
            } else {
              await interaction.reply({
                content: `🚫 Vous avez déjà voté !`,
                ephemeral: true,
              });
            }
          }
        }
      };

      client.on("interactionCreate", listener);
    } else {
      await interaction.reply(
        "Pour le moment la fonctionnalité sondage ne permet q'un seul sondage à la fois."
      );
    }
  }
}
