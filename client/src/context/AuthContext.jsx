import {createContext,useContext,useEffect,useState} from "react";
import api from "../services/api";

const AuthContext=createContext(null);
const STORAGE_KEY="draftroom-session";

function readSession(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY))||null;}catch{return null;}
}

export function AuthProvider({children}){
  const [session,setSession]=useState(readSession);

  useEffect(()=>{
    if(!session?.token)return;
    api.get("/auth/me",{headers:{Authorization:`Bearer ${session.token}`}}).then(({data})=>{
      setSession(current=>{
        if(!current)return current;
        const updated={...current,user:data.user};
        localStorage.setItem(STORAGE_KEY,JSON.stringify(updated));
        return updated;
      });
    }).catch(()=>{
      localStorage.removeItem(STORAGE_KEY);
      setSession(null);
    });
  },[session?.token]);

  const authenticate=async(path,credentials)=>{
    const {data}=await api.post(`/auth/${path}`,credentials);
    localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    setSession(data);
    return data;
  };

  const signOut=()=>{
    localStorage.removeItem(STORAGE_KEY);
    setSession(null);
  };

  const updateUser=user=>{
    setSession(current=>{
      const updated={...current,user:{...current.user,...user}};
      localStorage.setItem(STORAGE_KEY,JSON.stringify(updated));
      return updated;
    });
  };

  return <AuthContext.Provider value={{user:session?.user||null,token:session?.token||null,authenticate,signOut,updateUser}}>{children}</AuthContext.Provider>;
}

export function useAuth(){return useContext(AuthContext);}

export function authHeaders(token){
  return {Authorization:`Bearer ${token}`};
}