import "reflect-metadata"
import dotenv from 'dotenv'
import { Intents, Interaction, Message } from "discord.js"
import { dirname, importx } from "@discordx/importer";
import { Client } from "discordx"

dotenv.config()

const client = new Client({
  simpleCommand: {
    prefix: "!",
  },
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
    Intents.FLAGS.GUILD_VOICE_STATES,
  ],
  botGuilds: [(client) => client.guilds.cache.map((guild) => guild.id)],
})

client.once("ready", async () => {
  // make sure all guilds are in cache
  await client.guilds.fetch()

  // init all applicaiton commands
  await client.initApplicationCommands({
    guild: { log: true },
    global: { log: true },
  })

  // init permissions; enabled log to see changes
  await client.initApplicationPermissions(true)

  console.log("HN Bot started ✅")
})

client.on("interactionCreate", (interaction: Interaction) => {
  client.executeInteraction(interaction);
})

client.on("messageCreate", (message: Message) => {
  client.executeCommand(message)
})

async function run() {
  // automatically import all commands files from src/commands directory
  await importx(
    dirname(import.meta.url) + "/{events,commands}/**/*.{ts,js}"
  )

  if (!process.env.TOKEN) {
    throw Error("Could not find TOKEN in your environment variables");
  }

  await client.login(process.env.TOKEN)
}

run()

