import { Router } from 'express';
import { DiscordController } from '../../../controllers/discord.controller';
import { checkJwt } from '../../../middlewares/check-jwt.middleware';
const DISCORD_ROUTER = Router();

DISCORD_ROUTER.get('/', checkJwt, new DiscordController().getDiscordInfo());

export default DISCORD_ROUTER;
