import {Router} from "express";
import Story from "../models/Story.js";
import User from "../models/User.js";
import authRequired from "../middleware/authRequired.js";
const router=Router();

const storyAccess=(storyId,userId)=>Story.findOne({
  _id:storyId,
  $or:[{ownerId:userId},{collaboratorIds:userId}]
});

router.get("/",async(_req,res,next)=>{
  try{
    const stories=await Story.find({status:"published",ownerId:{$ne:null}})
      .populate("ownerId","username")
      .sort({createdAt:-1});
    res.json(stories.map(story=>{
      const result=story.toObject();
      result.preview=(story.description||story.chapters[0]?.body||"").slice(0,280);
      delete result.chapters;
      return result;
    }));
  }catch(err){next(err);}
});

router.get("/public/:id",async(req,res,next)=>{
  try{
    if(!Story.db.base.Types.ObjectId.isValid(req.params.id)) return res.status(404).json({message:"Story not found"});
    const story=await Story.findOneAndUpdate(
      {_id:req.params.id,status:"published"},
      {$inc:{"stats.views":1}},
      {new:true}
    ).populate("ownerId","username");
    if(!story) return res.status(404).json({message:"Story not found"});
    res.json(story);
  }catch(err){next(err);}
});

router.get("/mine",authRequired,async(req,res,next)=>{
  try{
    res.json(await Story.find({$or:[{ownerId:req.userId},{collaboratorIds:req.userId}]})
      .populate("ownerId","username email")
      .populate("collaboratorIds","username email")
      .sort({updatedAt:-1}));
  }catch(err){next(err);}
});

router.post("/",authRequired,async(req,res,next)=>{
  try{
    const {title,body=""}=req.body;
    if(!title?.trim()) return res.status(400).json({message:"Title is required"});
    const story=await Story.create({
      title:title.trim(),
      status:"draft",
      ownerId:req.userId,
      chapters:[{title:"Chapter 1",body,status:"draft"}]
    });
    res.status(201).json(story);
  }catch(err){next(err);}
});

router.get("/:id",authRequired,async(req,res,next)=>{
  try{
    const story=await storyAccess(req.params.id,req.userId)
      .populate("ownerId","username email")
      .populate("collaboratorIds","username email");
    if(!story) return res.status(404).json({message:"Story not found"});
    res.json(story);
  }catch(err){next(err);}
});

router.patch("/:id",authRequired,async(req,res,next)=>{
  try{
    const story=await storyAccess(req.params.id,req.userId);
    if(!story) return res.status(404).json({message:"Story not found"});
    if(typeof req.body.title==="string"){
      if(!req.body.title.trim()) return res.status(400).json({message:"Title is required"});
      story.title=req.body.title.trim();
    }
    if(typeof req.body.body==="string"){
      if(story.chapters.length===0) story.chapters.push({title:"Chapter 1",body:req.body.body});
      else story.chapters[0].body=req.body.body;
    }
    if(Array.isArray(req.body.chapters)){
      if(req.body.chapters.length===0||req.body.chapters.length>50){
        return res.status(400).json({message:"A story needs between 1 and 50 chapters"});
      }
      const currentChapters=new Map(story.chapters.map(chapter=>[chapter._id.toString(),chapter]));
      const chapters=[];
      for(const [index,chapter] of req.body.chapters.entries()){
        const chapterTitle=typeof chapter.title==="string"?chapter.title.trim():"";
        if(!chapterTitle) return res.status(400).json({message:`Chapter ${index+1} needs a title`});
        const existing=chapter._id?currentChapters.get(chapter._id):null;
        chapters.push({
          ...(existing?{_id:existing._id}:{}),
          title:chapterTitle,
          body:typeof chapter.body==="string"?chapter.body:"",
          status:existing?.status||"draft"
        });
      }
      story.chapters=chapters;
    }
    await story.save();
    res.json(story);
  }catch(err){next(err);}
});

router.post("/:id/collaborators",authRequired,async(req,res,next)=>{
  try{
    const story=await Story.findOne({_id:req.params.id,ownerId:req.userId});
    if(!story) return res.status(404).json({message:"Story not found"});
    const email=req.body.email?.trim().toLowerCase();
    if(!email) return res.status(400).json({message:"Enter the writer's account email"});
    const collaborator=await User.findOne({email});
    if(!collaborator) return res.status(404).json({message:"No Draftroom account uses that email yet"});
    if(collaborator._id.equals(story.ownerId)) return res.status(400).json({message:"You already own this story"});
    if(!story.collaboratorIds.some(id=>id.equals(collaborator._id))){
      story.collaboratorIds.push(collaborator._id);
      await story.save();
    }
    res.json({message:`${collaborator.username} can now edit this story`,collaborator:{id:collaborator._id,username:collaborator.username,email:collaborator.email}});
  }catch(err){next(err);}
});

router.patch("/:id/publish",authRequired,async(req,res,next)=>{
  try{
    const story=await Story.findOneAndUpdate(
      {_id:req.params.id,ownerId:req.userId},
      {$set:{status:"published","chapters.$[].status":"published"}},
      {new:true,runValidators:true}
    );
    if(!story) return res.status(404).json({message:"Story not found"});
    res.json(story);
  }catch(err){next(err);}
});

export default router;