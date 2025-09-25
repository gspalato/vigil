import 'dotenv/config'
import express, { Request, Response } from 'express';
import * as core from "express-serve-static-core";
import { clerkClient, clerkMiddleware, getAuth, requireAuth } from '@clerk/express'

import { AnalyticsServiceClient } from './clients';

import * as AnalyticsService from './generated/analytics_service';
import { ReadingTimespan } from './generated/reading';

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(clerkMiddleware())

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

app.get('/api/reports', requireAuth(), async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).send({ 'message': 'Unauthorized' });
  }

  const user = await clerkClient.users.getUser(userId);

  return;
});

app.post('/api/reports', async (req, res) => {
  const { userId } = getAuth(req)
  if (!userId) {
    return res.status(401).send({ 'message': 'Unauthorized' });
  }

  const user = await clerkClient.users.getUser(userId);
  if (!user) {
    return res.status(401).send({ 'message': 'Unauthorized' });
  }

  console.log("Received /api/reports request with body:", req.body);

  const reportRes = await AnalyticsServiceClient.InferSymptomsAndCause(
    AnalyticsService.InferSymptomsAndCauseRequest.create({
      text: req.body.text
    })
  )

  console.log("InferSymptomsAndCause response:", reportRes);

  if (!reportRes.success) {
    return res.status(400).send({ 'message': 'Failed to analyze symptoms' });
  }

  res.send(reportRes);

  return;
});

app.get('/api/heatmap', /*requireAuth(),*/ async (req, res) => {
  //const { userId } = getAuth(req)
  //if (!userId) {
  //  return res.status(401).send({ 'message': 'Unauthorized' });
  //}

  console.log("Received /api/heatmap request with query:", req.query);

  // Validate query parameters.
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