import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import api from "../services/api";

export default function Explore(){
	const [stories,setStories]=useState([]);
	const [error,setError]=useState("");
	const [loading,setLoading]=useState(true);
	const [query,setQuery]=useState("");
	const [genre,setGenre]=useState("All genres");
	const [sort,setSort]=useState("newest");

	useEffect(()=>{
		api.get("/stories").then(({data})=>setStories(data)).catch(()=>setError("Could not load published stories. Check that the backend is running.")).finally(()=>setLoading(false));
	},[]);
	const genres=[...new Set(stories.map(story=>story.genre||"Fiction"))].sort();
	const visibleStories=stories.filter(story=>{
		const text=`${story.title} ${story.description} ${story.preview} ${story.ownerId?.username} ${story.genre}`.toLowerCase();
		return text.includes(query.toLowerCase())&&(genre==="All genres"||(story.genre||"Fiction")===genre);
	}).sort((first,second)=>{
		if(sort==="title")return first.title.localeCompare(second.title);
		if(sort==="views")return (second.stats?.views||0)-(first.stats?.views||0);
		return new Date(second.createdAt)-new Date(first.createdAt);
	});

	return <section className="section"><div className="eyebrow">EXPLORE</div><h1>Find your next story.</h1><p className="lead">Browse stories published by the Draftroom community.</p>
		<div className="story-filters"><label>Search stories<input type="search" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Title, writer, or keyword"/></label><label>Genre<select value={genre} onChange={event=>setGenre(event.target.value)}><option>All genres</option>{genres.map(item=><option key={item}>{item}</option>)}</select></label><label>Sort by<select value={sort} onChange={event=>setSort(event.target.value)}><option value="newest">Newest</option><option value="views">Most read</option><option value="title">Title</option></select></label></div>
		{error&&<p className="notice" role="alert">{error}</p>}
		{loading?<p className="lead">Loading stories...</p>:stories.length===0?<div className="card pad"><h2>No published stories yet.</h2><p>When writers publish their stories, they will appear here.</p></div>:visibleStories.length===0?<div className="card pad"><h2>No matching stories.</h2><p>Try a different search or genre.</p></div>:<div className="grid">{visibleStories.map(story=><article className="card story-card" key={story._id}><Link className="story-card-link" to={`/stories/${story._id}`} aria-label={`Read ${story.title}`}><div className="cover">{story.genre?.[0]||"F"}</div><div className="pad"><span className="tag">{story.genre||"Fiction"}</span><h3>{story.title}</h3><p>{story.preview||"Open this story to read it."}</p><small>By {story.ownerId?.username||"Draftroom writer"} · {story.stats?.views||0} reads</small></div></Link></article>)}</div>}
	</section>;
}