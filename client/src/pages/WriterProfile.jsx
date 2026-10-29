import {useEffect,useState} from "react";
import {Link,useParams} from "react-router-dom";
import {useAuth,authHeaders} from "../context/AuthContext";
import api from "../services/api";

export default function WriterProfile(){
  const {username}=useParams();
  const {token,user}=useAuth();
  const [profile,setProfile]=useState(null);
  const [following,setFollowing]=useState(false);
  const [message,setMessage]=useState("");
  useEffect(()=>{api.get(`/profiles/${encodeURIComponent(username)}`).then(({data})=>setProfile(data)).catch(err=>setMessage(err.response?.data?.message||"Could not load writer profile."));},[username]);
  useEffect(()=>{if(token&&profile&&user?.id!==profile.id)api.get(`/profiles/${profile.id}/follow-state`,{headers:authHeaders(token)}).then(({data})=>setFollowing(data.following)).catch(()=>{});},[token,profile,user?.id]);

  const follow=async()=>{
    try{const {data}=await api.post(`/profiles/${profile.id}/follow`,{}, {headers:authHeaders(token)});setFollowing(data.following);setMessage(data.following?"Following writer.":"Unfollowed writer.");}
    catch(err){setMessage(err.response?.data?.message||"Could not update follow.");}
  };

  if(message&&!profile)return <section className="section"><p className="notice">{message}</p></section>;
  if(!profile)return <section className="section"><p className="lead">Loading profile...</p></section>;
  return <section className="section"><div className="eyebrow">WRITER PROFILE</div><h1>{profile.username}</h1><p className="lead">{profile.bio||"This writer has not added a bio yet."}</p><p><small>Member since {new Date(profile.joinedAt).toLocaleDateString()} · {profile.followingCount} following</small></p>
    {user&&user.id!==profile.id&&<button className="button primary" onClick={follow}>{following?"Following":"Follow writer"}</button>}{message&&<p role="status">{message}</p>}
    <section className="section"><h2>Published stories</h2>{profile.stories.length===0?<p>No published stories yet.</p>:<div className="grid">{profile.stories.map(story=><Link className="card pad story-card" key={story.id} to={`/stories/${story.id}`}><span className="tag">{story.genre}</span><h3>{story.title}</h3><p>{story.description}</p><small>{story.views} reads</small></Link>)}</div>}</section>
  </section>;
}