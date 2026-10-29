import {useState} from "react";
import {Link,useSearchParams} from "react-router-dom";
import api from "../services/api";

export default function PasswordReset(){
  const [params]=useSearchParams();
  const token=params.get("token");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  const submit=async(event)=>{
    event.preventDefault();setError("");setMessage("");
    try{
      const {data}=token?await api.post("/auth/password-reset/confirm",{token,password}):await api.post("/auth/password-reset/request",{email});
      setMessage(data.message);
    }catch(err){setError(err.response?.data?.message||"Could not process password reset.");}
  };

  return <section className="section editor"><div className="eyebrow">ACCOUNT RECOVERY</div><h1>{token?"Choose a new password.":"Reset your password."}</h1><div className="card pad"><form onSubmit={submit}>{token?<label>New password<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={event=>setPassword(event.target.value)}/></label>:<label>Account email<input type="email" autoComplete="email" required value={email} onChange={event=>setEmail(event.target.value)}/></label>}{error&&<p className="notice" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}<button className="button primary">{token?"Update password":"Send reset link"}</button></form><p><Link to="/account">Back to account</Link></p></div></section>;
}