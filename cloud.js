const backend=await import(sessionStorage.getItem('atlas-source')==='server'?'./server-cloud.js':'./firebase-cloud.js');
export const {ready,login,logout,onAuth,getRoomScene,watchSites,saveSite,removeSiteCloud,importSites}=backend;
