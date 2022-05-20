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
    @SlashOption("duree", {
      description: "Durée du sondage (en minutes)",
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
    const time = duree < 1 ? 1 : duree > 60 * 24 * 7 ? 60 * 24 * 7 : duree;

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
              .setLabel(`${poll[`choix${i}`]} (${poll[`choix${i}_votes`]} vote)`)
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
        name: `[Sondage] ${poll.question.substring(
          0,
          20
        )}`,
      })
      .then(async (thread: any) => {
        thread.send(`${interaction.user}`).then((m: any) => m.delete());
        thread.send(
          `Voter ici:\nhttps://discord.com/channels/${message.guild.id}/${message.channel.id}/${message.id}`
        );
        let newComponents: any = []
        let numArray: any = []
        setTimeout(async () => {
          const pollResults = await db.get(`polls.p${message.id}`);
          const {
            members,
          } = pollResults
          for (let i = 1; i <= 5; i++) {
            if (poll[`choix${i}`] !== undefined) {
              numArray.push(db.get(`polls.p${message.id}.choix${i}_votes`))
              newComponents.push(
                new MessageActionRow().addComponents(
                  new MessageButton()
                    .setLabel(`${poll[`choix${i}`]} (${await db.get(`polls.p${message.id}.choix${i}_votes`)} vote${members.length > 1 ? 's' : ''})`)
                    .setStyle("PRIMARY")
                    .setCustomId(`choix${i}`)
                    .setDisabled(true)
                )
              );
            }
          }
          const highestToLowest = numArray.sort((a: number, b: number) => b - a)
          message.edit({
            embeds: [
              new MessageEmbed()
                .setTitle('Résultat du sondage')
                .setDescription(
                  `${poll.question}`
                )
                .addFields(
                  highestToLowest.map((num: number, index: number) => {
                    return {
                      name: `Choix n° ${index + 1} : ${poll[`choix${index + 1}`]} ${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : ''}`,
                      value: `avec ${num} vote${members.length > 1 ? 's' : ''} / ${members.length}`,
                    }
                  })
                )
            ],
            components: newComponents,
          })
          thread.send(`Le sondage est terminé ! (le canal va être archivé dans 5 minutes)`)
          setTimeout(() => {
            thread.setArchived(true)
          }, 5 * 60000)
        }, duree * 60000)
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
    client.on('interactionCreate', async (interaction) => {
      if (interaction.isButton()) {
        const pollResults = await db.get(`polls.p${message.id}`);
        const {
          choix1_votes,
          choix2_votes,
          choix3_votes,
          choix4_votes,
          choix5_votes,
          members,
        } = pollResults
        if (!members.includes(interaction.user.id)) {
          switch (interaction.customId) {
            case 'choix1':
              await db.set(`polls.p${message.id}`, { ...pollResults, choix1_votes: choix1_votes + 1, members: [...members, interaction.user.id] });
              const newChoix1 = await db.get(`polls.p${message.id}.choix1_votes`);
              interaction.component.label = `${poll.choix1} (${newChoix1} ${newChoix1 === 1 ? 'vote' : 'votes'})`;
              break;
            case 'choix2':
              await db.set(`polls.p${message.id}`, { ...pollResults, choix2_votes: choix2_votes + 1, members: [...members, interaction.user.id] });
              const newChoix2 = await db.get(`polls.p${message.id}.choix2_votes`);
              interaction.component.label = `${poll.choix2} (${newChoix2} ${newChoix2 === 1 ? 'vote' : 'votes'})`;
              break;
            case 'choix3':
              await db.set(`polls.p${message.id}`, { ...pollResults, choix3_votes: choix3_votes + 1, members: [...members, interaction.user.id] });
              const newChoix3 = await db.get(`polls.p${message.id}.choix3_votes`);
              interaction.component.label = `${poll.choix3} (${newChoix3} ${newChoix3 === 1 ? 'vote' : 'votes'})`;
              break;
            case 'choix4':
              await db.set(`polls.p${message.id}`, { ...pollResults, choix4_votes: choix4_votes + 1, members: [...members, interaction.user.id] });
              const newChoix4 = await db.get(`polls.p${message.id}.choix4_votes`);
              interaction.component.label = `${poll.choix4} (${newChoix4} ${newChoix4 === 1 ? 'vote' : 'votes'})`;
              break;
            case 'choix5':
              await db.set(`polls.p${message.id}`, { ...pollResults, choix5_votes: choix5_votes + 1, members: [...members, interaction.user.id] });
              const newChoix5 = await db.get(`polls.p${message.id}.choix5_votes`);
              interaction.component.label = `${poll.choix5} (${newChoix5} ${newChoix5 === 1 ? 'vote' : 'votes'})`;
              break;
          }
          await interaction.update({
            components: message.components,
          })
        } else {
          interaction.reply({
            content: `Vous avez déjà voté !`,
            ephemeral: true,
          });
        }
      }
    })

  }
}
