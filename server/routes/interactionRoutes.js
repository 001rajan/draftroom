import {Router} from "express";
import mongoose from "mongoose";
import Story from "../models/Story.js";
import User from "../models/User.js";
import Comment from "../models/Comment.js";
import Activity from "../models/Activity.js";
import authRequired from "../middleware/authRequired.js";

const router=Router();
const publishedStory=id=>Story.findOne({_id:id,status:"published"});

router.get("/bookmarks",authRequired,async(req,res,next)=>{
  try{
    const user=await User.findById(req.userId).select("bookmarkedStoryIds");
    const stories=await Story.find({_id:{$in:user.bookmarkedStoryIds},status:"published"}).populate("ownerId","username").sort({updatedAt:-1});
    res.json(stories.map(story=>({id:story._id,title:story.title,genre:story.genre,description:story.description,preview:(story.description||story.chapters[0]?.body||"").slice(0,280),author:story.ownerId?.username,views:story.stats.views})));
  }catch(err){next(err);}
});

router.get("/:storyId/state",authRequired,async(req,res,next)=>{
  try{
    const story=await publishedStory(req.params.storyId);
    if(!story)return res.status(404).json({message:"Story not found"});
    const user=await User.findById(req.userId).select("likedStoryIds bookmarkedStoryIds");
    res.json({liked:user.likedStoryIds.some(id=>id.equals(story._id)),bookmarked:user.bookmarkedStoryIds.some(id=>id.equals(story._id))});
  }catch(err){next(err);}
});

router.get("/:storyId/comments",async(req,res,next)=>{
  try{
    if(!await publishedStory(req.params.storyId))return res.status(404).json({message:"Story not found"});
    res.json(await Comment.find({storyId:req.params.storyId}).populate("userId","username").sort({createdAt:-1}));
  }catch(err){next(err);}
});

router.post("/:storyId/comments",authRequired,async(req,res,next)=>{
  try{
    if(typeof req.body.body!=="string"||!req.body.body.trim()||req.body.body.length>2000)return res.status(400).json({message:"Comment must contain 1 to 2000 characters"});
    const story=await publishedStory(req.params.storyId);
    if(!story)return res.status(404).json({message:"Story not found"});
    const comment=await Comment.create({storyId:story._id,userId:req.userId,body:req.body.body.trim()});
    await Story.updateOne({_id:story._id},{$inc:{"stats.comments":1}});
    res.status(201).json(await comment.populate("userId","username"));
  }catch(err){next(err);}
});

router.post("/:storyId/like",authRequired,async(req,res,next)=>{
  try{
    const story=await publishedStory(req.params.storyId);
    if(!story)return res.status(404).json({message:"Story not found"});
    const user=await User.findById(req.userId);
    const hasLiked=user.likedStoryIds.some(id=>id.equals(story._id));
    if(hasLiked){user.likedStoryIds.pull(story._id);story.stats.likes=Math.max(0,story.stats.likes-1);}
    else{user.likedStoryIds.addToSet(story._id);story.stats.likes+=1;}
    await Promise.all([user.save(),story.save()]);
    res.json({liked:!hasLiked,likes:story.stats.likes});
  }catch(err){next(err);}
});

router.post("/:storyId/bookmark",authRequired,async(req,res,next)=>{
  try{
    const story=await publishedStory(req.params.storyId);
    if(!story)return res.status(404).json({message:"Story not found"});
    const user=await User.findById(req.userId);
    const bookmarked=user.bookmarkedStoryIds.some(id=>id.equals(story._id));
    if(bookmarked)user.bookmarkedStoryIds.pull(story._id);
    else user.bookmarkedStoryIds.addToSet(story._id);
    await user.save();
    res.json({bookmarked:!bookmarked});
  }catch(err){next(err);}
});

router.post("/:storyId/read",authRequired,async(req,res,next)=>{
  try{
    const story=await publishedStory(req.params.storyId);
    if(!story)return res.status(404).json({message:"Story not found"});
    if(!req.body.chapterId||!mongoose.Types.ObjectId.isValid(req.body.chapterId))return res.status(400).json({message:"A valid chapter is required"});
    const chapter=story.chapters.id(req.body.chapterId);
    if(!chapter)return res.status(404).json({message:"Chapter not found"});
    if(!story.ownerId?.equals(req.userId)){
      const day=new Date();
      day.setUTCHours(0,0,0,0);
      const firstRead=await Activity.updateOne(
        {storyId:story._id,userId:req.userId,type:"read",day},
        {$setOnInsert:{chapterId:chapter._id,type:"read",day,storyId:story._id,userId:req.userId}},
        {upsert:true}
      );
      if(firstRead.upsertedCount>0)await Story.updateOne({_id:story._id},{$inc:{"stats.reads":1}});
    }
    res.json({recorded:true});
  }catch(err){next(err);}
});

export default router;