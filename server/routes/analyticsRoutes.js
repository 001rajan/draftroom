import {Router} from "express";
import Story from "../models/Story.js";
import Activity from "../models/Activity.js";
import authRequired from "../middleware/authRequired.js";

const router=Router();

router.get("/me",authRequired,async(req,res,next)=>{
  try{
    const stories=await Story.find({ownerId:req.userId}).select("title status stats chapters createdAt").sort({createdAt:-1});
    const storyIds=stories.map(story=>story._id);
    const since=new Date();
    since.setDate(since.getDate()-6);
    since.setUTCHours(0,0,0,0);
    const grouped=await Activity.aggregate([
      {$match:{storyId:{$in:storyIds},type:"read",day:{$gte:since}}},
      {$group:{_id:"$day",reads:{$sum:1}}},
      {$sort:{_id:1}}
    ]);
    const readsByDay=new Map(grouped.map(item=>[item._id.toISOString().slice(0,10),item.reads]));
    const week=Array.from({length:7},(_,index)=>{
      const date=new Date(since);
      date.setDate(since.getDate()+index);
      const key=date.toISOString().slice(0,10);
      return {date:key,name:new Intl.DateTimeFormat("en-US",{weekday:"short",timeZone:"UTC"}).format(date),reads:readsByDay.get(key)||0};
    });
    const totals=stories.reduce((result,story)=>({
      views:result.views+story.stats.views,
      reads:result.reads+story.stats.reads,
      likes:result.likes+story.stats.likes,
      comments:result.comments+story.stats.comments,
      followers:result.followers+story.stats.followers
    }),{views:0,reads:0,likes:0,comments:0,followers:0});
    res.json({totals,week,stories:stories.map(story=>({id:story._id,title:story.title,status:story.status,stats:story.stats,chapterCount:story.chapters.length}))});
  }catch(err){next(err);}
});

export default router;