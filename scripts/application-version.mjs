import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** A code-only startup fix must get a new public release URL too. */
export async function applicationVersion(root){
  const files=[];
  async function walk(path){
    for(const entry of await readdir(new URL(path,root),{withFileTypes:true})){
      const name=path+entry.name;if(entry.isDirectory())await walk(name+'/');
      else if(/\.(tsx?|jsx?|css|json|html|svg)$/.test(name))files.push(name);
    }
  }
  for(const folder of ['app/','components/','content/','github-pages/','lib/'])await walk(folder);
  files.push('package.json','package-lock.json','scripts/build-github.mjs','scripts/application-version.mjs');
  const hash=createHash('sha256');
  for(const file of files.sort())hash.update(file).update('\0').update(await readFile(new URL(file,root))).update('\0');
  return hash.digest('hex');
}
