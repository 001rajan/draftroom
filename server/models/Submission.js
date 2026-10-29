import mongoose from "mongoose";

const submissionSchema=new mongoose.Schema({
  challengeId:{type:mongoose.Schema.Types.ObjectId,ref:"Challenge",required:true,index:true},
  userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true,index:true},
  title:{type:String,required:true,trim:true,maxLength:160},
  body:{type:String,required:true,maxLength:20000},
  status:{type:String,enum:["submitted","winner"],default:"submitted"}
},{timestamps:true});
submissionSchema.index({challengeId:1,userId:1},{unique:true});

export default mongoose.model("Submission",submissionSchema);