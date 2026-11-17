const base='http://127.0.0.1:8765';
async function request(path,body){const response=await fetch(base+'/api/'+path,{cache:'no-store',signal:AbortSignal.timeout(15000),targetAddressSpace:'loopback',headers:{Authorization:'Bearer '+(sessionStorage.getItem('atlas-server-token')||''),...(body===undefined?{}:{'Content-Type':'application/json','X-Atlas-Request':'1'})},...(body===undefined?{}:{method:'POST',body:JSON.stringify(body)})});const result=await response.json();if(!response.ok)throw Error(result.error||'Company server unavailable.');return result;}
export const ready=request('sites');
export const login=()=>ready;
export const logout=async()=>{sessionStorage.removeItem('atlas-source');sessionStorage.removeItem('atlas-server-token');};
export const onAuth=callback=>callback({uid:'company-server'});
export const getRoomScene=id=>request('scene/'+encodeURIComponent(id));
let refresh;
export function watchSites(callback,error){let running=false,last=null;async function poll(){if(running)return;running=true;try{const sites=await request('sites');const next=JSON.stringify(sites);if(next!==last){last=next;callback(sites,false,false);}}catch(e){last=null;error(e);}finally{running=false;}}refresh=poll;poll();const timer=setInterval(poll,2000);window.addEventListener('pagehide',()=>clearInterval(timer),{once:true});}
export async function saveSite(site,expected=null){await request('save',{site,expected});await refresh?.();}
export async function removeSiteCloud(site){await request('remove',{id:site.id,expected:site.revision});await refresh?.();}
export async function importSites(sites){await request('import',{sites});await refresh?.();}

