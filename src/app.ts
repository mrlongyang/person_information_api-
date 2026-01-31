import express from "express";
import personalInfoRoute from "./routes/personalInfo.route";

const app = express();

// Middleware 
app.use(express.json());

// Routes
app.use("/api/v1.0/personal-info", personalInfoRoute);

export default app;