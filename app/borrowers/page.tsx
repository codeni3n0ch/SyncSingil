import AppShell from "@/components/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import BorrowerForm from "@/components/BorrowerForm";

export default async function BorrowersPage() {
  const {data: borrowers} = await (await createServerSupabaseClient()).from("borrowers").select("*,loans(id,balance,status)").order("created_at",{ascending:false});
  return <AppShell>
    <div className="heading"><div><h1>Borrowers & Loans</h1><div className="sub">Centralized borrower profiles, loan details, and balances.</div></div></div>
    <BorrowerForm/>
    <div className="panel" style={{marginTop:17}}><table><thead><tr><th>Borrower</th><th>Contact</th><th>Area</th><th>Active Loans</th><th>Balance</th><th>Status</th><th></th></tr></thead><tbody>
    {(borrowers??[]).map((b:any)=>{const loans=(b.loans??[]).filter((x:any)=>["active","overdue"].includes(x.status)); const balance=loans.reduce((a:number,x:any)=>a+Number(x.balance),0); return <tr key={b.id}><td><b>{b.full_name}</b><br/><span className="muted">{b.borrower_code}</span></td><td>{b.contact_number??"—"}</td><td>{b.area??"—"}</td><td>{loans.length}</td><td><b>₱{balance.toLocaleString()}</b></td><td><span className={`badge ${b.status==="active"?"green":"red"}`}>{b.status}</span></td><td><Link className="btn" href={`/borrowers/${b.id}`}>View</Link></td></tr>})}
    {!borrowers?.length && <tr><td colSpan={7} className="empty">No borrowers yet. Add the first borrower above.</td></tr>}
    </tbody></table></div>
  </AppShell>
}
