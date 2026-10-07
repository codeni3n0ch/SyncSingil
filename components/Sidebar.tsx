"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, WalletCards, CalendarDays, BarChart3, ShieldCheck, LogOut, BriefcaseBusiness } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";

type Role="admin"|"collector"|"staff";

const allItems = [
  ["/dashboard","Dashboard",LayoutDashboard,"all"],
  ["/borrowers","Borrowers & Loans",Users,"admin,staff,collector"],
  ["/payments","Payments",WalletCards,"admin,collector"],
  ["/collections","Collection Schedule",CalendarDays,"admin,collector,staff"],
  ["/reports","Reports & Monitoring",BarChart3,"admin,staff"],
  ["/users","User Access",ShieldCheck,"admin"]
] as const;

export default function Sidebar() {
  const pathname = usePathname();
  const [profile,setProfile]=useState<{full_name:string;role:Role}>({full_name:"User",role:"staff"});

  useEffect(()=>{
    async function load(){
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user)return;
      const {data:p}=await supabase.from("profiles").select("full_name,role").eq("id",user.id).maybeSingle();
      setProfile({full_name:p?.full_name||user.email?.split("@")[0]||"User",role:(p?.role??"staff") as Role});
    }
    load();
  },[]);

  const items=allItems.filter(([, , , roles])=>roles==="all"||roles.split(",").includes(profile.role));
  const initials=profile.full_name.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toUpperCase()||"U";

  async function logout(){await createClient().auth.signOut();window.location.href="/login";}

  return <aside className="sidebar">
    <div className="logo"><div className="logo-mark">S</div><div><b>SyncSINGIL</b><small>Microloan Management</small></div></div>
    <nav>
      <div className="nav-title">Main</div>
      {items.filter(([href])=>!["/reports","/users"].includes(href)).map(([href,label,Icon])=><Link key={href} href={href} className={`nav-link ${pathname===href||pathname.startsWith(href+"/")?"active":""}`}><Icon size={18}/><span>{label}</span></Link>)}
      <div className="nav-title">Management</div>
      {items.filter(([href])=>["/reports","/users"].includes(href)).map(([href,label,Icon])=><Link key={href} href={href} className={`nav-link ${pathname===href?"active":""}`}><Icon size={18}/><span>{label}</span></Link>)}
      <button className="nav-link" onClick={logout}><LogOut size={18}/><span>Sign out</span></button>
    </nav>
    <div className="user"><div className="avatar">{initials}</div><div><b style={{fontSize:12}}>{profile.full_name}</b><br/><small>{roleLabel(profile.role)}</small></div></div>
  </aside>;
}
function roleLabel(role:Role){return role==="admin"?"Administrator":role==="collector"?"Collector":"Office Staff";}
