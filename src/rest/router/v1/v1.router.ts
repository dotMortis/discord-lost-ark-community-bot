import { Router } from 'express';
import { AUTH_ROUTER } from './auth/auth.router';
import DISCORD_ROUTER from './discord/discord.router';

const V1_ROUTER = Router({ mergeParams: true });

V1_ROUTER.use('/', AUTH_ROUTER);

V1_ROUTER.use('/discord', DISCORD_ROUTER);

export default V1_ROUTER;
