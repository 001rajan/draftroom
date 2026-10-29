import {Router} from "express";
import Report from "../models/Report.js";
import Story from "../models/Story.js";
import User from "../models/User.js";
import authRequired from "../middleware/authRequired.js";
import {validateReport} from "../src/validation.js";

const router=Router();
const requireAdmin=async(req,res,next)=>{
  try{
    const user=await User.findById(req.userId).select("role");
    if(user?.role!=="admin")return res.status(403).json({message:"Administrator access required"});
    next();
  }catch(err){next(err);}
};

router.post("/stories/:storyId",authRequired,async(req,res,next)=>{
  try{
    const error=validateReport(req.body);
    if(error)return res.status(400).json({message:error});
    const story=await Story.findOne({_id:req.params.storyId,status:"published"});
    if(!story)return res.status(404).json({message:"Story not found"});
    if(await Report.exists({storyId:story._id,reporterId:req.userId,status:"open"}))return res.status(409).json({message:"You already have an open report for this story"});
    const report=await Report.create({storyId:story._id,reporterId:req.userId,...req.body});
    res.status(201).json({id:report._id,status:report.status});
  }catch(err){next(err);}
});

router.get("/",authRequired,requireAdmin,async(_req,res,next)=>{
  try{res.json(await Report.find().populate("storyId","title status").populate("reporterId","username email").sort({createdAt:1}));}
  catch(err){next(err);}
});

router.patch("/:id",authRequired,requireAdmin,async(req,res,next)=>{
  try{
    if(!["reviewed","resolved","hide-story"].includes(req.body.action))return res.status(400).json({message:"Choose a valid moderation action"});
    const report=await Report.findById(req.params.id);
    if(!report)return res.status(404).json({message:"Report not found"});
    if(req.body.action==="hide-story"){
      await Story.updateOne({_id:report.storyId},{$set:{status:"hidden"}});
      report.status="resolved";
    }else report.status=req.body.action;
    report.reviewedBy=req.userId;
    await report.save();
    res.json(report);
  }catch(err){next(err);}
});

export default router;