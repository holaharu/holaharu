// 별도 여행가계부 프로젝트에서만 사용. 기존 월별가계부의 시트/프로젝트는 사용하지 않습니다.
const TRAVEL_PARTNER_EMAIL='ingansan12@gmail.com';
const TRAVEL_EXISTING_SHEET_ID='1vD4Q22W6GnJfMHol5GfB6IRlz82lqcP1sPcOovG5Qgs';
const TRAVEL_OWNER_EMAIL='momothebestdog@gmail.com';
function setupTravel(){
 const p=PropertiesService.getScriptProperties(),owner=Session.getEffectiveUser().getEmail().toLowerCase();
 if(owner!==TRAVEL_OWNER_EMAIL)throw Error('나영의 Google 계정으로 실행해주세요.');
 if(p.getProperty('TRAVEL_SHEET_ID')){if(owner!==p.getProperty('TRAVEL_OWNER'))throw Error('소유자만 설정 가능합니다.');return SpreadsheetApp.openById(p.getProperty('TRAVEL_SHEET_ID')).getUrl()}
 const ss=SpreadsheetApp.openById(TRAVEL_EXISTING_SHEET_ID);if(!ss.getSheetByName('여행저장'))throw Error('여행저장 시트를 확인해주세요.');
 // 두 계정에 이미 공유된 여행 전용 저장소를 사용합니다.
 p.setProperties({TRAVEL_SHEET_ID:ss.getId(),TRAVEL_OWNER:owner,TRAVEL_ACCOUNTS:JSON.stringify([owner,TRAVEL_PARTNER_EMAIL])});return ss.getUrl();
}
function travelUser_(){const p=PropertiesService.getScriptProperties(),email=Session.getActiveUser().getEmail().toLowerCase(),allowed=JSON.parse(p.getProperty('TRAVEL_ACCOUNTS')||'[]');if(!email||!allowed.includes(email))throw Error('등록된 두 Google 계정으로 로그인해주세요.');return email}
function travelSheet_(){let id=PropertiesService.getScriptProperties().getProperty('TRAVEL_SHEET_ID');if(!id)throw Error('여행 공동 저장 설정이 아직 완료되지 않았습니다.');return SpreadsheetApp.openById(id).getSheetByName('여행저장')}
function travelRead_(){const groups={};for(const row of travelSheet_().getDataRange().getValues().slice(1)){if(!row[0])continue;const key=row[0]+'|'+row[1];let g=groups[key]||(groups[key]={id:String(row[0]),version:Number(row[1]),count:Number(row[6]),parts:[]});g.parts[Number(row[4])]=String(row[5]).slice(1)}const latest={};for(const g of Object.values(groups)){if(!g.count||g.parts.length!==g.count||Array.from({length:g.count},(_,i)=>g.parts[i]).some(x=>typeof x!=='string'))continue;const item={trip:JSON.parse(g.parts.join('')),version:g.version};if(!latest[g.id]||latest[g.id].version<g.version)latest[g.id]=item}return Object.values(latest)}
function loadTravel(){const email=travelUser_(),lock=LockService.getScriptLock();lock.waitLock(30000);try{return {email,items:travelRead_()}}finally{lock.releaseLock()}}
function validateTravel_(trip){
 if(!trip||typeof trip.id!=='string'||!/^[-a-zA-Z0-9_]{1,200}$/.test(trip.id)||!Array.isArray(trip.entries)||trip.entries.length>10000)throw Error('여행 데이터 형식 오류');
 if(typeof trip.destination!=='string'||typeof trip.start!=='string'||typeof trip.end!=='string')throw Error('여행 정보 형식 오류');
 const units=['KRW','JPY','CNY','USD','EUR','TWD','THB','VND'];if(!units.includes(trip.currency)||!(trip.rate===null||typeof trip.rate==='number'&&isFinite(trip.rate)&&trip.rate>0))throw Error('환율 형식 오류');
 const ids=new Set();function check(e){if(!e||typeof e.id!=='string'||!e.id||ids.has(e.id)||!units.includes(e.currency)||typeof e.amount!=='number'||!isFinite(e.amount)||e.amount<0)throw Error('상품/금액 형식 오류');ids.add(e.id);if(e.sale!=null&&(typeof e.sale!=='number'||!isFinite(e.sale)||e.sale<0))throw Error('판매금액 형식 오류');if(e.krw!=null&&(typeof e.krw!=='number'||!isFinite(e.krw)||e.krw<0))throw Error('원화 금액 형식 오류');if(e.items){if(!Array.isArray(e.items)||e.items.length>1000)throw Error('상품 형식 오류');e.items.forEach(check)}}trip.entries.forEach(check);
 const json=JSON.stringify(trip);if(json.length>2000000)throw Error('한 여행의 저장 용량을 초과했습니다.');return json;
}
function saveTravel(trip,expectedVersion){const email=travelUser_(),json=validateTravel_(trip),lock=LockService.getScriptLock();lock.waitLock(30000);try{
 const sheet=travelSheet_(),old=travelRead_().find(x=>x.trip.id===trip.id),version=old?old.version:0;
 if(Number(expectedVersion)!==version)throw Error('SAVE_CONFLICT: 다른 사람이 이 여행을 먼저 수정했습니다. 내 변경은 브라우저에 보관됩니다. Google에서 새로고침 후 다시 수정해주세요.');
 
 const parts=[];for(let i=0;i<json.length;i+=25000)parts.push([trip.id,version+1,email,new Date().toISOString(),parts.length,'~'+json.slice(i,i+25000)]);
 if(sheet.getMaxRows()<sheet.getLastRow()+parts.length)sheet.insertRowsAfter(sheet.getMaxRows(),sheet.getLastRow()+parts.length-sheet.getMaxRows());
 parts.forEach(row=>row.push(parts.length));const range=sheet.getRange(sheet.getLastRow()+1,1,parts.length,7);range.setNumberFormat('@');range.setValues(parts);SpreadsheetApp.flush();const data=sheet.getDataRange().getValues();for(let i=data.length-1;i>=1;i--)if(String(data[i][0])===trip.id&&Number(data[i][1])<=version)sheet.deleteRow(i+1);return {id:trip.id,version:version+1};
 }finally{lock.releaseLock()}}
function doGet(){travelUser_();return HtmlService.createHtmlOutputFromFile('Index').setTitle('우리의 여행 가계부 · 공동 저장').addMetaTag('viewport','width=device-width, initial-scale=1')}
