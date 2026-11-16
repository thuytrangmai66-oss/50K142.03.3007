import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { expect,it,vi } from 'vitest';

async function setup(){
 let handler!:(request:Request)=>Promise<Response>;
 const state={active:true,missing:false,versionChanged:false,passwordValid:true,wrongAuthUser:false};let reads=0;
 const signIn=vi.fn(async (input:Record<string,unknown>)=>{void input;return {data:{session:state.passwordValid?{access_token:'isolated-access',refresh_token:'isolated-refresh',user:{id:'staff-auth',email:'private@test.invalid'}}:null,user:{id:state.wrongAuthUser?'different-auth':'staff-auth'}},error:state.passwordValid?null:{message:'invalid'}};});
 const signOut=vi.fn(async()=>({error:null}));
 const admin={from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:state.missing?null:{auth_user_id:'staff-auth',active:state.active,role:'staff',version:++reads>1&&state.versionChanged?2:1},error:null})})})}),
  auth:{admin:{getUserById:vi.fn(async()=>({data:{user:{id:'staff-auth',email:'private@test.invalid'}},error:null}))}}};
 const auth={auth:{signInWithPassword:signIn,signOut}};
 const source=(await readFile('supabase/functions/auth-login/index.ts','utf8')).replace(/^import .*;\r?$/gm,'');
 const js=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.None}}).outputText;
 const deno={env:{get:(key:string)=>({SUPABASE_URL:'https://edge-test.invalid',SUPABASE_SERVICE_ROLE_KEY:'isolated-admin',SUPABASE_ANON_KEY:'isolated-anon'} as Record<string,string>)[key]},serve:(fn:typeof handler)=>{handler=fn;}};
 new Function('Deno','createClient',js)(deno,(_url:string,key:string)=>key==='isolated-admin'?admin:auth);
 const call=async()=>{const response=await handler(new Request('https://edge-test.invalid/auth-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'renamed',password:'private-password',role:'owner'})}));return {status:response.status,body:await response.json()};};
 return {state,signIn,signOut,call,admin};
}
it('login resolves renamed username on the server, ignores caller role and returns only the authenticated session without password',async()=>{
 const s=await setup();const result=await s.call();expect(result.status).toBe(200);expect(result.body).toEqual({session:{access_token:'isolated-access',refresh_token:'isolated-refresh',user:{id:'staff-auth',email:'private@test.invalid'}}});
 expect(s.signIn).toHaveBeenCalledWith({email:'private@test.invalid',password:'private-password'});expect(JSON.stringify(result.body)).not.toMatch(/private-password|owner/);
});
it.each(['inactive','missing','wrongPassword','wrongAuthUser'] as const)('login fails closed with the same public error for %s',async mode=>{
 const s=await setup();if(mode==='inactive')s.state.active=false;if(mode==='missing')s.state.missing=true;if(mode==='wrongPassword')s.state.passwordValid=false;if(mode==='wrongAuthUser')s.state.wrongAuthUser=true;
 const result=await s.call();expect(result).toEqual({status:400,body:{code:'INVALID_CREDENTIALS',message:'Tên đăng nhập hoặc mật khẩu không đúng'}});
 if(mode==='inactive'||mode==='missing'){expect(s.admin.auth.admin.getUserById).not.toHaveBeenCalled();expect(s.signIn.mock.calls[0][0].email).toBe('unknown-user@coco.invalid');}
});
it('profile change during authentication signs out and returns no usable session',async()=>{
 const s=await setup();s.state.versionChanged=true;const result=await s.call();expect(result.status).toBe(400);expect(result.body).not.toHaveProperty('session');expect(s.signOut).toHaveBeenCalledWith({scope:'local'});
});
