import { Tspec } from "tspec";
import { FetchHeatmapResponse, InferSymptomsAndCauseRequest, InferSymptomsAndCauseResponse } from "./generated/analytics_service";
import { SymptomReport } from "./generated/symptom_report";

export type GatewayApiSpec = Tspec.DefineApiSpec<{
    paths: {
        // User
        "/api/users/@me": {
            get: {
                summary: "Get the authenticated user's details",
                header: {
                    Authorization: string
                },
                responses: {
                    200: {},
                    400: {
                        message: string
                    },
                }
            }
        },

        // Reports
        "/api/reports": {
            get: {
                summary: "Get all reports for the authenticated user",
                header: {
                    Authorization: string
                },
                responses: {
                    200: { reports: SymptomReport[] },
                    400: {
                        message: string
                    },
                    401: {
                        message: "Unauthorized"
                    }
                }
            },
            post: {
                summary: "Create a new report",
                header: {
                    Authorization: string
                },
                body: InferSymptomsAndCauseRequest & { location: { lat: number, lon: number } },
                responses: {
                    200: InferSymptomsAndCauseResponse,
                    400: {
                        message: string
                    },
                    401: {
                        message: "Unauthorized"
                    }
                }
            }
        },

        // Heatmap
        "/api/heatmap": {
            get: {
                summary: "Get heatmap data points",
                query: {
                    timespan: "HOUR" | "DAY" | "WEEK" | "MONTH",
                    similarity: string[] | string | ""
                },
                responses: {
                    200: FetchHeatmapResponse,
                    400: {
                        message: string
                    },
                    401: {
                        message: "Unauthorized"
                    }
                }
            }
        }
    }
}>