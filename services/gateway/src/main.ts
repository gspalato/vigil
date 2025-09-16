import 'dotenv/config'
import express from 'express';
import { clerkClient, clerkMiddleware, getAuth, requireAuth } from '@clerk/express'

import { AnalyticsServiceClient } from './clients';

import * as AnalyticsService from './generated/analytics_service';
import { ReadingTimespan } from './generated/reading';

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

  if (typeof req.query.timespan !== 'string' && req.query.timespan !== undefined) {
    return res.status(400).send({ 'message': 'Invalid timespan' });
  }

  // Fetch heatmap based on query.
  let timespan: ReadingTimespan;
  switch (req.query.timespan?.toLowerCase()) {
    case "hour":
      timespan = ReadingTimespan.HOUR;
      break;
    case "day":
      timespan = ReadingTimespan.DAY;
      break;
    case "week":
      timespan = ReadingTimespan.WEEK;
      break;
    case "month":
      timespan = ReadingTimespan.MONTH;
      break;
    default:
      return res.status(400).send({ 'message': 'Invalid timespan' });
  }

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
      timespan: timespan,
      similarity: similarity
    })
  );

  res.send(fetchRes);

  return;
});