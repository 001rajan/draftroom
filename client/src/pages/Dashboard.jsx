import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {BarChart,Bar,CartesianGrid,Tooltip,XAxis,YAxis,ResponsiveContainer} from "recharts";
import {authHeaders,useAuth} from "../context/AuthContext";
import api from "../services/api";

export default function Dashboard(){
	const {token,user}=useAuth();
	const [data,setData]=useState(null);
	const [error,setError]=useState("");
	useEffect(()=>{if(token)api.get("/analytics/me",{headers:authHeaders(token)}).then(({data})=>setData(data)).catch(err=>setError(err.response?.data?.message||"Could not load analytics."));},[token]);
	if(!user)return <section className="section"><div className="eyebrow">WRITER DASHBOARD</div><h1>Your readers, measured.</h1><p className="lead">Sign in to see reads and engagement for your published stories.</p><Link className="button primary" to="/account">Create account or sign in</Link></section>;
	if(error)return <section className="section"><h1>Analytics unavailable.</h1><p className="notice">{error}</p></section>;
	if(!data)return <section className="section"><p className="lead">Loading your analytics...</p></section>;
	const stats=[["Views",data.totals.views],["Reads",data.totals.reads],["Likes",data.totals.likes],["Comments",data.totals.comments],["Followers",data.totals.followers]];
	return <section className="section"><div className="eyebrow">WRITER DASHBOARD</div><h1>Understand your readers.</h1><p className="lead">Metrics from your published stories.</p><div className="stats">{stats.map(([label,value])=><div className="stat" key={label}><span>{label}</span><strong>{value.toLocaleString()}</strong></div>)}</div><div className="chart card pad"><h2>Reads this week</h2><div style={{width:"100%",height:300}}><ResponsiveContainer><BarChart data={data.week}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis allowDecimals={false}/><Tooltip/><Bar dataKey="reads" radius={[6,6,0,0]}/></BarChart></ResponsiveContainer></div></div><section className="analytics-stories"><h2>Your stories</h2>{data.stories.length===0?<p>No owned stories to report yet.</p>:data.stories.map(story=><article className="analytics-row" key={story.id}><div><strong>{story.title}</strong><small>{story.status} · {story.chapterCount} chapters</small></div><span>{story.stats.views} views</span><span>{story.stats.reads} reads</span><span>{story.stats.likes} likes</span></article>)}</section></section>;
}