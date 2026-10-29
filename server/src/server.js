import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import rateLimit from "express-rate-limit";
import path from "node:path";
import {fileURLToPath} from "node:url";
import storyRoutes from "../routes/storyRoutes.js";
import authRoutes from "../routes/authRoutes.js";
import challengeRoutes from "../routes/challengeRoutes.js";
import interactionRoutes from "../routes/interactionRoutes.js";
import profileRoutes from "../routes/profileRoutes.js";
import analyticsRoutes from "../routes/analyticsRoutes.js";
import reportRoutes from "../routes/reportRoutes.js";

dotenv.config();
if(!process.env.JWT_SECRET||process.env.JWT_SECRET.length<32){
  throw new Error("Set JWT_SECRET to a random value of at least 32 characters in server/.env");
}
const app = express();
const clientDist=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"../../client/dist");
app.use(cors({origin:process.env.CLIENT_URL||process.env.RENDER_EXTERNAL_URL||"http://localhost:5173"}));
app.use(express.json());
const authLimiter=rateLimit({windowMs:15*60*1000,limit:30,standardHeaders:"draft-8",legacyHeaders:false,message:{message:"Too many account requests. Try again later."}});
app.use("/api/auth",authLimiter);
app.use("/api/reports",rateLimit({windowMs:60*60*1000,limit:10,standardHeaders:"draft-8",legacyHeaders:false,message:{message:"Too many reports. Try again later."}}));
app.get("/api/health", (_req,res)=>res.json({ok:true,service:"draftroom-api"}));
app.use("/api/auth", authRoutes);
app.use("/api/challenges", challengeRoutes);
app.use("/api/interactions", interactionRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/stories", storyRoutes);
app.use(express.static(clientDist));
app.use((req,res,next)=>{
  if(req.method!=="GET"||req.path.startsWith("/api/"))return next();
  res.sendFile(path.join(clientDist,"index.html"),err=>{if(err)next(err);});
});
app.use((err,_req,res,_next)=>{
  console.error(err);
  res.status(err.status||500).json({message:err.status&&err.status<500?err.message:"Unexpected server error"});
});

const PORT=process.env.PORT||5000;
const URI=process.env.MONGODB_URI||"mongodb://127.0.0.1:27017/draftroom";

mongoose.connect(URI)
  .then(()=>app.listen(PORT,()=>console.log(`Draftroom API: http://localhost:${PORT}`)))
  .catch(err=>{console.error("MongoDB connection failed:",err.message);process.exit(1);});