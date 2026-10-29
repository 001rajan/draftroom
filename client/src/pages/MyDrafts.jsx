import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {authHeaders,useAuth} from "../context/AuthContext";
import api from "../services/api";

export default function MyDrafts(){
  const {token,user}=useAuth();
  const [stories,setStories]=useState([]);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);

  const loadStories=async()=>{
    try{
      const {data}=await api.get("/stories/mine",{headers:authHeaders(token)});
      setStories(data);
      setError("");
    }catch(err){setError(err.response?.data?.message||"Could not load your stories.");}
    finally{setLoading(false);}
  };

  useEffect(()=>{loadStories();},[token]);

  if(!user)return <section className="section editor"><div className="eyebrow">STORY WORKSPACE</div><h1>Your stories are private.</h1><p className="lead">Sign in to see drafts saved to your account.</p><Link className="button primary" to="/account">Create account or sign in</Link></section>;

  const publish=async(id)=>{
    try{
      await api.patch(`/stories/${id}/publish`,{}, {headers:authHeaders(token)});
      await loadStories();
    }catch(err){setError(err.response?.data?.message||"Could not publish this story.");}
  };

  return <section className="section">
    <div className="eyebrow">STORY WORKSPACE</div>
    <div className="section-head"><h1>My stories.</h1><Link className="button primary" to="/create">New story</Link></div>
    {error&&<p className="notice" role="alert">{error}</p>}
    {loading?<p className="lead">Loading your stories...</p>:stories.length===0?<div className="card pad"><h2>No stories yet.</h2><p>Your private drafts will appear here after you save one.</p><Link className="button primary" to="/create">Start writing</Link></div>:<div className="grid">
      {stories.map(story=><article className="card pad" key={story._id}>
        <span className="tag">{story.status}</span><h2>{story.title}</h2>
        <p>{story.chapters?.[0]?.body||"No chapter text yet."}</p>
        <small>Updated {new Date(story.updatedAt).toLocaleDateString()}</small>
        <div className="hero-actions"><Link className="button secondary" to={`/stories/${story._id}/edit`}>Open workspace</Link>{story.status==="draft"&&story.ownerId?._id===user.id&&<button className="button secondary" onClick={()=>publish(story._id)}>Publish</button>}</div>
      </article>)}
    </div>}
  </section>;
}