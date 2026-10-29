import mongoose from "mongoose";
const chapterSchema=new mongoose.Schema({
  title:{type:String,required:true},
  body:{type:String,default:""},
  status:{type:String,enum:["draft","review","approved","published"],default:"draft"}
},{timestamps:true});
const storySchema=new mongoose.Schema({
  title:{type:String,required:true,trim:true},
  description:{type:String,default:""},
  genre:{type:String,default:"Fiction"},
  status:{type:String,enum:["draft","published","hidden"],default:"draft"},
  ownerId:{type:mongoose.Schema.Types.ObjectId,ref:"User",default:null},
  collaboratorIds:[{type:mongoose.Schema.Types.ObjectId,ref:"User"}],
  tags:[String],
  chapters:[chapterSchema],
  stats:{
    views:{type:Number,default:0},
    reads:{type:Number,default:0},
    likes:{type:Number,default:0},
    comments:{type:Number,default:0},
    followers:{type:Number,default:0}
  }
},{timestamps:true});
export default mongoose.model("Story",storySchema);