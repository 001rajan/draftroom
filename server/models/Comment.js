import mongoose from "mongoose";

const commentSchema=new mongoose.Schema({
  storyId:{type:mongoose.Schema.Types.ObjectId,ref:"Story",required:true,index:true},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  body:{type:String,required:true,trim:true,maxLength:2000}
},{timestamps:true});

export default mongoose.model("Comment",commentSchema);