import { Link, Route, Routes } from "react-router-dom";
import { BookOpen, BarChart3, Trophy, Users, PenLine, Compass } from "lucide-react";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Challenges from "./pages/Challenges";
import Collaborate from "./pages/Collaborate";
import Dashboard from "./pages/Dashboard";
import CreateStory from "./pages/CreateStory";
import Account from "./pages/Account";
import MyDrafts from "./pages/MyDrafts";
import StoryReader from "./pages/StoryReader";
import WriterProfile from "./pages/WriterProfile";
import PasswordReset from "./pages/PasswordReset";
import Moderation from "./pages/Moderation";
import Bookmarks from "./pages/Bookmarks";
import {AuthProvider,useAuth} from "./context/AuthContext";

const nav = [
  ["/", "Home", BookOpen],
  ["/explore", "Explore", Compass],
  ["/challenges", "Challenges", Trophy],
  ["/collaborate", "Collaborate", Users],
  ["/dashboard", "Analytics", BarChart3],
];

function AppLayout() {
  const {user}=useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand"><span className="brand-dot"/>Draftroom</Link>
        <nav>{nav.map(([to, label, Icon]) =>
          <Link key={to} to={to} className="nav-link"><Icon size={15}/>{label}</Link>
        )}</nav>
        <div className="account-actions">
          {user&&<Link to="/drafts" className="nav-link">My stories</Link>}
          {user&&<Link to="/bookmarks" className="nav-link">Bookmarks</Link>}
          {user?.role==="admin"&&<Link to="/moderation" className="nav-link">Moderation</Link>}
          <Link to="/account" className="button secondary">{user?.username||"Account"}</Link>
          <Link to="/create" className="button primary"><PenLine size={16}/> Start Writing</Link>
        </div>
      </header>
      <main className="page-wrap">
        <Routes>
          <Route path="/" element={<Home/>}/>
          <Route path="/explore" element={<Explore/>}/>
          <Route path="/challenges" element={<Challenges/>}/>
          <Route path="/collaborate" element={<Collaborate/>}/>
          <Route path="/dashboard" element={<Dashboard/>}/>
          <Route path="/create" element={<CreateStory/>}/>
          <Route path="/stories/:storyId/edit" element={<CreateStory/>}/>
          <Route path="/stories/:storyId" element={<StoryReader/>}/>
          <Route path="/writers/:username" element={<WriterProfile/>}/>
          <Route path="/account" element={<Account/>}/>
          <Route path="/reset-password" element={<PasswordReset/>}/>
          <Route path="/moderation" element={<Moderation/>}/>
          <Route path="/drafts" element={<MyDrafts/>}/>
          <Route path="/bookmarks" element={<Bookmarks/>}/>
        </Routes>
      </main>
    </div>
  );
}

export default function App(){
  return <AuthProvider><AppLayout/></AuthProvider>;
}