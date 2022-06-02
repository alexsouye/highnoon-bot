import type { ArgsOf } from "discordx";
import { Discord, On, Client } from "discordx";

@Discord()
export abstract class AppDiscord {
  @On("messageDelete")
  onMessage([message]: ArgsOf<"messageDelete">, client: Client) {
    console.log("Message Deleted", client.user?.username, message.content);
  }
  @On("guildMemberAdd")
  onMember([member]: ArgsOf<"guildMemberAdd">, client: Client) {
    console.log("Member Added", client.user?.username, member.user.username);
  }
}
