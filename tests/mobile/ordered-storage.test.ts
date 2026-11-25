import { describe, expect, it } from "vitest";
import { orderedStorage } from "../../mobile/src/core/orderedStorage";
import { scopedProgressStore, type KeyValueStore } from "../../mobile/src/core/progress";
function deferred() {
  let release!: () => void;
  const promise = new Promise<void>(resolve => { release = resolve; });
  return { promise, release };
}
function memory(): KeyValueStore {
  const data = new Map<string,string>();
  return {get:async key=>data.get(key)??null,set:async(key,value)=>{data.set(key,value);},remove:async key=>{data.delete(key);}};
}
describe("ordered progress storage",()=>{
  it("does not let a slow old write overwrite a newer snapshot",async()=>{
    const base=memory();
    const gate=deferred();
    const writes:string[]=[];
    const store=orderedStorage({...base,set:async(key,value)=>{
      writes.push(value);
      if(value==="old") await gate.promise;
      await base.set(key,value);
    }});
    const old=store.set("progress","old");
    const newer=store.set("progress","new");
    const read=store.get("progress");
    await Promise.resolve();
    expect(writes).toEqual(["old"]);
    gate.release();
    await Promise.all([old,newer]);
    expect(await read).toBe("new");
    expect(writes).toEqual(["old","new"]);
  });
  it("keeps account writes independent and waits for earlier writes when rehydrating",async()=>{
    const base=memory();
    const gate=deferred();
    const store=orderedStorage({...base,set:async(key,value)=>{
      if(value==="pending") await gate.promise;
      await base.set(key,value);
    }});
    const a=scopedProgressStore(store,"a"),b=scopedProgressStore(store,"b");
    const pending=a.set("progress","pending");
    await b.set("progress","other");
    expect(await b.get("progress")).toBe("other");
    expect(await store.get("progress")).toBeNull();
    const read=scopedProgressStore(store,"a").get("progress");
    gate.release();
    await pending;
    expect(await read).toBe("pending");
  });
  it("continues after failed writes and orders removals after prior saves",async()=>{
    const base=memory();
    const store=orderedStorage({...base,set:async(key,value)=>{
      if(value==="fail") throw new Error("disk failure");
      await base.set(key,value);
    }});
    const failed=store.set("progress","fail");
    const recovered=store.set("progress","recovered");
    await expect(failed).rejects.toThrow("disk failure");
    await recovered;
    expect(await store.get("progress")).toBe("recovered");
    const save=store.set("progress","latest");
    const remove=store.remove("progress");
    await Promise.all([save,remove]);
    expect(await store.get("progress")).toBeNull();
  });
});
