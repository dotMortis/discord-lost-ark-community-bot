import { Router } from 'express';
import { AuthController } from '../../../controllers/auth.controller';
import { checkJwt } from '../../../middlewares/check-jwt.middleware';

export const AUTH_ROUTER = Router({ mergeParams: true });

AUTH_ROUTER.get('/login', AuthController.login());
AUTH_ROUTER.get('/logout', checkJwt, AuthController.logout());
AUTH_ROUTER.get('/authenticated', checkJwt, AuthController.authenticated());
