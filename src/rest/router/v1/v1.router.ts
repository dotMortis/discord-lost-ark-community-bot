import { Router } from 'express';
import { AUTH_ROUTER } from './auth/auth.router';

const V1_ROUTER = Router({ mergeParams: true });

V1_ROUTER.use('/', AUTH_ROUTER);

export default V1_ROUTER;
