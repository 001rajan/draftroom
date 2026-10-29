import {useEffect,useState} from "react";
import {Link} from "react-router-dom";
import {authHeaders,useAuth} from "../context/AuthContext";
import api from "../services/api";

export default function Moderation(){
  const {token,user}=useAuth();
  const [reports,setReports]=useState([]);
  const [error,setError]=useState("");
  const load=()=>api.get("/reports",{headers:authHeaders(token)}).then(({data})=>setReports(data)).catch(err=>setError(err.response?.data?.message||"Could not load reports."));
  useEffect(()=>{if(token&&user?.role==="admin")load();},[token,user?.role]);

  const act=async(id,action)=>{
    try{await api.patch(`/reports/${id}`,{action},{headers:authHeaders(token)});load();}
    catch(err){setError(err.response?.data?.message||"Could not update report.");}
  };

  if(user?.role!=="admin")return <section className="section"><div className="eyebrow">MODERATION</div><h1>Administrator access only.</h1><p className="lead">Reports are reviewed by designated Draftroom administrators.</p></section>;
  return <section className="section"><div className="eyebrow">MODERATION QUEUE</div><h1>Review story reports.</h1>{error&&<p className="notice" role="alert">{error}</p>}{reports.length===0?<p>No reports to review.</p>:<div className="moderation-list">{reports.map(report=><article className="card pad" key={report._id}><span className="tag">{report.status} · {report.reason}</span><h2>{report.storyId?.title||"Story removed"}</h2><p>{report.details||"No extra details supplied."}</p><small>Reported by {report.reporterId?.username} · {new Date(report.createdAt).toLocaleString()}</small>{report.storyId&&<p><Link to={`/stories/${report.storyId._id}`}>Open reported story</Link></p>}<div className="hero-actions"><button className="button secondary" onClick={()=>act(report._id,"reviewed")}>Mark reviewed</button><button className="button secondary" onClick={()=>act(report._id,"resolved")}>Resolve</button><button className="button primary" onClick={()=>act(report._id,"hide-story")}>Hide story</button></div></article>)}</div>}</section>;
}