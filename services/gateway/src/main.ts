import 'dotenv/config'
import express from 'express';
import { clerkClient, clerkMiddleware, getAuth, requireAuth } from '@clerk/express'

import { AnalyticsServiceClient } from './clients';

import * as AnalyticsService from './generated/analytics_service';

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

  return;
});

app.get('/api/report', requireAuth(), async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).send({ 'message': 'Unauthorized' });
  }

  const user = await clerkClient.users.getUser(userId);

  return;
});

app.get('/api/heatmap', /*requireAuth(),*/ async (req, res) => {
  //const { userId } = getAuth(req)
  //if (!userId) {
  //  return res.status(401).send({ 'message': 'Unauthorized' });
  //}

  // Fetch heatmap based on query.
  const time = Number.isNaN(Number(req.query.time)) ? undefined : Number(req.query.time);

  let similarity: string[] = [];
  if (req.query.similarity) {
    // Check if similarity is a string.
    if (typeof req.query.similarity === 'string') {
      similarity.push(req.query.similarity);
    } else if (Array.isArray(req.query.similarity)) {
      similarity = req.query.similarity as string[];
    }
  }

  const fetchRes = await AnalyticsServiceClient.FetchHeatmap(
    AnalyticsService.FetchHeatmapRequest.create({
      time: time,
      similarity: similarity
    })
  );

  res.send(fetchRes);

  return;
});