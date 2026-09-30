'use strict';
// Samsung Notes typed-text blocks observed in .sdocx: uint32 UTF-16 length followed by UTF-16LE text.
async function readSamsungNote(buffer){
 const zip=await JSZip.loadAsync(buffer);const file=zip.file('note.note');
 if(!file)throw Error('삼성노트 본문을 찾지 못했습니다.');
 const bytes=await file.async('uint8array');const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength);const decoder=new TextDecoder('utf-16le');let blocks=[];
 for(let offset=0;offset+8<bytes.length;offset++){
  const n=view.getUint32(offset,true);if(n<16||n>1000000||offset+4+n*2>bytes.length)continue;
  const text=decoder.decode(bytes.subarray(offset+4,offset+4+n*2));
  if(!/[\n\r]/.test(text)||!/[0-9]+\s*(원|엔|위안|JPY|KRW)/.test(text))continue;
  const printable=[...text].filter(c=>/[\p{L}\p{N}\p{P}\p{S}\p{Z}\n\r\t]/u.test(c)).length;
  if(printable/text.length<.98||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffd]/.test(text))continue;
  blocks.push(text);offset+=3+n*2;
 }
 if(!blocks.length)throw Error('이 삼성노트에서 입력된 텍스트를 찾지 못했습니다.');return blocks.join('\n');
}
function readRate(text){
 let m=text.match(/1\s*(엔|円|위안|元|달러|JPY|CNY|USD)\s*=\s*([\d,.]+)\s*원/i);
 if(m)return {currency:currency(m[1],'JPY'),rate:num(m[2])};
 m=text.match(/(\d+)\s*(엔|円|위안|元|달러|JPY|CNY|USD)\s*당\s*([\d,.]+)\s*원/i);
 return m?{currency:currency(m[2],'JPY'),rate:num(m[3])/num(m[1])}:null;
}
function infer(t,text){
 const place=(text.match(/(?:일본|중국|대만|미국|태국|베트남|제주|오사카|도쿄|대련|부산|발리|영국)/)||[])[0];t.destination=place||t.destination||'';
 const rate=readRate(text);if(rate){t.currency=rate.currency;t.rate=rate.rate}
 else t.currency=/중국|대련|위안|CNY/.test(text)?'CNY':/일본|오사카|도쿄|엔|JPY/.test(text)?'JPY':/달러|USD/.test(text)?'USD':'KRW';
 const dates=[...text.matchAll(/20\d{2}[.\-/년\s]+\d{1,2}[.\-/월\s]+\d{1,2}일?/g)].map(m=>date(m[0])).filter(Boolean);
 const days=(dates.length?dates:t.entries.map(e=>e.date).filter(Boolean)).sort();t.start=days[0]||t.start||'';t.end=days.at(-1)||t.end||'';if(t.currency==='KRW')t.rate=1;
}
function isSummaryLine(line){return /소계|총액|총합산|최종.*(?:합계|결제액)|지출\s*합계|환산액|환산\s*합계|적용\s*환율|환율\s*[:：]|세금\s*합계|쿠폰.*할인.*적용|^\(?세금\s*합계/.test(line)||/^(?:\d+일차\s*)?(?:원화|엔화|현지통화)?\s*(?:총액|소계|합계)/.test(line)}
function productRows(e){return e.items?.length?e.items:[e]}
function fromText(text,t){
 const year=+(text.match(/20\d{2}/)||[new Date().getFullYear()])[0];let day='',parent=null;infer(t,text);
 for(let raw of text.replace(/\u200b/g,'').split(/\r?\n/)){
  let line=raw.trim().replace(/^[•◦▪●*]\s*/, '');if(!line)continue;
  const dated=/(?:20\d{2}[.\-/]\d{1,2}[.\-/]\d{1,2}|^\d{1,2}[./]\d{1,2}(?:\s|$))/.test(line)?date(line,year):'';
  if(dated){day=dated;parent=null}
  if(/^\[|^[─━]{2,}/.test(line)){parent=null;continue}
  if(isSummaryLine(line))continue;
  let amounts=[...line.matchAll(/([\d,]+(?:\.\d+)?)\s*(원|엔|円|위안|元|KRW|JPY|CNY|USD|달러|유로|EUR)(?![가-힣])/gi)];if(!amounts.length)continue;
  // Item lines following a receipt are details; their values never add to that receipt total.
  const main=/[—–]\s*[\d,]/.test(line);let first=amounts[0];
  let label=line.slice(0,first.index).replace(/(?:20\d{2}[.\-/년\s]+)?\d{1,2}[.\-/월\s]+\d{1,2}일?/, '').replace(/[\s:：·=—–-]+$/g,'').trim();
  if(!label||/^\(|^\d+일차|^일본\s*여행/.test(label))continue;
  const cur=currency(first[2],t.currency),amount=num(first[1]);
  if(parent&&!main&&!dated&&parent.explicitQuantity&&/개당|×/.test(line))continue;
  if(parent&&!main&&!dated&&(line.includes(':')||line.includes('：')||raw.trim().startsWith('◦'))){
   parent.details??=[];parent.details.push({name:label,amount,currency:cur});
   if(parent.category==='쇼핑'&&!parent.items?.length){parent.items=[]}
   if(parent.category==='쇼핑'&&!parent.explicitQuantity){
    let q=+(label.match(/\((\d+)\s*(?:개|켤레|병|장|매|벌)\)/)||[])[1]||1;
    for(let i=0;i<q;i++)parent.items.push({id:uid(),date:day,store:parent.store,name:label+(q>1?'  '+(i+1)+'/'+q:''),category:'쇼핑',currency:cur,amount:amount/q,sold:false,sale:0});
   }continue;
  }
  const foreign=amounts.find(m=>currency(m[2])!=='KRW');const won=amounts.find(m=>currency(m[2])==='KRW');
  // A parenthesized quantity/unit price is not a second transaction or a conversion.
  const primary=foreign&&won?foreign:first;let c=category(label);if(/돈키호테|드럭스토어|스케쳐스|뉴발란스|운동화|유니클로/.test(label))c='쇼핑';if(/편의점|세븐|패밀리마트|로손|라이프\s*마트/.test(label))c='간식 · 편의점';if(/카레|라멘|텐푸라/.test(label))c='식사';if(/항공권/.test(label))c='항공권';
  let split=label.indexOf(':');if(split<0)split=label.indexOf('：');let store=split>=0?label.slice(0,split).trim():label,name=split>=0?label.slice(split+1).trim():label;
  let e={id:uid(),date:day,store,name:store===name?'':name,category:c,currency:currency(primary[2],t.currency),amount:num(primary[1]),sold:false,sale:0,raw:line};
  if(foreign&&won)e.krw=num(won[1]);
  const q=+(label.match(/(?:시계\s*|운동화\s*|신발\s*|\()(\d+)\s*(?:개|켤레|벌)/)||[])[1]||1;
  if(c==='쇼핑'&&q>1){e.explicitQuantity=true;e.items=Array.from({length:Math.min(q,100)},(_,i)=>({id:uid(),date:day,store,name:(name||label)+' '+(i+1)+'/'+q,category:c,currency:e.currency,amount:e.amount/q,...(Number.isFinite(e.krw)?{krw:e.krw/q}:{}),sold:false,sale:0}))}
  t.entries.push(e);parent=e;
 }
 infer(t,text);
}
