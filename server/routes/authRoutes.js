import {Router} from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import nodemailer from "nodemailer";
import User from "../models/User.js";
import authRequired from "../middleware/authRequired.js";

const router=Router();
const jwtSecret=()=>process.env.JWT_SECRET;
const createToken=user=>jwt.sign({userId:user._id.toString()},jwtSecret(),{expiresIn:"7d"});
const publicUser=user=>({id:user._id,username:user.username,email:user.email,bio:user.bio,role:user.role});

router.get("/me",authRequired,async(req,res,next)=>{
  try{
    const user=await User.findById(req.userId).select("username email bio role");
    if(!user)return res.status(401).json({message:"Account not found"});
    res.json({user:publicUser(user)});
  }catch(err){next(err);}
});

router.post("/register",async(req,res,next)=>{
  try{
    const username=req.body.username?.trim();
    const email=req.body.email?.trim().toLowerCase();
    const password=req.body.password;
    if(!username||!email||!password) return res.status(400).json({message:"Name, email, and password are required"});
    if(password.length<8) return res.status(400).json({message:"Password must be at least 8 characters"});
    if(await User.exists({username})) return res.status(409).json({message:"That writer name is already in use"});
    if(await User.exists({email})) return res.status(409).json({message:"An account with that email already exists"});
    const user=await User.create({username,email,passwordHash:await bcrypt.hash(password,12)});
    res.status(201).json({token:createToken(user),user:publicUser(user)});
  }catch(err){next(err);}
});

router.post("/login",async(req,res,next)=>{
  try{
    const email=req.body.email?.trim().toLowerCase();
    const password=req.body.password;
    const user=await User.findOne({email});
    if(!user||!await bcrypt.compare(password||"",user.passwordHash)){
      return res.status(401).json({message:"Email or password is incorrect"});
    }
    res.json({token:createToken(user),user:publicUser(user)});
  }catch(err){next(err);}
});

router.post("/password-reset/request",async(req,res,next)=>{
  try{
    const email=req.body.email?.trim().toLowerCase();
    if(typeof email!=="string"||!email)return res.status(400).json({message:"Enter an email address"});
    if(!process.env.SMTP_HOST||!process.env.SMTP_USER||!process.env.SMTP_PASS||!process.env.MAIL_FROM){
      return res.status(503).json({message:"Password reset email is not configured. Set SMTP_HOST, SMTP_USER, SMTP_PASS, and MAIL_FROM in server/.env."});
    }
    const user=await User.findOne({email});
    if(user){
      const token=crypto.randomBytes(32).toString("hex");
      user.passwordResetHash=crypto.createHash("sha256").update(token).digest("hex");
      user.passwordResetExpires=new Date(Date.now()+30*60*1000);
      await user.save();
      const transporter=nodemailer.createTransport({host:process.env.SMTP_HOST,port:Number(process.env.SMTP_PORT)||587,secure:process.env.SMTP_SECURE==="true",auth:{user:process.env.SMTP_USER,pass:process.env.SMTP_PASS}});
      const resetUrl=`${process.env.CLIENT_URL||process.env.RENDER_EXTERNAL_URL||"http://localhost:5173"}/reset-password?token=${token}`;
      await transporter.sendMail({from:process.env.MAIL_FROM,to:user.email,subject:"Reset your Draftroom password",text:`Use this link within 30 minutes to reset your Draftroom password: ${resetUrl}`});
    }
    res.json({message:"If an account exists for that email, a reset link has been sent."});
  }catch(err){next(err);}
});

router.post("/password-reset/confirm",async(req,res,next)=>{
  try{
    const {token,password}=req.body;
    if(typeof token!=="string"||typeof password!=="string"||password.length<8)return res.status(400).json({message:"A valid reset link and password of at least 8 characters are required"});
    const passwordResetHash=crypto.createHash("sha256").update(token).digest("hex");
    const user=await User.findOne({passwordResetHash,passwordResetExpires:{$gt:new Date()}});
    if(!user)return res.status(400).json({message:"This reset link is invalid or expired"});
    user.passwordHash=await bcrypt.hash(password,12);
    user.passwordResetHash=null;
    user.passwordResetExpires=null;
    await user.save();
    res.json({message:"Password updated. You can now sign in."});
  }catch(err){next(err);}
});

export default router;