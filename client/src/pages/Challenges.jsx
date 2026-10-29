import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {authHeaders,useAuth} from "../context/AuthContext";
import api from "../services/api";

export default function Challenges(){
	const {token,user}=useAuth();
	const [challenges,setChallenges]=useState([]);
	const [submissions,setSubmissions]=useState({});
	const [leaderboards,setLeaderboards]=useState({});
	const [active,setActive]=useState("");
	const [title,setTitle]=useState("");
	const [body,setBody]=useState("");
	const [challengeTitle,setChallengeTitle]=useState("");
	const [prompt,setPrompt]=useState("");
	const [rules,setRules]=useState("");
	const [endsAt,setEndsAt]=useState("");
	const [error,setError]=useState("");
	const [message,setMessage]=useState("");
	const [loading,setLoading]=useState(true);

	const load=()=>api.get("/challenges").then(({data})=>setChallenges(data)).catch(()=>setError("Could not load challenges.")).finally(()=>setLoading(false));
	useEffect(()=>{load();},[]);

	const join=async(event,challengeId)=>{
		event.preventDefault();
		try{
			await api.post(`/challenges/${challengeId}/join`,{title,body},{headers:authHeaders(token)});
			setMessage("Your submission has been saved.");setError("");setActive("");setTitle("");setBody("");load();
		}catch(err){setError(err.response?.data?.message||"Could not submit your story.");}
	};

	const viewSubmissions=async(id)=>{
		try{const {data}=await api.get(`/challenges/${id}/submissions`,{headers:authHeaders(token)});setSubmissions(current=>({...current,[id]:data}));}
		catch(err){setError(err.response?.data?.message||"Could not load submissions.");}
	};

	const createChallenge=async(event)=>{
		event.preventDefault();
		try{
			await api.post("/challenges",{title:challengeTitle,prompt,rules,startsAt:new Date().toISOString(),endsAt:new Date(endsAt).toISOString()},{headers:authHeaders(token)});
			setChallengeTitle("");setPrompt("");setRules("");setEndsAt("");setMessage("Challenge published.");load();
		}catch(err){setError(err.response?.data?.message||"Could not create challenge.");}
	};

	const selectWinner=async(challengeId,submissionId)=>{
		try{await api.patch(`/challenges/${challengeId}/winner`,{submissionId},{headers:authHeaders(token)});viewSubmissions(challengeId);}
		catch(err){setError(err.response?.data?.message||"Could not select winner.");}
	};

	const viewLeaderboard=async(id)=>{
		try{const {data}=await api.get(`/challenges/${id}/leaderboard`);setLeaderboards(current=>({...current,[id]:data}));}
		catch(err){setError(err.response?.data?.message||"Could not load winners.");}
	};

	return <section className="section"><div className="eyebrow">CHALLENGE ARENA</div><h1>Turn prompts into stories.</h1><p className="lead">Join a prompt and submit one story per challenge. Revise your submission before the deadline.</p>
		{error&&<p className="notice" role="alert">{error}</p>}{message&&<p className="notice" role="status">{message}</p>}
		{loading?<p className="lead">Loading challenges...</p>:challenges.length===0?<div className="card pad"><h2>No open challenges.</h2><p>New writing prompts will appear here when an administrator opens one.</p></div>:<div className="grid">{challenges.map(challenge=><article className="card pad" key={challenge._id}>
			<span className="tag accent">{challenge.status.toUpperCase()}</span><h2>{challenge.title}</h2><p>{challenge.prompt}</p>{challenge.rules&&<small>{challenge.rules}</small>}<p><small>{challenge.participants} submissions · Closes {new Date(challenge.endsAt).toLocaleDateString()}</small></p>
			{challenge.status==="open"&&user?<button className="button primary" onClick={()=>setActive(active===challenge._id?"":challenge._id)}>{active===challenge._id?"Close submission":"Submit a story"}</button>:challenge.status==="open"?<Link className="button secondary" to="/account">Sign in to join</Link>:<span className="tag">{challenge.status}</span>}
			{active===challenge._id&&<form className="challenge-submission" onSubmit={event=>join(event,challenge._id)}><label>Submission title<input required maxLength={160} value={title} onChange={event=>setTitle(event.target.value)}/></label><label>Your story<textarea required maxLength={20000} value={body} onChange={event=>setBody(event.target.value)}/></label><button className="button primary">Save submission</button></form>}
			{token&&<button className="button secondary submissions-toggle" onClick={()=>viewSubmissions(challenge._id)}>View submissions</button>}
			<button className="button secondary submissions-toggle" onClick={()=>viewLeaderboard(challenge._id)}>View winners</button>
			{submissions[challenge._id]&&<div className="submission-list">{submissions[challenge._id].map(entry=><article key={entry._id}><strong>{entry.title}</strong><small>By {entry.userId?.username||"Writer"}{entry.status==="winner"?" · Winner":""}</small><p>{entry.body}</p>{user?.role==="admin"&&entry.status!=="winner"&&<button className="button secondary" onClick={()=>selectWinner(challenge._id,entry._id)}>Select winner</button>}</article>)}</div>}
			{leaderboards[challenge._id]&&<div className="submission-list"><h3>Challenge winners</h3>{leaderboards[challenge._id].length===0?<p>No winner selected yet.</p>:leaderboards[challenge._id].map(entry=><article key={entry._id}><strong>{entry.title}</strong><small>By {entry.userId?.username||"Writer"}</small></article>)}</div>}
		</article>)}</div>}
		{user?.role==="admin"&&<section className="admin-challenge-form"><h2>Create a challenge</h2><form onSubmit={createChallenge}><label>Title<input required maxLength={120} value={challengeTitle} onChange={event=>setChallengeTitle(event.target.value)}/></label><label>Prompt<textarea required maxLength={3000} value={prompt} onChange={event=>setPrompt(event.target.value)}/></label><label>Rules<textarea maxLength={3000} value={rules} onChange={event=>setRules(event.target.value)}/></label><label>Closes at<input type="datetime-local" required value={endsAt} onChange={event=>setEndsAt(event.target.value)}/></label><button className="button primary">Publish challenge</button></form></section>}
	</section>;
}