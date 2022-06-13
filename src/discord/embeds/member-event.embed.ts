import { Class, Event, EventRole, Party, PartyMember } from '@prisma/client';
import { MessageEmbed } from 'discord.js';
import { MemberEventFactory } from '../../models/member-event-factory';

export const getEmbedMemberEvent = async (
    event: Event & {
        roles: EventRole[];
        partys: (Party & {
            partyMembers: (PartyMember & {
                class: Class;
            })[];
        })[];
    },
    memberEventFactory: MemberEventFactory
) => {
    const title = `${event.isDone ? '~~' : ''}__**${event.name}**__${event.isDone ? '~~' : ''}`;
    const description = `*by <@${event.creatorId}>${
        event.description ? '\n\n' + event.description + '*\n' : '*\n'
    }`;
    const id = `||E-ID:\t${event.id}||`;

    const embed = new MessageEmbed();
    embed.setColor('#0099ff');
    embed.setTitle(title);
    embed.setDescription(description + '\n' + id);

    for (let partyIndex = 1; partyIndex <= event.partys.length; partyIndex++) {
        const party = event.partys[partyIndex - 1];
        if (!party.partyMembers.length && !party.description) continue;
        let groupTitle = '';
        if (party.isDone) groupTitle += '~~';
        groupTitle += `Group ${partyIndex}`;
        if (party.isDone) groupTitle += '~~';

        let memberValue = '';
        const maxColumnSize = 4;
        let columnCount = 1;
        for (let memberIndex = 1; memberIndex <= party.partyMembers.length; memberIndex++) {
            memberValue += party.isDone ? '\n~~' : '\n';
            const member = party.partyMembers[memberIndex - 1];
            memberValue += `#${member.memberNo} ${memberEventFactory.getIconStringFromClass(
                member.class
            )}[${member.charNo}] <@${member.userId}>`;
            if (party.isDone) memberValue += '~~';

            if (memberIndex % maxColumnSize === 0 || memberIndex === party.partyMembers.length) {
                if (columnCount === 1) {
                    embed.addField(
                        groupTitle +
                            `\t${party.description ? '(*' + party.description + '*)' : ''}`,
                        memberValue,
                        true
                    );
                    memberValue = '';
                } else {
                    embed.addField('\u200B', memberValue, true);
                    if (columnCount % 2 === 0) embed.addField('\u200B', '\u200B');
                    memberValue = '';
                }
                columnCount++;
            }
        }
    }
    embed.setFooter({ text: 'Wahrnehmung des Termins ist bei Anmeldung verpflichtend!' });
    return embed;
};
