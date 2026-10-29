import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {Users} from "lucide-react";
import {authHeaders,useAuth} from "../context/AuthContext";
import api from "../services/api";

export default function Collaborate(){
	const {token,user}=useAuth();
	const [stories,setStories]=useState([]);
	const [error,setError]=useState("");
	const [loading,setLoading]=useState(Boolean(user));

	useEffect(()=>{
		if(!token){setLoading(false);return;}
		api.get("/stories/mine",{headers:authHeaders(token)})
			.then(({data})=>setStories(data))
			.catch(err=>setError(err.response?.data?.message||"Could not load shared stories."))
			.finally(()=>setLoading(false));
	},[token]);

	return <section className="section">
		<div className="eyebrow">COLLABORATIVE STORY STUDIO</div>
		<h1>Write one story with a team.</h1>
		<p className="lead">Open a story to edit its chapter with the owner and invited writers.</p>
		{!user?<div className="card pad"><p>Sign in to see stories shared with you or invite a writer to your own story.</p><Link className="button primary" to="/account">Create account or sign in</Link></div>:<>
			<div className="section-head"><h2>Your writing rooms</h2><Link className="button primary" to="/create">Start a story</Link></div>
			{error&&<p className="notice" role="alert">{error}</p>}
			{loading?<p className="lead">Loading stories...</p>:stories.length===0?<div className="card pad"><h3>No shared stories yet.</h3><p>Create a story, save it, then invite a Draftroom writer by email from its workspace.</p><Link className="button primary" to="/create">Start writing</Link></div>:<div className="grid">{stories.map(story=>{
				const owner=story.ownerId?._id===user.id||story.ownerId===user.id;
				return <article className="card pad" key={story._id}>
					<span className="tag">{owner?"Owner":"Collaborator"} · {story.status}</span>
					<h3>{story.title}</h3>
					<p>By {story.ownerId?.username||"You"} · {story.collaboratorIds?.length||0} collaborators</p>
					<div className="collab-members"><Users size={16}/>{story.collaboratorIds?.map(person=><span key={person._id}>{person.username}</span>)}</div>
					<Link className="button secondary" to={`/stories/${story._id}/edit`}>Open writing room</Link>
				</article>;
			})}</div>}
		</>}
	</section>;
}