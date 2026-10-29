import mongoose from "mongoose";

const challengeSchema=new mongoose.Schema({
  title:{type:String,required:true,trim:true,maxLength:120},
  prompt:{type:String,required:true,trim:true,maxLength:3000},
  rules:{type:String,default:"",maxLength:3000},
  startsAt:{type:Date,required:true},
  endsAt:{type:Date,required:true},
  status:{type:String,enum:["draft","open","closed"],default:"open"},
  createdBy:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null}
},{timestamps:true});

export default mongoose.model("Challenge",challengeSchema);