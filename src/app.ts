import express, { NextFunction, Response, Request } from "express";
export const app = express();
import mongoose from "mongoose";
import auth from "./routes/auth";

import events from "./routes/events";

app.use(express.json());

app.use("/v1/auth", auth);
app.use("/v1/events", events);

const serverPort = process.env.PORT || 3000;
app.listen(serverPort, async () => {
  console.log(`Server is running on port ${serverPort}, using "${process.env.DB}" database`);
  await mongoose.connect(`mongodb://127.0.0.1:27017/${process.env.DB}`);
});



export default app;
