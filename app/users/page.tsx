import AppShell from "@/components/AppShell";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import RoleAssignmentForm from "@/components/RoleAssignmentForm";

export default async function UsersPage(){
 const {data:users}=await (await createServerSupabaseClient()).from("profiles").select("*").order("created_at");
 return <AppShell><div className="heading"><div><h1>User Access Control</h1><div className="sub">Manage application roles and authorized staff.</div></div></div><RoleAssignmentForm/><div className="panel"><table><thead><tr><th>User</th><th>Role</th><th>Status</th><th>Created</th></tr></thead><tbody>{(users??[]).map((u:any)=><tr key={u.id}><td><b>{u.full_name||u.email}</b><br/><span className="muted">{u.email}</span></td><td>{u.role}</td><td><span className="badge green">Active</span></td><td>{u.created_at?.slice(0,10)}</td></tr>)}{!users?.length&&<tr><td colSpan={4} className="empty">No profiles found. Create Auth users and profile rows in Supabase.</td></tr>}</tbody></table></div></AppShell>
}
