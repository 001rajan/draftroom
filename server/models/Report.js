import mongoose from "mongoose";

const reportSchema=new mongoose.Schema({
  storyId:{type:mongoose.Schema.Types.ObjectId,ref:"Story",required:true,index:true},
  reporterId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
  reason:{type:String,enum:["copyright","harassment","spam","other"],required:true},
  details:{type:String,default:"",maxLength:2000},
  status:{type:String,enum:["open","reviewed","resolved"],default:"open"},
  reviewedBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null}
},{timestamps:true});
reportSchema.index({storyId:1,reporterId:1,status:1});

export default mongoose.model("Report",reportSchema);