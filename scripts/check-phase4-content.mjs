// Compile authored teaching examples in isolation; never execute learner input.
import ts from 'typescript';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const root=new URL('../',import.meta.url).pathname;
const dir=mkdtempSync(join(root,'.phase4-content-'));
try {
  const files=[];let executed=0;
  for(const course of ['typescript','react']) {
    const notes=JSON.parse(readFileSync(join(root,`src/lib/learning/${course}-notes.json`),'utf8'));
    for(const note of notes) {
      const context=note.slug==='react-sharing'?'declare const tasks: {id:string;done:boolean}[]; declare const view: string;\n':'';
      const file=join(dir,note.slug+(course==='react'?'.tsx':'.ts'));
      writeFileSync(file,context+note.code+'\nexport {};\n'); files.push(file);
      if(course==='typescript' && !['typescript-dom','typescript-project-placeholder'].includes(note.slug)) {
        const source=ts.transpileModule(note.code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText;
        const lines=[];vm.runInNewContext(source,{exports:{},console:{log:(...values)=>lines.push(values.join(' '))}},{timeout:1000});
        assert.equal(lines.join('\n'),note.output,note.slug);executed++;
      }
    }
  }
  const program=ts.createProgram(files,{strict:true,noEmit:true,skipLibCheck:true,target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext,moduleResolution:ts.ModuleResolutionKind.Bundler,jsx:ts.JsxEmit.ReactJSX});
  const diagnostics=ts.getPreEmitDiagnostics(program);
  if(diagnostics.length) throw Error(ts.formatDiagnosticsWithColorAndContext(diagnostics,{getCurrentDirectory:()=>root,getCanonicalFileName:f=>f,getNewLine:()=> '\n'}));
  console.log(`Checked ${files.length} TypeScript/React examples; executed ${executed} pure TypeScript examples with expected output.`);
} finally { rmSync(dir,{recursive:true,force:true}); }
