import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {authHeaders,useAuth} from "../context/AuthContext";
import api from "../services/api";

export default function Bookmarks(){
  const {token,user}=useAuth();
  const [stories,setStories]=useState([]);
  const [error,setError]=useState("");
  useEffect(()=>{if(token)api.get("/interactions/bookmarks",{headers:authHeaders(token)}).then(({data})=>setStories(data)).catch(err=>setError(err.response?.data?.message||"Could not load bookmarks."));},[token]);
  if(!user)return <section className="section"><h1>Your reading list.</h1><p className="lead">Sign in to see bookmarked stories.</p><Link className="button primary" to="/account">Sign in</Link></section>;
  return <section className="section"><div className="eyebrow">READING LIST</div><h1>Saved stories.</h1>{error&&<p className="notice" role="alert">{error}</p>}{stories.length===0?<div className="card pad"><h2>No bookmarks yet.</h2><p>Save a story from its reader page and it will appear here.</p><Link className="button secondary" to="/explore">Explore stories</Link></div>:<div className="grid">{stories.map(story=><Link className="card pad story-card" to={`/stories/${story.id}`} key={story.id}><span className="tag">{story.genre}</span><h2>{story.title}</h2><p>{story.preview}</p><small>By {story.author} · {story.views} reads</small></Link>)}</div>}</section>;
}
