import {Router} from "express";
import User from "../models/User.js";
import Story from "../models/Story.js";
import authRequired from "../middleware/authRequired.js";
import {validateProfile} from "../src/validation.js";

const router=Router();

router.get("/:username",async(req,res,next)=>{
  try{
    const user=await User.findOne({username:req.params.username}).select("username bio createdAt followingIds");
    if(!user)return res.status(404).json({message:"Writer not found"});
    const stories=await Story.find({ownerId:user._id,status:"published"}).sort({createdAt:-1});
    res.json({id:user._id,username:user.username,bio:user.bio,joinedAt:user.createdAt,followingCount:user.followingIds.length,stories:stories.map(story=>({id:story._id,title:story.title,description:story.description,genre:story.genre,views:story.stats.views}))});
  }catch(err){next(err);}
});

router.patch("/me",authRequired,async(req,res,next)=>{
  try{
    const error=validateProfile(req.body);
    if(error)return res.status(400).json({message:error});
    const username=req.body.username.trim();
    const duplicate=await User.exists({username,_id:{$ne:req.userId}});
    if(duplicate)return res.status(409).json({message:"That writer name is already in use"});
    const user=await User.findByIdAndUpdate(req.userId,{$set:{username,bio:req.body.bio||""}},{new:true,runValidators:true}).select("username email bio");
    res.json(user);
  }catch(err){next(err);}
});

router.get("/:id/follow-state",authRequired,async(req,res,next)=>{
  try{
    const user=await User.findById(req.userId).select("followingIds");
    if(!user)return res.status(404).json({message:"Writer not found"});
    res.json({following:user.followingIds.some(id=>id.equals(req.params.id))});
  }catch(err){next(err);}
});

router.post("/:id/follow",authRequired,async(req,res,next)=>{
  try{
    if(req.params.id===req.userId)return res.status(400).json({message:"You cannot follow yourself"});
    const target=await User.findById(req.params.id);
    const viewer=await User.findById(req.userId);
    if(!target||!viewer)return res.status(404).json({message:"Writer not found"});
    const isFollowing=viewer.followingIds.some(id=>id.equals(target._id));
    if(isFollowing){
      viewer.followingIds.pull(target._id);
      await Story.updateMany({ownerId:target._id},[{$set:{"stats.followers":{$max:[0,{$subtract:["$stats.followers",1]}]}}}]);
    }else{
      viewer.followingIds.addToSet(target._id);
      await Story.updateMany({ownerId:target._id},{$inc:{"stats.followers":1}});
    }
    await viewer.save();
    res.json({following:!isFollowing});
  }catch(err){next(err);}
});

export default router;