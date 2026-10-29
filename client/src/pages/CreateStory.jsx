import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {useNavigate,useParams} from "react-router-dom";
import {ArrowDown,ArrowUp,Plus,Trash2} from "lucide-react";
import {useAuth,authHeaders} from "../context/AuthContext";
import api from "../services/api";
export default function CreateStory(){
	const {token,user}=useAuth();
	const {storyId}=useParams();
	const navigate=useNavigate();
	const [title,setTitle]=useState("");
	const [chapters,setChapters]=useState([{title:"Chapter 1",body:""}]);
	const [msg,setMsg]=useState("");
	const [email,setEmail]=useState("");
	const [collaborators,setCollaborators]=useState([]);
	const [isOwner,setIsOwner]=useState(!storyId);
	const [loading,setLoading]=useState(Boolean(storyId));
	const [busy,setBusy]=useState(false);
	const headers={headers:authHeaders(token)};

	useEffect(()=>{
		if(!storyId||!token)return;
		api.get(`/stories/${storyId}`,headers).then(({data})=>{
			setTitle(data.title);
			setChapters(data.chapters?.length?data.chapters:[{title:"Chapter 1",body:""}]);
			setCollaborators(data.collaboratorIds||[]);
			setIsOwner(data.ownerId?._id===user?.id||data.ownerId===user?.id);
		}).catch(err=>setMsg(err.response?.data?.message||"Could not open this story."))
			.finally(()=>setLoading(false));
	},[storyId,token]);
	const updateChapter=(index,field,value)=>setChapters(current=>current.map((chapter,chapterIndex)=>chapterIndex===index?{...chapter,[field]:value}:chapter));
	const moveChapter=(index,direction)=>setChapters(current=>{
		const next=[...current];
		const target=index+direction;
		[next[index],next[target]]=[next[target],next[index]];
		return next;
	});
	const wordCount=chapters.reduce((total,chapter)=>total+(chapter.body.trim()?chapter.body.trim().split(/\s+/).length:0),0);

	const save=async()=>{
		if(!title.trim()){setMsg("Add a title before saving.");return;}
		setBusy(true);
		try{
			if(storyId){
				await api.patch(`/stories/${storyId}`,{title,chapters},headers);
				setMsg("All chapters saved.");
			}
			else{
				const {data}=await api.post("/stories",{title,body:chapters[0].body},headers);
				await api.patch(`/stories/${data._id}`,{title,chapters},headers);
				navigate(`/stories/${data._id}/edit`,{replace:true});
				setMsg("Draft saved with all chapters.");
			}
		}catch(err){setMsg(err.response?.data?.message||"Could not save your draft. Check that the backend is running.");}
		finally{setBusy(false);}
	};

	const publish=async()=>{
		setBusy(true);
		try{
			let id=storyId;
			if(id)await api.patch(`/stories/${id}`,{title,chapters},headers);
			else{
				const {data}=await api.post("/stories",{title,body:chapters[0].body},headers);
				id=data._id;
				await api.patch(`/stories/${id}`,{title,chapters},headers);
				navigate(`/stories/${id}/edit`,{replace:true});
			}
			await api.patch(`/stories/${id}/publish`,{},headers);
			setMsg("Published. Your story is now visible in Explore.");
		}catch(err){setMsg(err.response?.data?.message||"Could not publish this story.");}
		finally{setBusy(false);}
	};

	const invite=async(event)=>{
		event.preventDefault();
		setBusy(true);
		try{
			const {data}=await api.post(`/stories/${storyId}/collaborators`,{email},headers);
			setCollaborators(current=>current.some(person=>person.email===data.collaborator.email)?current:[...current,data.collaborator]);
			setEmail("");
			setMsg(data.message);
		}catch(err){setMsg(err.response?.data?.message||"Could not invite that writer.");}
		finally{setBusy(false);}
	};

	if(!token)return <section className="section editor"><div className="eyebrow">STORY WORKSPACE</div><h1>Sign in to save your writing.</h1><p className="lead">Your drafts are private to your account.</p><Link className="button primary" to="/account">Create account or sign in</Link></section>;
	if(loading)return <section className="section editor"><p className="lead">Loading story...</p></section>;
	return <section className="section editor"><div className="eyebrow">{storyId?"SHARED STORY WORKSPACE":"STORY WORKSPACE"}</div><h1>{storyId?"Write together.":"Start a new story."}</h1><div className="card pad"><label>Story title<input value={title} onChange={event=>setTitle(event.target.value)} placeholder="Give your story a name"/></label>
		<div className="chapter-list">{chapters.map((chapter,index)=><section className="chapter-editor" key={chapter._id||index}>
			<div className="chapter-heading"><label>Chapter {index+1} title<input value={chapter.title} onChange={event=>updateChapter(index,"title",event.target.value)} placeholder={`Chapter ${index+1}`}/></label><div className="chapter-controls">
				<button className="icon-button" type="button" title="Move chapter up" aria-label="Move chapter up" disabled={index===0} onClick={()=>moveChapter(index,-1)}><ArrowUp size={16}/></button>
				<button className="icon-button" type="button" title="Move chapter down" aria-label="Move chapter down" disabled={index===chapters.length-1} onClick={()=>moveChapter(index,1)}><ArrowDown size={16}/></button>
				<button className="icon-button" type="button" title="Delete chapter" aria-label="Delete chapter" disabled={chapters.length===1} onClick={()=>setChapters(current=>current.filter((_,chapterIndex)=>chapterIndex!==index))}><Trash2 size={16}/></button>
			</div></div>
			<label>Chapter text<textarea value={chapter.body} onChange={event=>updateChapter(index,"body",event.target.value)} placeholder="Begin this chapter..."/></label>
		</section>)}</div>
		<button className="button secondary add-chapter" type="button" disabled={chapters.length>=50} onClick={()=>setChapters(current=>[...current,{title:`Chapter ${current.length+1}`,body:""}])}><Plus size={16}/>Add chapter</button>
		<div className="editor-foot"><span>{chapters.length} chapters · {wordCount} words</span><div className="editor-actions"><button className="button secondary" onClick={save} disabled={busy}>{busy?"Saving...":"Save draft"}</button>{isOwner&&<button className="button primary" onClick={publish} disabled={busy}>{busy?"Working...":"Publish"}</button>}</div></div>{msg&&<div className="notice" role="status">{msg}</div>}
		{storyId&&isOwner&&<div className="invite-panel"><h2>Write with someone</h2><p>Invite a Draftroom member by email. They can open this story from Collaborate and edit the first chapter.</p><form className="invite-form" onSubmit={invite}><label>Writer's account email<input type="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="writer@example.com" required/></label><button className="button secondary" disabled={busy}>Invite writer</button></form>{collaborators.length>0&&<div className="collaborator-list"><strong>Collaborators</strong>{collaborators.map(person=><span key={person._id||person.id}>{person.username} · {person.email}</span>)}</div>}</div>}
	</div></section>;
}