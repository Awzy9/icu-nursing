export interface Attempt { id:string; title:string; href:string; correct:boolean; at:number; choice?:number; box?:number }
export interface SavedModule { key:string; title:string; type:string; href:string }
export interface LessonProgress extends SavedModule { completed:boolean; at:number }
export interface SessionRecord extends SavedModule { kind:"quiz"|"scenario"; version:string; position:number; score:number; finished:boolean; at:number }
export interface LearningState { attempts:Attempt[]; bookmarks:SavedModule[]; lessons:LessonProgress[]; sessions:SessionRecord[] }
export const emptyLearning:LearningState = {attempts:[],bookmarks:[],lessons:[],sessions:[]};
