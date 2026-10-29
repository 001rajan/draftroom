import jwt from "jsonwebtoken";

const jwtSecret=()=>process.env.JWT_SECRET;

export default function authRequired(req,res,next){
  const token=req.headers.authorization?.replace(/^Bearer\s+/i,"");
  if(!token) return res.status(401).json({message:"Sign in to continue"});
  try{
    const payload=jwt.verify(token,jwtSecret());
    req.userId=payload.userId;
    next();
  }catch{
    res.status(401).json({message:"Your session has expired. Please sign in again."});
  }
}