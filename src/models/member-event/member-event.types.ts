import { Event } from '@prisma/client';
export type TMemberEvents = {
    CREATE_EVENT: {
        type: 'CREATE_EVENT';
        creatorId: string;
        dds: number;
        supps: number;
        free: number;
        name: string;
        channelId: string;
        roleNames: string[];
    };
    REMOVE_EVENT: {
        type: 'REMOVE_EVENT';
        eventId: number;
        actionUserId: string;
    };
    UPDATE_EVENT_DESC: {
        type: 'UPDATE_EVENT_DESC';
        eventId: number;
        description: string;
        actionUserId: string;
    };
    UPDATE_PARTY_DESC: {
        type: 'UPDATE_PARTY_DESC';
        eventId: number;
        partyNumber: number;
        description: string;
        actionUserId: string;
    };
    ADD_MEMBER: {
        type: 'ADD_MEMBER';
        eventId: number;
        classIcon: string;
        userId: string;
        actionUserId: string;
    };
    REMOVE_MEMBER_BY_USER_ID: {
        type: 'REMOVE_MEMBER_BY_USER_ID';
        eventId: number;
        charNumber: number;
        userId: string;
        actionUserId: string;
    };
    REMOVE_MEMBER_BY_PARTY_NUMBER: {
        type: 'REMOVE_MEMBER_BY_PARTY_NUMBER';
        eventId: number;
        memberNumber: number;
        partyNumber: number;
        actionUserId: string;
    };
    MOVE_MEMBER: {
        type: 'MOVE_MEMBER';
        eventId: number;
        member: { memberNumber: number; partyNumber: number };
        newPartyNumber: number;
        actionUserId: string;
    };
    SWITCH_MEMBERS: {
        type: 'SWITCH_MEMBERS';
        eventId: number;
        memberOne: { memberNumber: number; partyNumber: number };
        memberTwo: { memberNumber: number; partyNumber: number };
        actionUserId: string;
    };
    PARTY_IS_DONE: {
        type: 'PARTY_IS_DONE';
        eventId: number;
        partyNumber: number;
        actionUserId: string;
    };
    EVENT_IS_DONE: {
        type: 'EVENT_IS_DONE';
        eventId: number;
        actionUserId: string;
    };
    UPDATE_EVENT_NAME: {
        type: 'UPDATE_EVENT_NAME';
        eventId: number;
        newEventName: string;
        actionUserId: string;
    };
};

export type TMemberEventName = keyof TMemberEvents;

export type TMemberEvent = TMemberEvents[keyof TMemberEvents];

export type TActionresult = { actionLog: string | null; event: Event };
