import express from 'express';

import * as optionController from '../controllers/options.js';

const router = express.Router();

router.get('/getStates', optionController.getStates);

export default router;
