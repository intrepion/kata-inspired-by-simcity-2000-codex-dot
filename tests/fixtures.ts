import {createCity,place,type City,type Kind} from '../src/simulation';
export function build(c:City,x:number,y:number,k:Exclude<Kind,'empty'>){const result=place(c,x,y,k);if(!result.ok)throw new Error(`${k} ${x},${y}: ${result.message}`);}
export function charterCity(){const c=createCity();for(let x=2;x<=11;x++)build(c,x,5,'road');for(const x of [5,9])for(const y of [4,6,7,8,9])build(c,x,y,'road');build(c,2,4,'water');build(c,3,4,'power');build(c,6,4,'clinic');build(c,7,4,'fire');for(const [x,y] of [[4,4],[5,3],[6,6],[7,6],[8,4],[8,6]])build(c,x,y,'residential');for(const [x,y] of [[10,4],[11,4],[10,6],[11,6],[8,7],[10,7]])build(c,x,y,'commercial');return c;}
export function settle(c:City,months:number,tick:(c:City)=>unknown){for(let i=0;i<months;i++)tick(c);}
