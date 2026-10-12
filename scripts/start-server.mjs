import {spawn} from 'node:child_process';
import {openSync,writeFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
const base=fileURLToPath(new URL('../',import.meta.url));
try{const r=await fetch('http://127.0.0.1:5210/',{signal:AbortSignal.timeout(1500)});if(r.headers.get('x-game')==='Terrace-and-Tide'){console.log('Already serving http://127.0.0.1:5210/');process.exit(0);}throw new Error('Port 5210 is occupied by another server. It has not been touched.');}catch(e){if(e.message.includes('occupied'))throw e;}
const log=openSync(base+'server.log','a');
const child=spawn(process.execPath,[base+'scripts/serve.mjs'],{cwd:base,detached:true,stdio:['ignore',log,log]});child.unref();
writeFileSync(base+'.server.pid',String(child.pid));
console.log(`Started detached session-only server PID ${child.pid}. No login or boot autostart. http://127.0.0.1:5210/`);
