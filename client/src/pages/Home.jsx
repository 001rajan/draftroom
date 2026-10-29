import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {ArrowRight, BarChart3, PenLine, Users, Trophy} from "lucide-react";
import api from "../services/api";

export default function Home(){
  const [stories,setStories]=useState([]);
  const [storiesLoaded,setStoriesLoaded]=useState(false);
  useEffect(()=>{
    api.get("/stories").then(({data})=>setStories(data.slice(0,3))).catch(()=>setStories([])).finally(()=>setStoriesLoaded(true));
  },[]);
  return <div>
    <section className="hero">
      <div className="eyebrow">COLLABORATIVE STORYTELLING COMMUNITY</div>
      <h1>Write together.<br/>Create freely.<br/><em>Publish boldly.</em></h1>
      <p>Draftroom is a creative home for writers to co-create stories, join challenges, publish work, and understand their readers.</p>
      <div className="hero-actions">
        <Link className="button primary" to="/create"><PenLine size={16}/>Start Writing</Link>
        <Link className="button secondary" to="/explore">Explore Stories <ArrowRight size={16}/></Link>
      </div>
    </section>
    <section className="section">
      <div className="section-head"><div><div className="eyebrow">FEATURED</div><h2>Stories worth opening.</h2></div><Link className="text-link" to="/explore">View all →</Link></div>
      {stories.length>0?<div className="grid">{stories.map(story=><Link className="card story-card" to={`/stories/${story._id}`} key={story._id}><div className="cover">{story.genre?.[0]||"F"}</div><div className="pad"><span className="tag">{story.genre||"Fiction"}</span><h3>{story.title}</h3><p>{story.preview||"Open this story to read it."}</p><small>By {story.ownerId?.username||"Draftroom writer"} · {story.stats?.views||0} reads</small></div></Link>)}</div>:<div className="card pad"><h3>{storiesLoaded?"No published stories yet.":"Loading published stories..."}</h3><p>Published community stories will appear here.</p><Link className="text-link" to="/explore">Explore all stories <ArrowRight size={15}/></Link></div>}
    </section>
    <section className="feature-strip">
      <div><Users/><h3>Collaborate</h3><p>Invite writers, assign chapters, review drafts and publish together.</p></div>
      <div><Trophy/><h3>Compete</h3><p>Join writing challenges, earn points and build achievements.</p></div>
      <div><BarChart3/><h3>Grow</h3><p>Use analytics to understand what keeps readers engaged.</p></div>
    </section>
    <section className="section">
      <div className="section-head"><div><div className="eyebrow">CHALLENGE ARENA</div><h2>Write something this week.</h2></div><Link className="text-link" to="/challenges">All challenges →</Link></div>
      <div className="card pad challenge-preview"><h3>Find a prompt and start writing.</h3><p>Visit the Challenge Arena to browse the current writing prompts.</p><Link className="button secondary" to="/challenges">Open challenges <ArrowRight size={16}/></Link></div>
    </section>
  </div>
}