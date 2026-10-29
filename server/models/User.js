import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
  username:{type:String,required:true,unique:true,trim:true,maxLength:40},
  email:{type:String,required:true,unique:true,lowercase:true,trim:true},
  passwordHash:{type:String,required:true},
  bio:{type:String,default:"",maxLength:500},
  role:{type:String,enum:["writer","admin"],default:"writer"},
  followingIds:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  likedStoryIds:[{type:mongoose.Schema.Types.ObjectId,ref:"Story"}],
  bookmarkedStoryIds:[{type:mongoose.Schema.Types.ObjectId,ref:"Story"}],
  passwordResetHash:{type:String,default:null},
  passwordResetExpires:{type:Date,default:null}
},{timestamps:true});

export default mongoose.model("User",userSchema);