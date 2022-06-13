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
    const title = `${event.isDone ? '~~' : ''}__**${event.name}**__${
        event.isDone ? '~~' : ''
    } by <@${event.creatorId}>`;
    const description = `${event.description ? '*' + event.description + '*' : ''}`;
    const id = `||E-ID:\t${event.id}||`;

    const embed = new MessageEmbed();
    embed.setColor('#0099ff');
    embed.setTitle(title);
    embed.setDescription(description + '\n' + id);

    for (let partyIndex = 1; partyIndex <= event.partys.length; partyIndex++) {
        const party = event.partys[partyIndex - 1];
        if (!party.partyMembers.length && !party.description) continue;
        if (partyIndex > 1) embed.addField('\u200B', '\u200B');
        let groupTitle = '';
        if (party.isDone) groupTitle += '~~';
        groupTitle += `Group ${partyIndex}`;
        if (party.isDone) groupTitle += '~~';
        embed.addField(
            groupTitle,
            `${party.description ? '(*' + party.description + '*)' : '\u200B'}`,
            true
        );
        let memberValue = '';
        for (let memberIndex = 1; memberIndex <= party.partyMembers.length; memberIndex++) {
            if (memberIndex % 4 === 1 && memberIndex !== 1) {
                embed.addField('\u200B', '\u200B', true);
            }
            if (memberIndex % 2 === 1) {
                memberValue = party.isDone ? '~~' : '';
                const member = party.partyMembers[memberIndex - 1];
                memberValue += `#${member.memberNo} ${memberEventFactory.getIconStringFromClass(
                    member.class
                )}[${member.charNo}] <@${member.userId}>`;
                if (party.isDone) memberValue += '~~';
            } else {
                memberValue += party.isDone ? '\n~~' : '\n';
                const member = party.partyMembers[memberIndex - 1];
                memberValue += `#${member.memberNo} ${memberEventFactory.getIconStringFromClass(
                    member.class
                )}[${member.charNo}] <@${member.userId}>`;
                if (party.isDone) memberValue += '~~';
                embed.addField('\u200B', memberValue, true);
            }
        }
    }
    embed.setFooter({ text: 'Wahrnehmung des Termins ist bei Anmeldung verpflichtend!' });
    return embed;
};
