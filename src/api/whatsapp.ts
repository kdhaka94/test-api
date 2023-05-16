import express from 'express';
import { handleLocationMessage } from '../utils/chat';

const router = express.Router();

type EmojiResponse = string[];

router.get<{}, EmojiResponse | string>('/', async (req, res) => {
  try {
    const message = req.body;
    const location = {
      latitude: message.Latitude,
      longitude: message.Longitude,
    };
    console.log({ location, message });
    await handleLocationMessage(location, message.From, message.Body);
  } catch (err: any) {
    console.error('Error handling incoming message:', err.message);
    res.status(500).send('Internal server error');
  }
  res.json(['😀', '😳', '🙄']);
});

export default router;
