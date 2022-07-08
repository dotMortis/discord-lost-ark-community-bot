/*export enum EMemberEvent {
    CREATE_EVENT = 'CREATE_EVENT',
    REMOVE_EVENT = 'REMOVE_EVENT',
    UPDATE_EVENT_DESC = 'UPDATE_EVENT_DESC',
    UPDATE_PARTY_DESC = 'UPDATE_PARTY_DESC',
    ADD_MEMBER = 'ADD_MEMBER',
    REMOVE_MEMBER_BY_USER_ID = 'REMOVE_MEMBER_BY_USER_ID',
    REMOVE_MEMBER_BY_PARTY_NUMBER = 'REMOVE_MEMBER_BY_PARTY_NUMBER',
    MOVE_MEMBER = 'MOVE_MEMBER',
    SWITCH_MEMBERS = 'SWITCH_MEMBERS',
    PARTY_IS_DONE = 'PARTY_IS_DONE',
    EVENT_IS_DONE = 'EVENT_IS_DONE',
    UPDATE_EVENT_NAME = 'UPDATE_EVENT_NAME'
}*/

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

/*
export type TCreateEvent = {
    type: EMemberEvent.CREATE_EVENT;
    creatorId: string;
    dds: number;
    supps: number;
    free: number;
    name: string;
    channelId: string;
    roleNames: string[];
};
export type TRemoveEvent = {
    type: EMemberEvent.REMOVE_EVENT;
    eventId: number;
    actionUserId: string;
};
export type TUpdateEventName = {
    type: EMemberEvent.UPDATE_EVENT_NAME;
    eventId: number;
    newEventName: string;
    actionUserId: string;
};
export type TUpdateEventDesc = {
    type: EMemberEvent.UPDATE_EVENT_DESC;
    eventId: number;
    description: string;
    actionUserId: string;
};
export type TUpdateParytDesc = {
    type: EMemberEvent.UPDATE_PARTY_DESC;
    eventId: number;
    partyNumber: number;
    description: string;
    actionUserId: string;
};
export type TAddMember = {
    type: EMemberEvent.ADD_MEMBER;
    eventId: number;
    classIcon: string;
    userId: string;
    actionUserId: string;
};
export type TRemoveMemberByUserId = {
    type: EMemberEvent.REMOVE_MEMBER_BY_USER_ID;
    eventId: number;
    charNumber: number;
    userId: string;
    actionUserId: string;
};
export type TRemoveMemberByPartyNumber = {
    type: EMemberEvent.REMOVE_MEMBER_BY_PARTY_NUMBER;
    eventId: number;
    memberNumber: number;
    partyNumber: number;
    actionUserId: string;
};
export type TSwitchMembers = {
    type: EMemberEvent.SWITCH_MEMBERS;
    eventId: number;
    memberOne: { memberNumber: number; partyNumber: number };
    memberTwo: { memberNumber: number; partyNumber: number };
    actionUserId: string;
};
export type TMoveMember = {
    type: EMemberEvent.MOVE_MEMBER;
    eventId: number;
    member: { memberNumber: number; partyNumber: number };
    newPartyNumber: number;
    actionUserId: string;
};
export type TPartyIsDone = {
    type: EMemberEvent.PARTY_IS_DONE;
    eventId: number;
    partyNumber: number;
    actionUserId: string;
};
export type TEventIsDone = {
    type: EMemberEvent.EVENT_IS_DONE;
    eventId: number;
    actionUserId: string;
};
*/
