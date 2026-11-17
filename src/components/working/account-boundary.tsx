import { getSessionUser } from "@/lib/auth";
import { loadLearningState } from "@/lib/working/activity";
import { workingEditionEnabled } from "@/lib/working";
import { LearningProvider } from "./progress";
export async function LearningAccountBoundary({children}:{children:React.ReactNode}){
 if(!workingEditionEnabled())return children;
 const user=await getSessionUser();
 if(!user)return <LearningProvider key="guest" accountId={null}>{children}</LearningProvider>;
 try{const state=await loadLearningState();return <LearningProvider key={user.id} accountId={user.id} initial={state}>{children}</LearningProvider>;}
 catch{return <LearningProvider key={user.id} accountId={user.id} loadError="Account progress could not be loaded. Refresh to try again.">{children}</LearningProvider>;}
}
