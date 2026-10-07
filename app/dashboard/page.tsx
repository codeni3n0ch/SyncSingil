"use client";

import AppShell from "@/components/AppShell";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = { full_name: string | null; email: string | null; role: "admin" | "collector" | "staff" };

export default function Dashboard() {
  const [profile,setProfile]=useState<Profile>({full_name:"",email:"",role:"staff"});
  const [stats,setStats]=useState({borrowers:0,loans:0,outstanding:0,due:0,collectedToday:0,interestOutstanding:0,overdue:0});
  const [loading,setLoading]=useState(true);

  useEffect(()=>{
    async function load(){
      const supabase=createClient();
      const {data:{user}}=await supabase.auth.getUser();
      if(!user){window.location.href="/login";return;}
      const {data:p}=await supabase.from("profiles").select("full_name,email,role").eq("id",user.id).maybeSingle();
      const role=(p?.role??"staff") as Profile["role"];
      setProfile({full_name:p?.full_name||user.email?.split("@")[0]||"User",email:p?.email||user.email||"",role});

      const today=new Date().toISOString().slice(0,10);
      const [{count:borrowers},{data:loans},{data:payments}]=await Promise.all([
        supabase.from("borrowers").select("id",{count:"exact",head:true}).eq("status","active"),
        supabase.from("loans").select("balance,due_amount,interest_balance,status,next_due_date").in("status",["active","overdue"]),
        supabase.from("payments").select("amount").eq("payment_date",today)
      ]);
      const list=loans??[];
      setStats({
        borrowers:borrowers??0,
        loans:list.length,
        outstanding:list.reduce((a:any,x:any)=>a+Number(x.balance),0),
        due:list.filter((x:any)=>!x.next_due_date||x.next_due_date<=today).reduce((a:any,x:any)=>a+Number(x.due_amount),0),
        collectedToday:(payments??[]).reduce((a:any,x:any)=>a+Number(x.amount),0),
        interestOutstanding:list.reduce((a:any,x:any)=>a+Number(x.interest_balance||0),0),
        overdue:list.filter((x:any)=>x.status==="overdue").length
      });
      setLoading(false);
    }
    load();
  },[]);

  const firstName=profile.full_name?.trim().split(/\s+/)[0]||"User";
  const greeting=`Good ${new Date().getHours()<12?"morning":new Date().getHours()<18?"afternoon":"evening"}, ${firstName}`;

  return <AppShell>
    <div className="heading">
      <div><h1>{loading?"Loading dashboard...":greeting}</h1><div className="sub">{roleMessage(profile.role)}</div></div>
      <div className="actions">
        {profile.role!=="collector"&&<Link className="btn" href="/reports">Reports</Link>}
        <Link className="btn primary" href={profile.role==="collector"?"/payments":"/borrowers"}>{profile.role==="collector"?"+ Record Payment":"+ Manage Borrower"}</Link>
      </div>
    </div>

    {profile.role==="collector" ? <CollectorDashboard stats={stats}/> : profile.role==="admin" ? <AdminDashboard stats={stats}/> : <StaffDashboard stats={stats}/>} 
  </AppShell>
}

function roleMessage(role:Profile["role"]){
  if(role==="admin") return "Administrator overview of borrowers, loans, collections, and staff activity.";
  if(role==="collector") return "Collection-focused workspace for today's accounts and recorded payments.";
  return "Office operations overview for borrower and loan records.";
}

function AdminDashboard({stats}:any){return <>
 <div className="kpis"><Kpi label="Active Borrowers" value={stats.borrowers} icon="♙"/><Kpi label="Active Loans" value={stats.loans} icon="▣"/><Kpi label="Outstanding Balance" value={money(stats.outstanding)} icon="₱"/><Kpi label="Due Today" value={money(stats.due)} icon="◷"/></div>
 <div className="grid2"><div className="card"><div className="card-head"><div><h3>Portfolio Overview</h3><div className="muted">Live database totals</div></div></div><div style={{fontSize:38,fontWeight:800,margin:"25px 0 5px"}}>{money(stats.outstanding)}</div><div className="muted">Total outstanding balance</div><div className="notice" style={{marginTop:18}}>Outstanding interest currently tracked: <b>{money(stats.interestOutstanding)}</b></div></div><QuickActions/></div>
 <CollectionSnapshot stats={stats}/>
 </>}

function CollectorDashboard({stats}:any){return <>
 <div className="kpis"><Kpi label="Due Today" value={money(stats.due)} icon="◷"/><Kpi label="Collected Today" value={money(stats.collectedToday)} icon="₱"/><Kpi label="Accounts to Collect" value={stats.loans} icon="♙"/><Kpi label="Overdue" value={stats.overdue} icon="!"/></div>
 <div className="grid2"><div className="card"><div className="card-head"><div><h3>Today's Collection</h3><div className="muted">Focus on scheduled and overdue accounts.</div></div></div><div style={{fontSize:38,fontWeight:800,margin:"25px 0 5px"}}>{money(stats.collectedToday)}</div><div className="muted">Payments recorded today</div><div className="notice" style={{marginTop:18}}>When you select a loan during collection, SyncSINGIL shows the saved interest rate and how much of the payment goes to interest versus principal.</div></div><QuickActions collector/></div>
 <CollectionSnapshot stats={stats}/>
 </>}

function StaffDashboard({stats}:any){return <>
 <div className="kpis"><Kpi label="Active Borrowers" value={stats.borrowers} icon="♙"/><Kpi label="Active Loans" value={stats.loans} icon="▣"/><Kpi label="Outstanding" value={money(stats.outstanding)} icon="₱"/><Kpi label="Overdue Accounts" value={stats.overdue} icon="!"/></div>
 <div className="grid2"><div className="card"><h3>Office Work Queue</h3><div className="notice" style={{marginTop:15}}>Use this dashboard for borrower details, loan setup, and account monitoring. Collectors receive a separate collection-focused dashboard.</div><div style={{display:"grid",gap:10,marginTop:15}}><Link className="btn" href="/borrowers">Manage Borrowers</Link><Link className="btn" href="/loans">Create / Monitor Loans</Link></div></div><div className="card"><h3>Portfolio</h3><div style={{fontSize:32,fontWeight:800,margin:"15px 0 5px"}}>{money(stats.outstanding)}</div><div className="muted">Outstanding loan balance</div></div></div>
 </>}

function QuickActions({collector=false}:{collector?:boolean}){return <div className="card"><div className="card-head"><div><h3>Quick Actions</h3><div className="muted">Common tasks for your role</div></div></div><div style={{display:"grid",gap:10,marginTop:15}}>{collector?<><Link className="btn primary" href="/payments">+ Record Payment</Link><Link className="btn" href="/collections">View Collection Schedule</Link></>:<><Link className="btn" href="/borrowers">+ Add / Manage Borrower</Link><Link className="btn" href="/loans">+ Create Loan</Link><Link className="btn" href="/collections">View Collection Schedule</Link></>}</div></div>}

function CollectionSnapshot({stats}:any){return <div className="card" style={{marginTop:17}}><div className="card-head"><h3>Collection Snapshot</h3><Link className="muted" href="/collections">View schedule →</Link></div><div className="form-grid" style={{marginTop:15}}><Info label="Due today" value={money(stats.due)}/><Info label="Collected today" value={money(stats.collectedToday)}/><Info label="Outstanding interest" value={money(stats.interestOutstanding)}/><Info label="Overdue accounts" value={String(stats.overdue)}/></div></div>}
function Info({label,value}:{label:string,value:string}){return <div><div className="muted">{label}</div><b style={{fontSize:18}}>{value}</b></div>}
function Kpi({label,value,icon}:{label:string,value:string|number,icon:string}){return <div className="kpi"><div className="kpi-top"><span>{label}</span><span className="kpi-icon">{icon}</span></div><strong>{value}</strong></div>}
function money(v:number){return `₱${Number(v||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}
