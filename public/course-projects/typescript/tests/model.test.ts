import test from 'node:test';
import assert from 'node:assert/strict';
import { addTask, toggleTask, removeTask, visibleTasks, validateTasks, loadTasks, saveTasks, loadIdeas, STORAGE_KEY, MAX_TASKS } from '../src/model';
import type { Task } from '../src/model';
const initial: Task[] = [{id:'a',title:'Read',done:false},{id:'b',title:'Build',done:true}];
test('immutable operations and filtered persistence retain hidden tasks', () => {
  const next = addTask(initial, ' Test ', 'c');
  assert.equal(initial.length, 2); assert.equal(next[2]?.title,'Test');
  assert.deepEqual(visibleTasks(toggleTask(next,'a'),'active').map(t=>t.id),['c']);
  assert.deepEqual(removeTask(next,'b').map(t=>t.id),['a','c']);
  let raw: string | null = null;
  const storage = {getItem:()=>raw,setItem:(_key:string,value:string)=>{raw=value;}};
  saveTasks(storage,next); assert.deepEqual(loadTasks(storage),next);
  assert.equal(initial[0]?.done,false);
});
test('runtime boundaries reject malformed and duplicate data without writes', () => {
  for(const value of [null,{},[null],[{id:'a',title:'Read',done:'false'}],[...initial,initial[0]]]) assert.throws(()=>validateTasks(value));
  assert.throws(()=>addTask(initial,'  ','c')); assert.throws(()=>addTask(initial,'x'.repeat(121),'c'));
  assert.throws(()=>addTask(initial,'Duplicate','a'));
  assert.throws(()=>validateTasks(Array(MAX_TASKS+1).fill(initial[0])));
  const raw='{broken'; const storage={getItem:(key:string)=>{assert.equal(key,STORAGE_KEY);return raw;}};
  assert.throws(()=>loadTasks(storage)); assert.equal(raw,'{broken');
  assert.throws(()=>saveTasks({setItem:()=>{throw new Error('Quota');}},initial),/Quota/);
  assert.equal(addTask([], '<b>Read</b>', 'text')[0]?.title,'<b>Read</b>');
});
test('JSON requests handle normal, empty, HTTP, parse, network, and schema outcomes',async()=>{
  assert.deepEqual(await loadIdeas(async()=>({ok:true,json:async()=>[' Read ']})),['Read']);
  assert.deepEqual(await loadIdeas(async()=>({ok:true,json:async()=>[]})),[]);
  for(const fetcher of [async()=>({ok:false,json:async()=>[]}),async()=>{throw Error('Network');},async()=>({ok:true,json:async()=>{throw Error('JSON');}}),async()=>({ok:true,json:async()=>({wrong:true})}),async()=>({ok:true,json:async()=>['']})]) await assert.rejects(()=>loadIdeas(fetcher));
  const controller=new AbortController(); controller.abort();
  await assert.rejects(()=>loadIdeas(async(_url,options)=>{if(options?.signal?.aborted)throw Error('Aborted');return {ok:true,json:async()=>[]};},controller.signal),/Aborted/);
});
