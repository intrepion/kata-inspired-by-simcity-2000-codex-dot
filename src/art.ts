import {CATALOG, SIZE,coords,id,neighbors,type City,type Kind,type Report} from './simulation';
export type Overlay='city'|'roads'|'power'|'water'|'services'|'pollution';
export const COLORS:Record<Kind,string>={empty:'#9cbca2',road:'#617878',residential:'#57bca7',commercial:'#e1b15f',industrial:'#a18cca',power:'#70bfc6',water:'#71aace',clinic:'#f08a76',fire:'#df7664',park:'#77a969'};
const poly=(points:string,fill:string,other='')=>`<polygon points="${points}" fill="${fill}" ${other}/>`;
const box=(x:number,y:number,w:number,d:number,h:number,color:string)=>poly(`${x},${y-h} ${x+w},${y+d-h} ${x},${y+2*d-h} ${x-w},${y+d-h}`,color)+poly(`${x-w},${y+d-h} ${x},${y+2*d-h} ${x},${y+2*d} ${x-w},${y+d}`,color,'filter="url(#shade)"')+poly(`${x},${y+2*d-h} ${x+w},${y+d-h} ${x+w},${y+d} ${x},${y+2*d}`,color,'filter="url(#shade2)"');
export function building(kind:Kind,amount=0,seed=0):string {
 if(kind==='empty'||kind==='road')return '';
 if(kind==='residential'){
  if(amount===0)return poly('0,-5 17,4 0,13 -17,4','#66c5ab','opacity=".6"')+'<path d="M-8 1l16 8m-12-11l16 8" stroke="#efffe7" stroke-width="2"/>';
  const h=amount>=30?28:13;
  let s=box(0,-2,14,7,h,amount>=30?'#f0ead2':'#f2dbb8');
  s+=poly(`-17,${5-h} 0,${-10-h} 17,${5-h} 0,${14-h}`,amount>=30?'#418b83':'#c76c54');
  for(let k=0;k<(amount>=30?3:1);k++)s+=`<path d="M-10 ${9-h+k*7}v4m5-1v4M5 ${12-h+k*7}v4m5-7v4" stroke="#426a72" stroke-width="3"/>`;
  return s;
 }
 if(kind==='commercial'){if(!amount)return box(0,0,16,8,3,'#e8c874');return box(0,-2,17,8,amount>=20?22:14,'#f5e5bd')+poly('-18,4 0,13 18,4 18,8 0,17 -18,8','#dc9d4a')+'<path d="M-13 8l0 7m6-4v7M6 12v6m7-10v7" stroke="#578d94" stroke-width="4"/>'+box(0,-19,12,6,4,'#527d78');}
 if(kind==='industrial'){if(!amount)return box(0,0,17,8,3,'#b6a0d1');return box(0,-1,17,8,14,'#a393b6')+box(7,-11,4,2,22,'#626879')+poly('-17,-7 -7,-17 2,-12 9,-20 17,-15 17,-7 0,2','#79728f')+`<circle cx="8" cy="-41" r="4" fill="#d3d6d1" opacity=".6"/><circle cx="12" cy="-48" r="6" fill="#d3d6d1" opacity=".4"/>`;}
 if(kind==='power')return box(0,5,9,4,7,'#7ca6a2')+'<path d="M0 8V-36" stroke="#e4ece0" stroke-width="4"/><circle cx="0" cy="-36" r="3" fill="#315864"/><path d="M0-36l-16-9M0-36l16-9M0-36v19" stroke="#f3f2d8" stroke-width="3" stroke-linecap="round"/>';
 if(kind==='water')return box(0,0,15,7,11,'#b1d6d7')+'<ellipse cx="0" cy="-8" rx="13" ry="7" fill="#477f9c"/><path d="M-12-7v-13c0-8 24-8 24 0v13" fill="#93c5cf" stroke="#578c9b"/><ellipse cx="0" cy="-20" rx="12" ry="6" fill="#d0e5da"/><path d="M-20 4h10" stroke="#507d83" stroke-width="5"/>';
 if(kind==='clinic')return box(0,-2,17,8,20,'#f4ded0')+poly('-18,-15 0,-24 18,-15 0,-6','#d77466')+'<path d="M0-18v9m-4-7l8 4" stroke="#fff0d7" stroke-width="3"/><path d="M-11 1v6m6-3v6M7 4v7" stroke="#739999" stroke-width="4"/>';
 if(kind==='fire')return box(0,0,17,8,15,'#db856e')+box(8,-8,6,3,18,'#edc7a3')+'<path d="M-12 5v7m7-4v7M4 8v7" stroke="#506b70" stroke-width="5"/>';
 let trees='';for(const [x,y,h] of [[-8,0,15],[8,3,20],[0,10,12]])trees+=`<path d="M${x} ${y+5}v-${h}" stroke="#627b54" stroke-width="2"/>`+poly(`${x},${y-h} ${x+7},${y} ${x-7},${y}`,seed%2?'#4b8666':'#63975e');
 return poly('0,-7 19,3 0,13 -19,3','#a6c989')+trees;
}
export function icon(k:Kind):string {return `<svg viewBox="-30 -54 60 80" aria-hidden="true">${k==='road'?poly('0,-10 24,3 0,16 -24,3','#617878')+'<path d="M-13-3L13 10" stroke="#e3d7ac" stroke-dasharray="4 3"/>':building(k,k==='residential'||k==='commercial'||k==='industrial'?30:0)}</svg>`;}
export function drawMap(city:City,r:Report,overlay:Overlay,selected:number,tool:string):string {
 let out='<defs><filter id="shade"><feComponentTransfer><feFuncR type="linear" slope=".78"/><feFuncG type="linear" slope=".85"/><feFuncB type="linear" slope=".83"/></feComponentTransfer></filter><filter id="shade2"><feComponentTransfer><feFuncR type="linear" slope=".63"/><feFuncG type="linear" slope=".72"/><feFuncB type="linear" slope=".72"/></feComponentTransfer></filter></defs>';
 // Painted back to front: every neighboring footprint has a stable elevation.
 for(let sum=0;sum<=30;sum++)for(let y=0;y<SIZE;y++){const x=sum-y;if(x<0||x>=SIZE)continue;const i=id(x,y),t=city.tiles[i],sx=520+(x-y)*27,sy=87+(x+y)*13.5-(t.terrain==='rock'?10:0),d=r.districts[i];
  let fill=t.terrain==='river'?['#548b9a','#639aaa','#528697'][(x+y)%3]:t.terrain==='rock'?'#929f91':['#a7bfa0','#adc7a4','#a2bb98','#b2c8a7'][(x*3+y)%4];
  if(t.kind!=='empty')fill=COLORS[t.kind];
  let label='';
  if(overlay==='roads'&&(d||t.kind==='road')){const connected=d?d.road:r.roadNetwork[i]>=0;fill=connected?'#7fbdb7':'#e0a18a';label=d?(connected?'RD':'×'):`${r.roadNetwork[i]+1}`;}
  if((overlay==='power'||overlay==='water')&&d){const supplied=d[overlay];fill=supplied?'#79c6b2':'#df9985';label=supplied?'✓':'×';}
  if(overlay==='services'&&d){fill=d.health&&d.safety?'#88c5ba':d.health||d.safety?'#e1c877':'#dc9d91';label=`${d.health?'H':'–'}${d.safety?'F':'–'}`;}
  if(overlay==='pollution'&&t.terrain==='land'){fill=r.pollution[i]>=45?'#ce8b86':r.pollution[i]>0?'#d0bb86':'#9fc4a2';label=r.pollution[i]?String(r.pollution[i]):'';}
  const name=t.kind==='empty'?t.terrain==='land'?'Meadow':t.terrain==='river'?'River':'Rocky ridge':CATALOG[t.kind].name;
  out+=`<g class="tile${i===selected?' selected':''}" data-tile="${i}" role="button" tabindex="${i===selected?0:-1}" aria-label="Tile ${x+1},${y+1}: ${name}${t.amount?`, ${t.amount} ${t.kind==='residential'?'residents':'jobs'}`:''}" transform="translate(${sx} ${sy})"><title>Column ${x+1}, row ${y+1} · ${name}${d?' · '+d.reason:''}</title>`;
  out+=poly('-27,0 0,13.5 0,20 -27,6.5',t.terrain==='river'?'#346a7f':'#728c73')+poly('0,13.5 27,0 27,6.5 0,20',t.terrain==='river'?'#3c7589':'#82967b');
  out+=poly('0,-13.5 27,0 0,13.5 -27,0',fill,'class="tile-top" stroke="#749482" stroke-width=".6"');
  if(t.terrain==='river')out+='<path d="M-12-1l8 4m6-8l8 4" stroke="#b4d2d1" opacity=".55" stroke-width="1.3"/>';
  else if(t.terrain==='rock')out+=poly('-16,2 -7,-12 2,-4 9,-16 18,1 0,9','#aeb4a3')+poly('9,-16 18,1 0,9','#818f87');
  else if(t.kind==='road'){
   out+='<path d="M-5-3L5 3" stroke="#d3d8bc" stroke-width="1.5"/>';
   for(const n of neighbors(i))if(city.tiles[n].kind==='road'){const [nx,ny]=coords(n),dx=(nx-x)-(ny-y),dy=(nx-x)+(ny-y);out+=`<path d="M0 0L${dx*27} ${dy*13.5}" stroke="#637d7b" stroke-width="12"/><path d="M0 0L${dx*27} ${dy*13.5}" stroke="#d0d1b5" stroke-width="1" stroke-dasharray="4 5"/>`;}
  }else if(t.kind!=='empty')out+=building(t.kind,t.amount,i);
  else if((x*7+y*3)%19===0)out+='<path d="M1 2v-9" stroke="#738862" stroke-width="2"/>'+poly('1,-16 8,-4 -6,-4','#76986b');
  if(label)out+=`<g transform="translate(0 2)" pointer-events="none"><rect x="-11" y="-7" width="22" height="12" rx="4" fill="#18383c" opacity=".85"/><text text-anchor="middle" y="2" fill="#fff7df" font-size="9" font-weight="700">${label}</text></g>`;
  if(i===selected)out+=poly('0,-13.5 27,0 0,13.5 -27,0','none',`stroke="${tool==='bulldoze'?'#ffad86':'#fff7cf'}" stroke-width="2.5" pointer-events="none"`);
  out+='</g>';
 }
 for(let i=0;i<SIZE;i++){out+=`<text x="${520+i*27}" y="${65+i*13.5}" class="coordinate">${i+1}</text><text x="${500-i*27}" y="${85+i*13.5}" class="coordinate">${i+1}</text>`;}
 return out;
}
