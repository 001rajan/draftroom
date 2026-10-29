import mongoose from "mongoose";

const activitySchema=new mongoose.Schema({
  storyId:{type:mongoose.Schema.Types.ObjectId,ref:"Story",required:true,index:true},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  type:{type:String,enum:["view","read"],required:true},
  chapterId:{type:mongoose.Schema.Types.ObjectId,default:null},
  day:{type:Date,required:true,index:true}
},{timestamps:true});
activitySchema.index({storyId:1,userId:1,type:1,day:1},{unique:true});

export default mongoose.model("Activity",activitySchema);