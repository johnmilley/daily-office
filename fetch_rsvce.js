#!/usr/bin/env node
// Fetch RSVCE passages from Bible Gateway and parse to clean office-reading HTML.
// Resumable: progress stored in scratch_lessonText.json. Emits site/jsdata/lessonText.js at end.
const fs = require("fs");
const https = require("https");

const REFS = JSON.parse(fs.readFileSync("scratch_refs.json", "utf8")).bg;
const OUT_PARTIAL = "scratch_lessonText.json";
const OUT_JS = "site/jsdata/lessonText.js";
const UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

// marker characters (unlikely in scripture text)
const V0="", V1="";   // verse-number wrapper
const C0="", C1="";   // chapter-number wrapper
const S0="", S1="";   // small-caps wrapper
const PB="";                 // paragraph break
const LB="";                 // line break

let store = {};
if (fs.existsSync(OUT_PARTIAL)) { try { store = JSON.parse(fs.readFileSync(OUT_PARTIAL, "utf8")); } catch(e){} }

const sleep = ms => new Promise(r=>setTimeout(r,ms));

function get(url){
  return new Promise((resolve,reject)=>{
    const req=https.get(url,{headers:{"User-Agent":UA,"Accept":"text/html","Accept-Language":"en-GB,en;q=0.9"}},res=>{
      if(res.statusCode>=300&&res.statusCode<400&&res.headers.location){ res.resume(); return get(res.headers.location).then(resolve,reject); }
      if(res.statusCode!==200){ res.resume(); return reject(new Error("HTTP "+res.statusCode)); }
      let d=""; res.setEncoding("utf8"); res.on("data",c=>d+=c); res.on("end",()=>resolve(d));
    });
    req.on("error",reject); req.setTimeout(30000,()=>{req.destroy(new Error("timeout"));});
  });
}

function decodeEntities(s){
  return s.replace(/&nbsp;/g," ").replace(/&amp;/g,"&").replace(/&lt;/g,"<").replace(/&gt;/g,">")
          .replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/&rsquo;/g,"’").replace(/&lsquo;/g,"‘")
          .replace(/&ldquo;/g,"“").replace(/&rdquo;/g,"”").replace(/&mdash;/g,"—")
          .replace(/&#(\d+);/g,(m,n)=>String.fromCharCode(+n));
}

function parsePassage(html){
  let s = html.indexOf('<div class="passage-text"');
  if(s<0) return null;
  let region = html.slice(s);
  // Cut only at the trailing footnotes/crossrefs/publisher block (which follows ALL passage-content
  // blocks). Do NOT cut at passage-scroller: for compound refs (e.g. "Job 4:1; 5:6-100") a scroller
  // sits BETWEEN the two passage-content blocks, so cutting there would drop the second range.
  for(const marker of ['<div class="footnotes"','<div class="crossrefs"','<div class="publisher-info','<!--END']){
    let i=region.indexOf(marker); if(i>0) region=region.slice(0,i);
  }
  region = region.replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/g,"");                                   // drop editorial headings
  region = region.replace(/<span[^>]*small-caps[^>]*>([\s\S]*?)<\/span>/g,(m,x)=>S0+x+S1);           // small-caps LORD
  region = region.replace(/<sup[^>]*class="[^"]*versenum[^"]*"[^>]*>\s*([0-9A-Za-z\-–,\s]*?)\s*<\/sup>/g,(m,n)=>V0+n.trim()+V1); // verse # (before removing other sups)
  region = region.replace(/<sup\b[^>]*>[\s\S]*?<\/sup>/g,"");                                        // drop ALL remaining sups (footnotes/xrefs, single- or double-quoted)
  region = region.replace(/<a\b[^>]*>/g,"").replace(/<\/a>/g,"");                                    // unwrap any leftover inline links
  region = region.replace(/<span[^>]*class="[^"]*chapternum[^"]*"[^>]*>\s*(\d+)\s*<\/span>/g,(m,n)=>C0+n+C1); // chapter #
  region = region.replace(/<\/p>/g,PB).replace(/<br\s*\/?>/g,LB);                                    // structure
  region = region.replace(/<[^>]+>/g,"");                                                            // strip remaining tags
  region = decodeEntities(region);

  const CRUFT=/^(Read full chapter|Footnotes|Cross references|In Context|Full Chapter)$/i;
  const CRUFT2=/Read full chapter|in all English translations/i;   // BG inter-block scroller boilerplate
  const paras = region.split(new RegExp(PB+"+"))
    .map(p=>p.split(LB).map(l=>l.replace(/[ \t]+/g," ").trim()).filter(l=>l!==""&&!CRUFT.test(l)&&!CRUFT2.test(l)))
    .filter(p=>p.length);
  if(!paras.length) return null;

  const esc=t=>t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  const render=t=> esc(t)
    .replace(new RegExp(V0+"([\\s\\S]*?)"+V1,"g"),(m,n)=>'<sup class="vn">'+n+'</sup>')
    .replace(new RegExp(C0+"([\\s\\S]*?)"+C1,"g"),(m,n)=>'<span class="cn">'+n+'</span>')
    .replace(new RegExp(S0+"([\\s\\S]*?)"+S1,"g"),(m,x)=>'<span class="sc">'+x+'</span>');

  let out="";
  for(const p of paras){
    if(p.length>1) out+='<p class="reading poetry">'+p.map(render).join("<br>")+"</p>";
    else out+='<p class="reading">'+render(p[0])+"</p>";
  }
  return out;
}

module.exports = { parsePassage, get };

if(process.argv[2]==="--test"){
  const h=fs.readFileSync(process.argv[3]||"bg_test.html","utf8");
  console.log(parsePassage(h));
  process.exit(0);
}

if(require.main === module) (async()=>{
  const todo = REFS.filter(r=>!(r in store) || store[r]==="__FAIL__");
  console.log(`Total refs: ${REFS.length}, already done: ${REFS.length-todo.length}, to fetch: ${todo.length}`);
  let done=0, fail=0;
  for(const ref of todo){
    const url = `https://www.biblegateway.com/passage/?search=${encodeURIComponent(ref)}&version=RSVCE`;
    let ok=false;
    for(let attempt=0; attempt<3 && !ok; attempt++){
      try{
        const parsed = parsePassage(await get(url));
        if(parsed){ store[ref]=parsed; ok=true; } else throw new Error("no passage parsed");
      }catch(e){
        if(attempt===2){ store[ref]="__FAIL__"; fail++; console.error("FAIL:",ref,"-",e.message); }
        else await sleep(2500+attempt*2500);
      }
    }
    done++;
    if(done%25===0){ fs.writeFileSync(OUT_PARTIAL, JSON.stringify(store)); console.log(`  progress ${done}/${todo.length} (fails: ${fail})`); }
    await sleep(1100 + Math.random()*700);
  }
  fs.writeFileSync(OUT_PARTIAL, JSON.stringify(store));
  const good=Object.keys(store).filter(k=>store[k]!=="__FAIL__");
  const bad=Object.keys(store).filter(k=>store[k]==="__FAIL__");
  console.log(`DONE. good=${good.length} fail=${bad.length}`);
  if(bad.length) console.log("Failed refs:", bad.join(" | "));
  const obj={}; for(const k of good) obj[k]=store[k];
  fs.writeFileSync(OUT_JS, "lessonText="+JSON.stringify(obj)+";\n");
  console.log("Wrote", OUT_JS);
})();
