import React, { createContext, useContext, useState } from "react";
import { useClerk, useAuth } from "@clerk/clerk-expo";

import * as API from "./generated/api";
import { createClient } from "./generated/api/client";

// Types
type HeatmapPoint = {
  radius: number;
  location: {
    lat: number;
    lon: number;
  };
  intensity: number;
};

enum FetchHeatmapPointsTimespan {
  HOUR = "HOUR",
  DAY = "DAY",
  WEEK = "WEEK",
  MONTH = "MONTH",
}

// Context
type VigilAPIContextType = {
  heatmapPoints: HeatmapPoint[];
  fetchHeatmapPoints: (params?: {
    timespan?: FetchHeatmapPointsTimespan | `${FetchHeatmapPointsTimespan}`;
  }) => Promise<void>;

  myReports: any[]; // TODO: Define report type
  fetchMyReports: () => Promise<void>;
  reportSymptoms: (
    text: string
  ) => Promise<API.GatewayApiSpecPostApiReportsResponse>;
};

const VigilAPIContext = createContext<VigilAPIContextType | undefined>(
  undefined
);

export const useApi = () => {
  const context = useContext(VigilAPIContext);
  if (!context) {
    throw new Error("useApi must be used within a VigilAPIProvider");
  }
  return context;
};

export const VigilAPIProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const clerkAuth = useAuth();

  const [loading, setLoading] = useState(false);

  const gatewayClientOpenAPISDK = createClient({
    baseUrl: process.env.EXPO_PUBLIC_VIGIL_BACKEND_URL,
  });

  const [heatmapPoints, setHeatmapPoints] = useState<HeatmapPoint[]>([]);
  const fetchHeatmapPoints = async (params?: {
    timespan?: FetchHeatmapPointsTimespan | `${FetchHeatmapPointsTimespan}`;
    similarity?: string[] | string | undefined;
  }) => {
    try {
      const res = await API.gatewayApiSpecGetApiHeatmap({
        query: {
          timespan: params?.timespan ?? "MONTH",
          similarity: params?.similarity ?? "",
        },
        client: gatewayClientOpenAPISDK,
      });

      if (res.error) {
        throw new Error(`Error fetching heatmap points: ${res.error.message}`);
      }

      const points = res.data.heatmapPoints.map((h) => h.points).flat();
      console.log("Fetched heatmap points:", points);
      setHeatmapPoints(points);
    } catch (error) {
      console.error("Failed to fetch heatmap points:", error);
      return;
    }
  };

  const [myReports, setMyReports] = useState<API.SymptomReport[]>([]);
  const fetchMyReports = async () => {
    const res = await API.gatewayApiSpecGetApiReports({
      client: gatewayClientOpenAPISDK,
      headers: {
        Authorization: `Bearer ${clerkAuth.getToken()}`,
      },
    });

    if (res.error) {
      throw new Error(`Error fetching reports: ${res.error.message}`);
    }

    setMyReports(res.data.reports);
  };
  const reportSymptoms = async (text: string) => {
    try {
      const res = await API.gatewayApiSpecPostApiReports({
        body: { text },
        headers: {
          Authorization: `Bearer ${clerkAuth.getToken()}`,
        },
        client: gatewayClientOpenAPISDK,
      });

      if (res.error) {
        throw new Error(`Error reporting symptoms: ${res.error.message}`);
      }

      return res.data;
    } catch (error) {
      console.error("Failed to report symptoms:", error);
      throw error;
    }
  };

  return (
    <VigilAPIContext.Provider
      value={{
        heatmapPoints,
        fetchHeatmapPoints,

        myReports,
        fetchMyReports,
        reportSymptoms,
      }}
    >
      {children}
    </VigilAPIContext.Provider>
  );
};
