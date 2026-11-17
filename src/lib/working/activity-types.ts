export interface Attempt { id:string; title:string; href:string; correct:boolean; at:number; choice?:number }
export interface SavedModule { key:string; title:string; type:string; href:string }
export interface LessonProgress extends SavedModule { completed:boolean; at:number }
export interface LearningState { attempts:Attempt[]; bookmarks:SavedModule[]; lessons:LessonProgress[] }
export const emptyLearning:LearningState = {attempts:[],bookmarks:[],lessons:[]};
