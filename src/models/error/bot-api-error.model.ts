import { AApiError } from '@bits_devel/api-error2';
import { TIOApiErrorCodes } from '@bits_devel/socket.io-server2/models/io-api-error';

export type TExpandedBotApiErrorCodes = TIOApiErrorCodes;

export class BotApiError extends AApiError<TExpandedBotApiErrorCodes> {}
