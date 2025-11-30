import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import labRouter from "./routes/lab";
import deviceRouter from"./routes/devices";
import relayRoutes from "./routes/relay";
import { processAlarmsHandler } from "./controllers/alram.controllers";
import cron from "node-cron"
import alarmRoutes from "./routes/alarm";
import settingsRoutes from "./routes/settings";
import analyticsRoutes from "./routes/analytics"
const app = express();
const PORT =3001;

app.use(express.json());
app.use(cors({
  origin:true,
  credentials:true
}));
app.use(cookieParser());

console.log("starting backend");
cron.schedule("* * * * *", async () => {
  try {
    await processAlarmsHandler({} as any, { status: () => ({ json: () => null }) } as any, () => {})
  } catch (err) {
    console.log("Alarm processor error:", err)
  }
})
// Log all incoming requests
app.use((req, _res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Simple test route
app.get("/home", (req, res) => {
  console.log("✅ /home reached");
  res.send("Server is alive ✅");
});
// Routers
 app.use('/auth', authRouter) 
app.use ('/lab',labRouter)
app.use('/devices', deviceRouter);
app.use("/relay", relayRoutes);
app.use("/alarms", alarmRoutes);
app.use("/settings", settingsRoutes);
app.use("/analytics", analyticsRoutes)
// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});



app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://192.168.230.115:${PORT}`);
});
