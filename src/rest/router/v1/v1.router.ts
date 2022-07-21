import { Router } from 'express';
import { checkJwt } from '../../middlewares/check-jwt.middleware';
import { AUTH_ROUTER } from './auth/auth.router';
import DISCORD_ROUTER from './discord/discord.router';
import EVENT_ROUTER from './events/event.router';

const V1_ROUTER = Router({ mergeParams: true });

V1_ROUTER.use('/', AUTH_ROUTER);

V1_ROUTER.use('/discord', DISCORD_ROUTER);

V1_ROUTER.use('/events', checkJwt, EVENT_ROUTER);

export default V1_ROUTER;
