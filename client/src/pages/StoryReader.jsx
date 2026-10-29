import {useEffect,useState} from "react";
import {Link,useParams} from "react-router-dom";
import {ArrowLeft,ArrowRight,Bookmark,Flag,Heart} from "lucide-react";
import {authHeaders,useAuth} from "../context/AuthContext";
import api from "../services/api";

export default function StoryReader(){
  const {storyId}=useParams();
  const {token,user}=useAuth();
  const [story,setStory]=useState(null);
  const [chapterIndex,setChapterIndex]=useState(0);
  const [error,setError]=useState("");
  const [loading,setLoading]=useState(true);
  const [comments,setComments]=useState([]);
  const [comment,setComment]=useState("");
  const [liked,setLiked]=useState(false);
  const [bookmarked,setBookmarked]=useState(false);
  const [reason,setReason]=useState("copyright");
  const [reportDetails,setReportDetails]=useState("");
  const [notice,setNotice]=useState("");

  useEffect(()=>{
    setLoading(true);
    api.get(`/stories/public/${storyId}`)
      .then(({data})=>{setStory(data);setChapterIndex(0);setError("");})
      .catch(err=>setError(err.response?.data?.message||"Could not load this story."))
      .finally(()=>setLoading(false));
  },[storyId]);

  useEffect(()=>{
    api.get(`/interactions/${storyId}/comments`).then(({data})=>setComments(data)).catch(()=>{});
    if(token)api.get(`/interactions/${storyId}/state`,{headers:authHeaders(token)}).then(({data})=>{setLiked(data.liked);setBookmarked(data.bookmarked);}).catch(()=>{});
  },[storyId,token]);

  useEffect(()=>{
    const chapter=story?.chapters?.[chapterIndex];
    if(token&&chapter?._id)api.post(`/interactions/${storyId}/read`,{chapterId:chapter._id},{headers:authHeaders(token)}).catch(()=>{});
  },[story,storyId,chapterIndex,token]);

  const interact=async(action)=>{
    if(!token){setNotice("Sign in to use reader features.");return;}
    try{
      const {data}=await api.post(`/interactions/${storyId}/${action}`,{}, {headers:authHeaders(token)});
      if(action==="like"){setLiked(data.liked);setStory(current=>({...current,stats:{...current.stats,likes:data.likes}}));}
      if(action==="bookmark")setBookmarked(data.bookmarked);
      setNotice(action==="like"?(data.liked?"Story liked.":"Like removed."):(data.bookmarked?"Saved to your bookmarks.":"Removed from your bookmarks."));
    }catch(err){setNotice(err.response?.data?.message||"Could not update this story.");}
  };

  const postComment=async(event)=>{
    event.preventDefault();
    try{const {data}=await api.post(`/interactions/${storyId}/comments`,{body:comment},{headers:authHeaders(token)});setComments(current=>[data,...current]);setComment("");setNotice("Comment posted.");}
    catch(err){setNotice(err.response?.data?.message||"Could not post your comment.");}
  };

  const reportStory=async(event)=>{
    event.preventDefault();
    try{await api.post(`/reports/stories/${storyId}`,{reason,details:reportDetails},{headers:authHeaders(token)});setReportDetails("");setNotice("Thank you. Your report was sent to moderation.");}
    catch(err){setNotice(err.response?.data?.message||"Could not submit report.");}
  };

  if(loading)return <section className="section"><p className="lead">Opening story...</p></section>;
  if(error||!story)return <section className="section"><div className="eyebrow">STORY READER</div><h1>Story unavailable.</h1><p className="lead">{error||"This story may have been unpublished."}</p><Link className="button secondary" to="/explore"><ArrowLeft size={16}/>Back to Explore</Link></section>;

  const chapters=story.chapters||[];
  const chapter=chapters[chapterIndex];
  return <article className="story-reader section">
    <Link className="text-link reader-back" to="/explore"><ArrowLeft size={16}/> Explore</Link>
    <header className="reader-header">
      <div className="eyebrow">{story.genre||"FICTION"} · {story.stats?.views||0} reads</div>
      <h1>{story.title}</h1>
      <p className="lead">By <Link to={`/writers/${encodeURIComponent(story.ownerId?.username||"")}`}>{story.ownerId?.username||"Draftroom writer"}</Link></p>
      {story.description&&<p className="reader-description">{story.description}</p>}
    </header>
    {chapters.length>0&&<>
      <div className="reader-actions"><button className="button secondary" onClick={()=>interact("like")}><Heart size={16} fill={liked?"currentColor":"none"}/>{liked?"Liked":"Like"} · {story.stats?.likes||0}</button><button className="button secondary" onClick={()=>interact("bookmark")}><Bookmark size={16} fill={bookmarked?"currentColor":"none"}/>{bookmarked?"Saved":"Save"}</button></div>
      <div className="chapter-switcher"><span>Chapter {chapterIndex+1} of {chapters.length}</span><select aria-label="Select chapter" value={chapterIndex} onChange={event=>setChapterIndex(Number(event.target.value))}>{chapters.map((item,index)=><option value={index} key={item._id||index}>{item.title}</option>)}</select></div>
      <section className="reader-chapter"><h2>{chapter.title}</h2><div className="reader-prose">{chapter.body.split(/\n\s*\n/).filter(Boolean).map((paragraph,index)=><p key={index}>{paragraph}</p>)}</div></section>
      <nav className="reader-navigation" aria-label="Chapter navigation">
        <button className="button secondary" disabled={chapterIndex===0} onClick={()=>setChapterIndex(index=>index-1)}><ArrowLeft size={16}/>Previous</button>
        <button className="button primary" disabled={chapterIndex===chapters.length-1} onClick={()=>setChapterIndex(index=>index+1)}>Next chapter<ArrowRight size={16}/></button>
      </nav>
      {notice&&<p className="notice" role="status">{notice}</p>}
      <section className="reader-community"><h2>Reader conversation</h2>{token?<form onSubmit={postComment}><label>Add a comment<textarea value={comment} onChange={event=>setComment(event.target.value)} maxLength={2000} required/></label><button className="button primary">Post comment</button></form>:<p><Link to="/account">Sign in</Link> to leave a comment.</p>}{comments.length===0?<p>No comments yet.</p>:comments.map(item=><article className="reader-comment" key={item._id}><strong>{item.userId?.username||"Writer"}</strong><small>{new Date(item.createdAt).toLocaleString()}</small><p>{item.body}</p></article>)}</section>
      {token&&<details className="report-panel"><summary><Flag size={15}/> Report this story</summary><form onSubmit={reportStory}><label>Reason<select value={reason} onChange={event=>setReason(event.target.value)}><option value="copyright">Copyright concern</option><option value="harassment">Harassment</option><option value="spam">Spam</option><option value="other">Other</option></select></label><label>Details<textarea value={reportDetails} onChange={event=>setReportDetails(event.target.value)} maxLength={2000}/></label><button className="button secondary">Send report</button></form></details>}
    </>}
  </article>;
}