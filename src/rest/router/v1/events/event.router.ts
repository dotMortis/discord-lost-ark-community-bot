import { Router } from 'express';
import { EventController } from '../../../controllers/event.controller';

const EVENT_ROUTER = Router();

EVENT_ROUTER.route('/').get(new EventController().getList()).post(new EventController().post());
EVENT_ROUTER.route('/:eventId')
    .get(new EventController().getOne())
    .patch(new EventController().patch());

export default EVENT_ROUTER;
