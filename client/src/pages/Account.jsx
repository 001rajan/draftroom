import {useEffect,useState} from "react";
import {Link,useNavigate} from "react-router-dom";
import {useAuth} from "../context/AuthContext";
import {authHeaders} from "../context/AuthContext";
import api from "../services/api";

export default function Account(){
  const {user,authenticate,signOut,token,updateUser}=useAuth();
  const [mode,setMode]=useState("register");
  const [username,setUsername]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");
  const [busy,setBusy]=useState(false);
  const [bio,setBio]=useState(user?.bio||"");
  const [profileMessage,setProfileMessage]=useState("");
  const navigate=useNavigate();
  useEffect(()=>{if(user?.bio!==undefined)setBio(user.bio);},[user?.bio]);

  const submit=async(event)=>{
    event.preventDefault();
    setBusy(true);
    setError("");
    try{
      await authenticate(mode,{...(mode==="register"?{username}:{}),email,password});
      navigate("/drafts");
    }catch(err){
      setError(err.response?.data?.message||"Could not connect to the server. Check that the backend is running.");
    }finally{setBusy(false);}
  };

  const saveProfile=async(event)=>{
    event.preventDefault();
    try{
      const {data}=await api.patch("/profiles/me",{username:user.username,bio},{headers:authHeaders(token)});
      updateUser(data);
      setProfileMessage("Profile updated.");
    }catch(err){setProfileMessage(err.response?.data?.message||"Could not update your profile.");}
  };

  if(user){
    return <section className="section editor">
      <div className="eyebrow">YOUR ACCOUNT</div>
      <h1>Welcome, {user.username}.</h1>
      <p className="lead">{user.email} · <Link to={`/writers/${encodeURIComponent(user.username)}`}>View public profile</Link></p>
      <form className="profile-form" onSubmit={saveProfile}><label>About you<textarea value={bio} onChange={event=>setBio(event.target.value)} maxLength={500}/></label><button className="button secondary">Save profile</button>{profileMessage&&<p role="status">{profileMessage}</p>}</form>
      <div className="hero-actions"><Link className="button primary" to="/drafts">Open my drafts</Link><Link className="button secondary" to="/reset-password">Change password</Link><button className="button secondary" onClick={signOut}>Sign out</button></div>
    </section>;
  }

  return <section className="section editor">
    <div className="eyebrow">WRITER ACCOUNT</div>
    <h1>{mode==="register"?"Make room to write.":"Welcome back."}</h1>
    <div className="card pad">
      <div className="hero-actions">
        <button className={`button ${mode==="register"?"primary":"secondary"}`} onClick={()=>{setMode("register");setError("");}}>Create account</button>
        <button className={`button ${mode==="login"?"primary":"secondary"}`} onClick={()=>{setMode("login");setError("");}}>Sign in</button>
      </div>
      <form onSubmit={submit}>
        {mode==="register"&&<label>Your name<input autoComplete="name" value={username} onChange={event=>setUsername(event.target.value)} required maxLength={40}/></label>}
        <label>Email<input type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} required/></label>
        <label>Password<input type="password" autoComplete={mode==="register"?"new-password":"current-password"} value={password} onChange={event=>setPassword(event.target.value)} required minLength={mode==="register"?8:1}/></label>
        {mode==="login"&&<Link className="text-link" to="/reset-password">Forgot password?</Link>}
        {error&&<p className="notice" role="alert">{error}</p>}
        <button className="button primary" disabled={busy}>{busy?"Please wait...":mode==="register"?"Create account":"Sign in"}</button>
      </form>
    </div>
  </section>;
}