import { Class, Event, Party, PartyMember } from '@prisma/client';
import { MessageEmbed } from 'discord.js';
import { MemberEventFactory } from '../../models/member-event/member-event-factory';

export const getEmbedMemberEvent = async (
    event: Event & {
        partys: (Party & {
            partyMembers: (PartyMember & {
                class: Class;
            })[];
        })[];
    },
    spareParty: Party & {
        partyMembers: (PartyMember & {
            class: Class;
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

    const maxColumnSize = 4;
    for (let partyIndex = 1; partyIndex <= event.partys.length; partyIndex++) {
        const party = event.partys[partyIndex - 1];
        if (!party.partyMembers.length && !party.description) continue;
        let groupTitle = '';
        if (party.isDone) groupTitle += '~~';
        groupTitle += `Group ${partyIndex}`;
        if (party.isDone) groupTitle += '~~';

        let memberValue = '';
        let columnCount = 1;
        for (let memberIndex = 1; memberIndex <= party.partyMembers.length; memberIndex++) {
            memberValue += party.isDone ? '\n~~' : '\n';
            const member = party.partyMembers[memberIndex - 1];
            memberValue += `#${member.memberNo} ${memberEventFactory.toIconString(member.class)}[${
                member.charNo
            }] <@${member.userId}>`;
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
                    if (columnCount % 2 === 0 && party.partyMembers.length > memberIndex) {
                        embed.addField('\u200B', '\u200B');
                    }
                    memberValue = '';
                }
                columnCount++;
            }
        }
        embed.addField('\u200B', '\u200B');
    }
    let memberValue = '';
    let columnCount = 1;
    const groupTitle = 'Ersatzbank';
    for (let memberIndex = 1; memberIndex <= spareParty.partyMembers.length; memberIndex++) {
        memberValue += '\n';
        const member = spareParty.partyMembers[memberIndex - 1];
        memberValue += `#${member.memberNo} ${memberEventFactory.toIconString(member.class)}[${
            member.charNo
        }] <@${member.userId}>`;

        if (memberIndex % maxColumnSize === 0 || memberIndex === spareParty.partyMembers.length) {
            if (columnCount === 1) {
                embed.addField(groupTitle, memberValue, true);
                memberValue = '';
            } else {
                embed.addField('\u200B', memberValue, true);
                if (columnCount % 2 === 0 && spareParty.partyMembers.length > memberIndex) {
                    embed.addField('\u200B', '\u200B');
                }
                memberValue = '';
            }
            columnCount++;
        }
    }
    embed.setFooter({ text: 'Wahrnehmung des Termins ist bei Anmeldung verpflichtend!' });
    return embed;
};
