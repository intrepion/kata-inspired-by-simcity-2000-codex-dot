export const SIZE = 16;
export type Kind = 'empty'|'road'|'residential'|'commercial'|'industrial'|'power'|'water'|'clinic'|'fire'|'park';
export type Terrain = 'land'|'river'|'rock';
export interface Tile { terrain: Terrain; kind: Kind; amount: number }
export interface City { version: 1; tiles: Tile[]; cash: number; month: number; tax: number; speed: 0|1|4; grant: boolean; milestones: boolean[]; stable: number; won: boolean; history: {pop:number;cash:number;net:number}[] }
export const CATALOG: Record<Exclude<Kind,'empty'>,{name:string;cost:number;upkeep:number;max:number;hint:string;shortcut:string}> = {
 road:{name:'Road',cost:30,upkeep:2,max:0,hint:'Connect districts and carry both utilities.',shortcut:'1'},
 residential:{name:'Homes',cost:120,upkeep:1,max:40,hint:'40 residents. Needs jobs, clean air and utilities.',shortcut:'2'},
 commercial:{name:'Shops',cost:180,upkeep:1,max:30,hint:'30 jobs. Clean workplaces near homes.',shortcut:'3'},
 industrial:{name:'Workshops',cost:150,upkeep:1,max:40,hint:'40 jobs. Affordable, but pollutes nearby homes.',shortcut:'4'},
 power:{name:'Wind turbine',cost:900,upkeep:60,max:0,hint:'600 power capacity via adjacent roads.',shortcut:'5'},
 water:{name:'River pump',cost:650,upkeep:50,max:0,hint:'600 water capacity. Must touch the river.',shortcut:'6'},
 clinic:{name:'Clinic',cost:500,upkeep:35,max:0,hint:'Health coverage within 4 tiles; needs a road.',shortcut:'7'},
 fire:{name:'Fire station',cost:500,upkeep:35,max:0,hint:'Safety coverage within 4 tiles; needs a road.',shortcut:'8'},
 park:{name:'Pocket park',cost:100,upkeep:8,max:0,hint:'Reduces pollution within 3 tiles.',shortcut:'9'},
};
export const id = (x:number,y:number) => y*SIZE+x;
export const coords = (i:number):[number,number] => [i%SIZE,Math.floor(i/SIZE)];
export const neighbors = (i:number):number[] => { const [x,y]=coords(i); return [[x-1,y],[x+1,y],[x,y-1],[x,y+1]].filter(([a,b])=>a>=0&&b>=0&&a<SIZE&&b<SIZE).map(([a,b])=>id(a,b)); };
export const distance = (a:number,b:number) => {const [x,y]=coords(a),[u,v]=coords(b);return Math.abs(x-u)+Math.abs(y-v);};
export function terrainAt(x:number,y:number):Terrain { return x<=1 || (y>=11 && x<=3) ? 'river' : (x>=13&&y<=2)||(x===15&&y<=5)?'rock':'land'; }
export function createCity():City {return {version:1,tiles:Array.from({length:SIZE*SIZE},(_,i)=>{const [x,y]=coords(i);return {terrain:terrainAt(x,y),kind:'empty',amount:0};}),cash:14000,month:0,tax:9,speed:0,grant:false,milestones:[false,false,false],stable:0,won:false,history:[]};}
function validCoordinate(x:number,y:number) { return Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<SIZE&&y<SIZE; }
export function place(city:City,x:number,y:number,kind:Exclude<Kind,'empty'>):{ok:boolean;message:string} {
 if(!validCoordinate(x,y)||!Object.hasOwn(CATALOG,kind)) return {ok:false,message:'Choose a valid tile and building.'};
 const i=id(x,y),t=city.tiles[i],item=CATALOG[kind];
 if(t.terrain!=='land')return {ok:false,message:t.terrain==='river'?'The river is protected. Build on the shore.':'The rocky ridge cannot be built on.'};
 if(t.kind!=='empty')return {ok:false,message:'This tile is occupied. Bulldoze it first.'};
 if(kind==='water'&&!neighbors(i).some(n=>city.tiles[n].terrain==='river'))return {ok:false,message:'River pumps must touch a river tile.'};
 if(city.cash<item.cost)return {ok:false,message:`Need $${item.cost}. Lower costs or use the recovery grant.`};
 city.cash-=item.cost; city.tiles[i]={...t,kind,amount:0};return {ok:true,message:`${item.name} built for $${item.cost}.`};
}
export function demolish(city:City,x:number,y:number):boolean {if(!validCoordinate(x,y))return false;const t=city.tiles[id(x,y)];if(t.kind==='empty')return false;t.kind='empty';t.amount=0;return true;}
export interface Network {roads:number[];power:number;water:number;used:number}
export interface District {road:boolean;power:boolean;water:boolean;served:boolean;network:number;pollution:number;health:boolean;safety:boolean;satisfaction:number;reason:string}
export interface Report {networks:Network[];roadNetwork:number[];districts:Record<number,District>;population:number;jobs:number;workforce:number;employed:number;unemployment:number;satisfaction:number;coverage:number;utilities:number;income:number;upkeep:number;net:number;demand:{residential:number;commercial:number;industrial:number};power:number;water:number;reserved:number;pollution:number[]}
export const isZone = (k:Kind): k is 'residential'|'commercial'|'industrial' => ['residential','commercial','industrial'].includes(k);
const clamp = (n:number,min:number,max:number) => Math.max(min,Math.min(max,n));
export function analyze(city:City):Report {
 const roadNetwork=Array<number>(SIZE*SIZE).fill(-1),networks:Network[]=[];
 for(let i=0;i<city.tiles.length;i++)if(city.tiles[i].kind==='road'&&roadNetwork[i]<0){
  const index=networks.length,roads=[i];roadNetwork[i]=index;
  for(let h=0;h<roads.length;h++)for(const n of neighbors(roads[h]))if(city.tiles[n].kind==='road'&&roadNetwork[n]<0){roadNetwork[n]=index;roads.push(n);}
  networks.push({roads,power:0,water:0,used:0});
 }
 const adjacent = (i:number) => [...new Set(neighbors(i).map(n=>roadNetwork[n]).filter(n=>n>=0))].sort((a,b)=>a-b);
 city.tiles.forEach((t,i)=>{if(t.kind==='power'||t.kind==='water'){const n=adjacent(i)[0];if(n!==undefined)networks[n][t.kind]+=600;}});
 let population=0,jobs=0,upkeep=0;
 city.tiles.forEach(t=>{if(t.kind==='residential')population+=t.amount;else if(t.kind==='commercial'||t.kind==='industrial')jobs+=t.amount;if(t.kind!=='empty')upkeep+=CATALOG[t.kind].upkeep;});
 const workforce=Math.floor(population*.6),employed=Math.min(jobs,workforce),unemployment=workforce?Math.round((workforce-employed)/workforce*100):0;
 const pollution=city.tiles.map((_,i)=>clamp(city.tiles.reduce((total,t,j)=>{const d=distance(i,j);return total+(d<=3?(t.kind==='industrial'?18*(4-d):t.kind==='park'?-12*(4-d):0):0);},0),0,100));
 const districts:Record<number,District>={};let score=0,weight=0,covered=0,served=0,zones=0;
 city.tiles.forEach((t,i)=>{if(!isZone(t.kind))return;
  zones++;const options=adjacent(i),units=CATALOG[t.kind].max;
  const selected=options.find(n=>networks[n].power-networks[n].used>=units&&networks[n].water-networks[n].used>=units)??options[0]??-1;
  const n=networks[selected];const power=!!n&&n.power-n.used>=units,water=!!n&&n.water-n.used>=units;
  if(n)n.used+=units;
  const service=(k:Kind)=>city.tiles.some((s,j)=>s.kind===k&&distance(i,j)<=4&&adjacent(j).includes(selected)&&selected>=0);
  const health=service('clinic'),safety=service('fire');
  const satisfaction=clamp(Math.round(72+(health?12:0)+(safety?12:0)-pollution[i]*.5-Math.max(0,city.tax-9)*5-unemployment*.3),0,100);
  let reason=selected<0?'Connect a road beside this district.':!power?'Power capacity missing on this road network.':!water?'Water capacity missing on this road network.':t.kind==='residential'&&city.tax>12?'Taxes above 12% are driving residents away.':t.kind==='residential'&&pollution[i]>=45?'Pollution is too high. Move industry or add parks.':t.kind==='residential'&&satisfaction<40?'Low satisfaction. Improve jobs and civic coverage.':t.kind==='residential'&&jobs<workforce&&population>=40?'More jobs needed. Zone shops or workshops.':t.kind!=='residential'&&jobs>=workforce+40?'Workplace demand is low. Add more homes.':t.amount>=CATALOG[t.kind].max?'Fully developed. Ready for the next district.':'Ready to grow next month.';
  const d={road:selected>=0,power,water,served:power&&water,network:selected,pollution:pollution[i],health,safety,satisfaction,reason};districts[i]=d;
  if(d.served)served++;if(t.kind==='residential'){const w=Math.max(1,t.amount);score+=satisfaction*w;weight+=w;if(health&&safety)covered+=t.amount;}
 });
 const income=Math.round(population*city.tax/100*28)+Math.round(employed*city.tax/100*18);
 return {networks,roadNetwork,districts,population,jobs,workforce,employed,unemployment,satisfaction:weight?Math.round(score/weight):72,coverage:population?Math.round(covered/population*100):0,utilities:zones?Math.round(served/zones*100):0,income,upkeep,net:income-upkeep,demand:{residential:clamp(Math.round(55+(jobs-workforce)*.5-Math.max(0,city.tax-9)*10),0,100),commercial:clamp(Math.round(60+(workforce-jobs)*.8),0,100),industrial:clamp(Math.round(50+(workforce-jobs)*.6),0,100)},power:networks.reduce((a,n)=>a+n.power,0),water:networks.reduce((a,n)=>a+n.water,0),reserved:networks.reduce((a,n)=>a+n.used,0),pollution};
}
export function qualifies(r:Report,city:City):boolean {return r.population>=240&&r.jobs>=120&&r.satisfaction>=65&&r.utilities===100&&r.coverage>=75&&r.net>=0&&city.cash>=1500;}
export function tick(city:City):string[] {
 const before=analyze(city);const notices:string[]=[];
 // One shared snapshot prevents tile iteration order from changing growth decisions.
 city.tiles.forEach((t,i)=>{if(!isZone(t.kind))return;const d=before.districts[i];
  const bad=!d.served||(t.kind==='residential'&&(city.tax>12||d.pollution>=45||d.satisfaction<40));
  if(bad)t.amount=Math.max(0,t.amount-10);
  else if(t.kind==='residential'?(before.jobs>=before.workforce||before.population<40):before.jobs<before.workforce+40)t.amount=Math.min(CATALOG[t.kind].max,t.amount+10);
 });
 const r=analyze(city);city.month++;city.cash=clamp(city.cash+r.net,-1000000,1000000000);
 if(r.upkeep===0&&city.cash<500){city.cash=3000;notices.push('Fresh-start relief: the empty harbor receives $3,000 to rebuild.');}
 if(!city.milestones[0]&&r.population>=40&&r.utilities===100){city.milestones[0]=true;city.cash+=500;notices.push('First neighbors! Charter grant: $500.');}
 if(city.milestones[0]&&!city.milestones[1]&&r.population>=160&&r.jobs>=80&&r.coverage>=75){city.milestones[1]=true;city.cash+=750;notices.push('A town that cares. Charter grant: $750.');}
 city.stable=qualifies(r,city)?Math.min(3,city.stable+1):0;
 if(!city.won&&city.milestones[1]&&city.stable===3){city.won=true;city.milestones[2]=true;notices.push('Harbor Charter complete! Your city has a future.');}
 city.cash=clamp(city.cash,-1000000,1000000000);
 city.history.push({pop:r.population,cash:city.cash,net:r.net});city.history=city.history.slice(-24);return notices;
}
export function setTax(city:City,tax:number) {if(Number.isInteger(tax)&&tax>=5&&tax<=15)city.tax=tax;}
export function rescue(city:City):boolean {if(city.grant||city.cash>=500)return false;city.cash=clamp(city.cash+3000,-1000000,1000000000);city.grant=true;return true;}
export interface Clock {elapsed:number}
export function advance(city:City,clock:Clock,seconds:number):string[] {
 if(city.speed===0){clock.elapsed=0;return [];}
 if(!Number.isFinite(seconds)||seconds<0)return [];
 clock.elapsed+=Math.min(seconds,2)*city.speed;const messages:string[]=[];
 while(clock.elapsed>=2){clock.elapsed-=2;messages.push(...tick(city));}return messages;
}
