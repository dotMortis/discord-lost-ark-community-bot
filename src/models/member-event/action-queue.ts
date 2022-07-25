import { logger } from '@bits_devel/logger';
import EventEmitter from 'events';
import { v4 } from 'uuid';

export abstract class ActionQueue<
    EVENT_DATA extends { [P: string]: { type: string } }
> extends EventEmitter {
    private __isInit: boolean;
    private __actionQueue: Map<
        string,
        {
            items: Array<{
                uid: string;
                data: EVENT_DATA[keyof EVENT_DATA];
            }>;
            runAgain: boolean;
            isRunning: boolean;
        }
    >;

    constructor() {
        super();
        this.__isInit = false;
        this.__actionQueue = new Map<
            string,
            {
                items: Array<{
                    uid: string;
                    data: EVENT_DATA[keyof EVENT_DATA];
                }>;
                runAgain: boolean;
                isRunning: boolean;
            }
        >();
        this.on('ACTION', async (data, groupIdent) => {
            try {
                const queueItem = this.__actionQueue.get(groupIdent);
                if (queueItem != null) queueItem.items.push(data);
                else {
                    this.__actionQueue.set(groupIdent, {
                        items: [data],
                        isRunning: false,
                        runAgain: false
                    });
                }
                await this.__runQueue(groupIdent);
            } catch (error: any) {
                logger.error(error);
            }
        });
    }

    //#region events emitter
    public on<ACTION_DATA_NAME extends keyof EVENT_DATA>(
        eventName: 'ACTION',
        cb: (data: { data: EVENT_DATA[ACTION_DATA_NAME]; uid: string }, groupIdent: string) => void
    ): this {
        return super.on(eventName, cb);
    }

    public emit<ACTION_DATA_NAME extends keyof EVENT_DATA>(
        eventName: 'ACTION',
        data: { data: EVENT_DATA[ACTION_DATA_NAME]; uid: string; groupIdent: string }
    ): boolean {
        return super.emit(eventName, data);
    }

    public async action<ACTION_DATA_NAME extends keyof EVENT_DATA>(
        actionData: EVENT_DATA[ACTION_DATA_NAME],
        groupIdent: string
    ): Promise<void> {
        this.__isInitCheck();
        const currUid = v4();
        this.emit('ACTION', { data: actionData, uid: currUid, groupIdent });
        return new Promise<void>((res, rej) => {
            const cb = (uid: string, data: EVENT_DATA[ACTION_DATA_NAME], error?: Error) => {
                if (uid === currUid) {
                    this.removeListener(actionData.type, cb);
                    if (error) rej();
                    else res();
                }
            };
            this.__onActionEnd(actionData.type, cb);
        });
    }

    private __emitActionEnd<ACTION_DATA_NAME extends keyof EVENT_DATA>(
        action: EVENT_DATA[ACTION_DATA_NAME]['type'],
        data: { uid: string; data: EVENT_DATA[ACTION_DATA_NAME]; error?: Error }
    ): boolean {
        this.__isInitCheck();
        return super.emit(action, data.uid, data.data, data.error);
    }

    private __onActionEnd<ACTION_DATA_NAME extends keyof EVENT_DATA>(
        action: EVENT_DATA[ACTION_DATA_NAME]['type'],
        cb: (uid: string, data: EVENT_DATA[ACTION_DATA_NAME], error?: Error) => void
    ): this {
        return super.on(action, cb);
    }
    //#endregion

    public async queueAction(data: TActionQueueData<EVENT_DATA>): Promise<void> {
        throw new Error('queueAction not implemented');
    }

    private async __runQueue(groupIdent: string): Promise<void> {
        const queueData = this.__actionQueue.get(groupIdent);
        if (queueData == null) return;
        if (queueData.isRunning) {
            queueData.runAgain = queueData.isRunning;
            return;
        }
        queueData.isRunning = true;
        let isRerun = false;
        do {
            isRerun = queueData.runAgain;
            let actionData:
                | {
                      uid: string;
                      data: EVENT_DATA[keyof EVENT_DATA];
                  }
                | undefined;
            while ((actionData = queueData.items.shift())) {
                try {
                    await this.queueAction(actionData);
                    this.__emitActionEnd(actionData.data.type, actionData);
                } catch (error: any) {
                    this.__emitActionEnd(actionData.data.type, { ...actionData, error });
                    logger.error(error);
                }
            }

            if (isRerun) queueData.runAgain = isRerun = false;
        } while (queueData.runAgain);
        if (queueData.items.length === 0) this.__actionQueue.delete(groupIdent);
        queueData.isRunning = false;
    }

    private __isInitCheck(): void {
        if (!this.__isInit) throw new Error('MemberEventFactory not initialized');
    }
}

export type TActionQueueData<EVENT_DATA extends { [P: string]: { type: string } }> = {
    uid: string;
    data: EVENT_DATA[keyof EVENT_DATA];
};
