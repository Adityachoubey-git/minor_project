import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";


const app = express();
const PORT =3000;

app.use(express.json());
app.use(cors({
  origin:true,
  credentials:true
}));
app.use(cookieParser());

console.log("starting backend");

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


// 404 handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Global error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ error: err.message || "Server error" });
});



app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Server running at http://0.0.0.0:${PORT}`);
});
