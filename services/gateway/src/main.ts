import 'dotenv/config'
import express from 'express';
import { clerkClient, clerkMiddleware, getAuth, requireAuth } from '@clerk/express'

const host = process.env.HOST ?? 'localhost';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(clerkMiddleware())

app.get('/', (req, res) => {
    res.send({ 'message': 'Hello API'});
});

app.listen(port, host, () => {
    console.log(`[ ready ] http://${host}:${port}`);
});

app.get('/api/users/@me', requireAuth(), async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).send({ 'message': 'Unauthorized' });
  }

  const user = await clerkClient.users.getUser(userId)
  res.send({ user });
});

app.get('/api/report', requireAuth(), async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).send({ 'message': 'Unauthorized' });
  }

  const user = await clerkClient.users.getUser(userId)
});