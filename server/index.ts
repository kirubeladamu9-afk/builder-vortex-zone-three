import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import {
  callNext,
  complete,
  createTicket,
  displayData,
  listWindows,
  recall,
  seedDemo,
  skip,
  sseHandler,
  transfer,
} from "./routes/queue";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // Queue/Teller API
  app.get("/api/events", sseHandler); // SSE
  app.post("/api/tickets", createTicket);
  app.get("/api/windows", listWindows);
  app.post("/api/windows/:id/call-next", callNext);
  app.post("/api/windows/:id/recall", recall);
  app.post("/api/windows/:id/complete", complete);
  app.post("/api/windows/:id/skip", skip);
  app.post("/api/windows/:id/transfer", transfer);
  app.get("/api/display", displayData);
  app.post("/api/seed", seedDemo);

  return app;
}
