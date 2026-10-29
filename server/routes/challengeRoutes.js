import {Router} from "express";
import Challenge from "../models/Challenge.js";
import Submission from "../models/Submission.js";
import User from "../models/User.js";
import authRequired from "../middleware/authRequired.js";
import {validateChallenge,validateSubmission} from "../src/validation.js";

const router=Router();
const requireAdmin=async(req,res,next)=>{
  try{
    const user=await User.findById(req.userId).select("role");
    if(user?.role!=="admin")return res.status(403).json({message:"Administrator access required"});
    next();
  }catch(err){next(err);}
};

router.get("/",async(_req,res,next)=>{
  try{
    const now=new Date();
    const challenges=await Challenge.find({status:{$ne:"draft"}}).sort({endsAt:1});
    const submissions=await Submission.aggregate([{$group:{_id:"$challengeId",count:{$sum:1}}}]);
    const counts=new Map(submissions.map(item=>[item._id.toString(),item.count]));
    res.json(challenges.map(challenge=>({...challenge.toObject(),status:challenge.status==="closed"||challenge.endsAt<=now?"closed":challenge.startsAt>now?"upcoming":"open",participants:counts.get(challenge._id.toString())||0})));
  }catch(err){next(err);}
});

router.post("/",authRequired,requireAdmin,async(req,res,next)=>{
  try{
    const error=validateChallenge(req.body);
    if(error)return res.status(400).json({message:error});
    if(req.body.status!=="open")return res.status(400).json({message:"New challenges must start open"});
    const challenge=await Challenge.create({...req.body,createdBy:req.userId,status:"open"});
    res.status(201).json(challenge);
  }catch(err){next(err);}
});

router.get("/:id/submissions",authRequired,async(req,res,next)=>{
  try{
    const challenge=await Challenge.findById(req.params.id);
    if(!challenge)return res.status(404).json({message:"Challenge not found"});
    const user=await User.findById(req.userId).select("role");
    const challengeIsOpen=challenge.status==="open"&&challenge.endsAt>new Date();
    const query=challengeIsOpen&&user?.role!=="admin"
      ?{challengeId:challenge._id,userId:req.userId}
      :{challengeId:challenge._id};
    const submissions=await Submission.find(query)
      .populate("userId","username")
      .sort({createdAt:-1});
    res.json(submissions);
  }catch(err){next(err);}
});

router.get("/:id/leaderboard",async(req,res,next)=>{
  try{
    const challenge=await Challenge.findById(req.params.id);
    if(!challenge)return res.status(404).json({message:"Challenge not found"});
    const winners=await Submission.find({challengeId:challenge._id,status:"winner"})
      .populate("userId","username")
      .sort({updatedAt:-1});
    res.json(winners);
  }catch(err){next(err);}
});

router.post("/:id/join",authRequired,async(req,res,next)=>{
  try{
    const challenge=await Challenge.findOne({_id:req.params.id,status:"open",startsAt:{$lte:new Date()},endsAt:{$gt:new Date()}});
    if(!challenge)return res.status(404).json({message:"This challenge is not currently open"});
    const error=validateSubmission(req.body);
    if(error)return res.status(400).json({message:error});
    const submission=await Submission.findOneAndUpdate(
      {challengeId:challenge._id,userId:req.userId},
      {$set:{title:req.body.title.trim(),body:req.body.body.trim(),status:"submitted"}},
      {new:true,upsert:true,runValidators:true,setDefaultsOnInsert:true}
    );
    res.status(201).json(submission);
  }catch(err){next(err);}
});

router.patch("/:id/winner",authRequired,requireAdmin,async(req,res,next)=>{
  try{
    const submission=await Submission.findOneAndUpdate(
      {_id:req.body.submissionId,challengeId:req.params.id},
      {$set:{status:"winner"}},
      {new:true}
    ).populate("userId","username");
    if(!submission)return res.status(404).json({message:"Submission not found"});
    res.json(submission);
  }catch(err){next(err);}
});

export default router;