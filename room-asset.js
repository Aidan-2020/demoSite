// The model key still comes from the authenticated Firestore scene record.
// This public manifest contains only ciphertext locations, an IV and a checksum.
export async function loadBedroomAsset(keyBase64,signal,onProgress=()=>{}) {
  const response=await fetch(new URL('./bedroom-splat.json',import.meta.url),{signal});
  if(!response.ok)throw Error('The bedroom download information is unavailable.');
  const meta=await response.json();
  if(meta.format!=='ply'||meta.compression!=='gzip'||!Array.isArray(meta.assetParts)||!meta.assetParts.length)throw Error('Invalid bedroom download information.');
  const assetRoot=new URL('./assets/',import.meta.url);
  let encrypted=new Uint8Array(meta.downloadBytes),offset=0;
  for(const part of meta.assetParts){
    const url=new URL(part,import.meta.url);
    if(url.origin!==assetRoot.origin||!url.pathname.startsWith(assetRoot.pathname))throw Error('Unrecognized room asset location.');
    const result=await fetch(url,{signal});
    if(!result.ok)throw Error('Bedroom download failed ('+result.status+'). Please retry.');
    const reader=result.body.getReader();
    while(true){
      const {value,done}=await reader.read();if(done)break;
      if(offset+value.length>encrypted.length)throw Error('Unexpected bedroom download size.');
      encrypted.set(value,offset);offset+=value.length;
      onProgress('Downloading bedroom… '+Math.round(offset/meta.downloadBytes*100)+'% ('+(offset/1048576).toFixed(1)+' / '+(meta.downloadBytes/1048576).toFixed(1)+' MB)');
    }
  }
  if(offset!==encrypted.length)throw Error('The bedroom download was incomplete.');
  signal.throwIfAborted();onProgress('Opening the protected bedroom…');
  const decode=value=>Uint8Array.from(atob(value),c=>c.charCodeAt(0));
  const key=await crypto.subtle.importKey('raw',decode(keyBase64),'AES-GCM',false,['decrypt']);
  const compressed=await crypto.subtle.decrypt({name:'AES-GCM',iv:decode(meta.iv)},key,encrypted);
  encrypted=null;signal.throwIfAborted();onProgress('Preparing the Gaussian scene…');
  const bytes=await new Response(new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  signal.throwIfAborted();
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),n=>n.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength!==meta.bytes||hash!==meta.sha256)throw Error('The room file did not pass its integrity check.');
  return {meta,bytes};
}
