import {
	clerkMiddleware,
	createClerkClient,
	getAuth,
	requireAuth,
} from '@clerk/express';
import 'dotenv/config';
import express, { Request, Response } from 'express';

import * as HeatmapRoutes from './routes/heatmap';
import * as InternalRoutes from './routes/internal';
import * as ReportRoutes from './routes/reports';

import { clerkClient } from './clerk';

const host = process.env.HOST ?? '0.0.0.0';
const port = process.env.PORT ? Number(process.env.PORT) : 3000;

const app = express();

app.use(
	clerkMiddleware({
		clerkClient,
		publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
	}),
);
app.use(express.json());

app.listen(port, host, () => {
	console.log(`[ ready ] http://${host}:${port}`);
});

ReportRoutes.build(app);
HeatmapRoutes.build(app);
InternalRoutes.build(app);

/*
app.get("/api/reports", async (req, res) => {
  const auth = getAuth(req);
  console.log("Auth object:", auth);
  console.log("Headers:", req.headers);

  // Handle pending sessions - they're valid but not fully activated
  if (
    !auth.userId ||
    (auth.sessionStatus !== "active" && auth.sessionStatus !== "pending")
  ) {
    console.log("Unauthorized request to /api/reports. Auth status:", auth);
    return res.status(401).send({ message: "Unauthorized" });
  }
  const { data, error } = await supabase
    .from("reports")
    .select("*")
    .eq("user_id", auth.userId);

  if (error) {
    console.log("Error fetching reports from database:", error);
    return res.status(500).send({ message: "Failed to fetch reports" });
  }

  res.send({ reports: data });

  return;
});

app.post("/api/reports", async (req, res) => {
  console.log("Received /api/reports request with body:", req.body);
  const auth = getAuth(req);

  // Handle pending sessions - they're valid but not fully activated
  if (
    !auth.userId ||
    (auth.sessionStatus !== "active" && auth.sessionStatus !== "pending")
  ) {
    console.log("Unauthorized request to /api/reports. Auth status:", auth);
    return res.status(401).send({ message: "Unauthorized" });
  }

  console.log(req.body);
  const reportRes = await AnalyticsServiceClient.InferSymptomsAndCause(
    AnalyticsService.InferSymptomsAndCauseRequest.create({
      text: req.body.text,
    })
  );

  console.log("InferSymptomsAndCause response:", reportRes);

  if (!reportRes.success) {
    return res.status(400).send({ message: "Failed to analyze symptoms" });
  }

  const { data, error } = await supabase.from("reports").insert({
    user_id: auth.userId,
    timestamp: new Date(),
    symptoms: reportRes.symptoms,
    cause: reportRes.cause,
    notes: null,
    lat: req.body.location?.lat,
    lon: req.body.location?.lon,
  });

  if (error) {
    console.log("Error inserting report into database:", error);
    return res.status(500).send({ message: "Failed to save report" });
  }

  console.log("Inserted report into database:", data);

  res.send(reportRes);

  return;
});

app.get(
  "/api/heatmap", async (req, res) => {
    //const { userId } = getAuth(req)
    //if (!userId) {
    //  return res.status(401).send({ 'message': 'Unauthorized' });
    //}

    console.log("Received /api/heatmap request with query:", req.query);

    // Validate query parameters.
    if (
      typeof req.query.timespan !== "string" &&
      req.query.timespan !== undefined
    ) {
      return res.status(400).send({ message: "Invalid timespan" });
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
        return res.status(400).send({ message: "Invalid timespan" });
    }

    let similarity: string[] = [];
    if (req.query.similarity) {
      // Check if similarity is a string.
      if (typeof req.query.similarity === "string") {
        similarity.push(req.query.similarity);
      } else if (Array.isArray(req.query.similarity)) {
        similarity = req.query.similarity as string[];
      }
    }

    const fetchRes = await AnalyticsServiceClient.FetchHeatmap(
      AnalyticsService.FetchHeatmapRequest.create({
        timespan: timespan,
        similarity: similarity,
      })
    );

    res.send(fetchRes);

    return;
  }
);
*/
