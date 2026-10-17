let questions=[],seen={},ready=false,trash=[],editId=null;const openKeys=new Set();let typedLines=0,typedQ=null,typingNow=false,typingTimer=null;let tab='revise',grade='सभी कक्षाएँ',book='सभी पुस्तकें',subject='सभी विषय',chapter='सभी टॉपिक',subtopic='सभी सबटॉपिक',index=0,revealed=0,autoPaused=false;let shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};
const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const save=()=>{try{localStorage.setItem('shadabRevisionQuestions',JSON.stringify(questions))}catch(e){}queueSync()};const gradeOf=q=>q.grade||'बिना कक्षा',subjectOf=q=>q.subject||'सामान्य';const bookOf=q=>q.book||`${q.subject||'सामान्य'} — सामान्य पुस्तक`;const chapterOf=q=>q.chapter||'बिना अध्याय';const topicOf=q=>q.topic||'सामान्य प्रश्न';const subtopicOf=q=>q.subtopic||'बिना सबटॉपिक';const filtered=()=>questions.filter(q=>gradeOf(q)===shelf.grade&&subjectOf(q)===shelf.subject&&bookOf(q)===shelf.book&&chapterOf(q)===shelf.chapter&&topicOf(q)===shelf.topic&&subtopicOf(q)===shelf.subtopic);
function options(values,current){return values.map(v=>`<option ${v===current?'selected':''} value="${esc(v)}">${esc(v)}</option>`).join('')}
function render(){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));if(tab==='revise')renderRevise();if(tab==='manage')renderManage();if(tab==='report')renderReport()}
function renderRevise(autoScroll=false){
clearTimeout(typingTimer);typingNow=false;
const allGrades=[...new Set(questions.map(gradeOf))].sort((a,b)=>a.localeCompare(b,'hi'));
const allBooks=questions.filter(q=>gradeOf(q)===shelf.grade).reduce((acc,q)=>{const key=[subjectOf(q),bookOf(q)].join('|||');if(!acc.some(x=>x.key===key))acc.push({key,subject:subjectOf(q),book:bookOf(q)});return acc},[]);
const inBook=questions.filter(q=>gradeOf(q)===shelf.grade&&subjectOf(q)===shelf.subject&&bookOf(q)===shelf.book);
const chapters=[...new Set(inBook.map(chapterOf))];
const inChapter=inBook.filter(q=>chapterOf(q)===shelf.chapter);
const topics=[...new Set(inChapter.map(topicOf))];
const inTopic=inChapter.filter(q=>topicOf(q)===shelf.topic);
const subtopics=[...new Set(inTopic.map(subtopicOf))];
const list=filtered();if(index>=list.length)index=Math.max(0,list.length-1);const q=shelf.level==='study'?list[index]:null;
if(revealed===0)typedLines=0;if(q&&typedQ!==q.id){typedQ=q.id;typedLines=0}
const animIdx=(q&&revealed>0&&revealed-1>=typedLines)?revealed-1:-1;
const countGrade=g=>questions.filter(q=>gradeOf(q)===g&&!q.ph).length;
const countBook=(su,bk)=>questions.filter(q=>gradeOf(q)===shelf.grade&&subjectOf(q)===su&&bookOf(q)===bk&&!q.ph).length;
const countChapter=c=>inBook.filter(q=>chapterOf(q)===c&&!q.ph).length;
const countTopic=t=>inChapter.filter(q=>topicOf(q)===t&&!q.ph).length;
const countSub=sub=>inTopic.filter(q=>subtopicOf(q)===sub&&!q.ph).length;
const hue=t=>[...String(t)].reduce((a,c)=>a+c.charCodeAt(0),0)%6;const card=(name,count,icon,action,cls='')=>`<button class="shelf-card c${hue(name)}" data-shelf-action="${esc(action)}"><span class="shelf-name">${esc(name)}</span><span class="shelf-count">${count} प्रश्न</span></button>`;
let crumbs=`<div class="crumbs"><button class="crumb ${shelf.level==='grade'?'current':''}" data-level="grade">सभी कक्षाएँ</button>${shelf.grade?`<button class="crumb ${shelf.level==='book'?'current':''}" data-level="book">${esc(shelf.grade)}</button>`:''}${shelf.book?`<button class="crumb ${shelf.level==='chapter'?'current':''}" data-level="chapter">${esc(shelf.book)}</button>`:''}${shelf.chapter?`<button class="crumb ${shelf.level==='topic'?'current':''}" data-level="topic">${esc(shelf.chapter)}</button>`:''}${shelf.topic?`<button class="crumb ${shelf.level==='subtopic'?'current':''}" data-level="subtopic">${esc(shelf.topic)}</button>`:''}${shelf.level==='study'?`<span class="crumb current">पढ़ाई</span>`:''}</div>`;
let body='';
if(shelf.level==='grade'){
 body=`<div class="shelf-intro"><h2>अपनी कक्षा चुनें</h2><span class="hint">फ़ोल्डर खोलते जाइए: किताब → अध्याय → टॉपिक</span></div><div class="shelf-section"><p class="shelf-label">कक्षा / अध्ययन स्तर</p><div class="shelf-grid">${allGrades.map(g=>card(g,countGrade(g),'📁',`grade|${g}`)).join('')}</div></div>`;
}else if(shelf.level==='book'){
 body=`<div class="shelf-intro"><h2>${esc(shelf.grade)} की किताबें</h2><span class="hint">अपनी किताब का फ़ोल्डर खोलें</span></div><div class="shelf-section"><p class="shelf-label">किताबें</p><div class="shelf-row">${allBooks.map(b=>card(b.book,countBook(b.subject,b.book),'📕',`book|${b.subject}|${b.book}`,'book-card')).join('')}</div></div>`;
}else if(shelf.level==='chapter'){
 body=`<div class="shelf-intro"><h2>${esc(shelf.book)}</h2><span class="hint">विषय: ${esc(shelf.subject)}</span></div><div class="shelf-section"><p class="shelf-label">अध्याय चुनें</p><div class="shelf-grid">${chapters.map(c=>card(c,countChapter(c),'📂',`chapter|${c}`)).join('')}</div></div>`;
}else if(shelf.level==='topic'){
 body=`<div class="shelf-intro"><h2>${esc(shelf.chapter)}</h2><span class="hint">अब अध्याय के अंदर टॉपिक चुनें</span></div><div class="shelf-section"><p class="shelf-label">टॉपिक</p><div class="shelf-grid">${topics.map(t=>card(t,countTopic(t),'🗂️',`topic|${t}`)).join('')}</div></div>`;
}else if(shelf.level==='subtopic'){
 body=`<div class="shelf-intro"><h2>${esc(shelf.topic)}</h2><span class="hint">सबटॉपिक हो तो चुनें, वरना सीधे पढ़ाई शुरू करें</span></div><div class="shelf-section"><p class="shelf-label">सबटॉपिक / छोटे भाग</p><div class="shelf-grid">${subtopics.map(st=>card(st==='बिना सबटॉपिक'?'सीधे प्रश्न शुरू करें':st,countSub(st),st==='बिना सबटॉपिक'?'📖':'📄',`subtopic|${st}`)).join('')}</div></div>`;
}else if(shelf.level==='study'){
 body=`<button class="secondary study-back" id="backToShelf">← वापस</button>${q?`<div class="panel study-card"><div class="meta"><span>${esc(gradeOf(q))} · ${esc(subjectOf(q))} · ${esc(bookOf(q))}</span><span>प्रश्न ${index+1}/${list.length}</span></div><div class="book-spine">अध्याय: ${esc(chapterOf(q))}</div><div class="book-spine">टॉपिक: ${esc(topicOf(q))}</div>${q.subtopic?`<div class="book-spine">सबटॉपिक: ${esc(q.subtopic)}</div>`:''}<div class="progress"><span style="width:${list.length?(index+1)/list.length*100:0}%"></span></div><div class="notebook"><div class="nb-q">प्रश्न ${index+1}. ${esc(q.q)}</div>${revealed>0?'<div class="nb-ans-head">उत्तर:</div>':''}<div class="nb-lines">${q.a.slice(0,revealed).map((line,i)=>`<div class="nb-line"><span class="nb-dash">–</span><span class="nb-text"${i===animIdx?` data-type="${i}"`:''}>${i===animIdx?'':esc(line)}</span></div>`).join('')}</div>${revealed===q.a.length?`<p class="nb-done" id="doneMsg"${animIdx===revealed-1&&animIdx!==-1?' style="display:none"':''}>✓ उत्तर पूरा हो गया!</p>`:''}</div><div class="actions">${revealed<q.a.length?`<button class="primary" id="reveal">${revealed===0?'पहली पंक्ति दिखाएँ':'अगली पंक्ति दिखाएँ'} →</button>`:`<button class="primary" id="next">अगला प्रश्न →</button>`}<button class="secondary" id="autoToggle">${autoPaused?'▶ ऑटो रिवील चालू करें':'⏸ ऑटो रिवील रोकें'}</button><button class="secondary" id="remember">✓ याद हो गया</button><button class="outline" id="again">↻ फिर से देखें</button><button class="outline" id="editQ">संपादित करें</button></div></div>`:`<div class="panel shelf-empty">इस सबटॉपिक में प्रश्न नहीं मिले।</div>`}`;
}
$('#content').innerHTML=`<div class="panel bookshelf-panel">${crumbs}${body}</div>`;
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{const level=b.dataset.level;shelf.level=level;if(level==='grade'){shelf.grade=shelf.subject=shelf.book=shelf.chapter=shelf.topic=shelf.subtopic=''}if(level==='book'){shelf.subject=shelf.book=shelf.chapter=shelf.topic=shelf.subtopic=''}if(level==='chapter'){shelf.chapter=shelf.topic=shelf.subtopic=''}if(level==='topic'){shelf.topic=shelf.subtopic=''}index=0;revealed=0;renderRevise()});
document.querySelectorAll('[data-shelf-action]').forEach(b=>b.onclick=()=>{const parts=b.dataset.shelfAction.split('|'),act=parts[0];if(act==='grade'){shelf.grade=parts[1];shelf.level='book';shelf.subject=shelf.book=shelf.chapter=shelf.topic=shelf.subtopic=''}if(act==='book'){shelf.subject=parts[1];shelf.book=parts[2];shelf.level='chapter';shelf.chapter=shelf.topic=shelf.subtopic=''}if(act==='chapter'){shelf.chapter=parts[1];shelf.level='topic';shelf.topic=shelf.subtopic=''}if(act==='topic'){shelf.topic=parts[1];shelf.level='subtopic';shelf.subtopic=''}if(act==='subtopic'){shelf.subtopic=parts[1];shelf.level='study';index=0;revealed=0}renderRevise()});
if(shelf.level!=='study'||!q)return;
$('#backToShelf')?.addEventListener('click',()=>{shelf.level='subtopic';index=0;revealed=0;renderRevise()});
$('#reveal')?.addEventListener('click',()=>{revealed=Math.min(q.a.length,revealed+1);renderRevise()});
$('#autoToggle')?.addEventListener('click',e=>{autoPaused=!autoPaused;e.currentTarget.textContent=autoPaused?'▶ ऑटो रिवील चालू करें':'⏸ ऑटो रिवील रोकें'});
$('#next')?.addEventListener('click',()=>{index=(index+1)%list.length;revealed=0;renderRevise()});
$('#remember')?.addEventListener('click',()=>{seen[q.id]='याद';saveSeen();if(index<list.length-1){index++;revealed=0}renderRevise()});
$('#again')?.addEventListener('click',()=>{revealed=0;renderRevise()});
$('#editQ')?.addEventListener('click',()=>startEdit(q.id));
{const tEl=document.querySelector('[data-type]');if(tEl){const i=Number(tEl.dataset.type);typedLines=revealed;typeInto(tEl,q.a[i],()=>{const dm=document.getElementById('doneMsg');if(dm)dm.style.display=''})}}
if(autoScroll && revealed>0){requestAnimationFrame(()=>{const actions=document.querySelector('.actions');if(actions)actions.scrollIntoView({behavior:'smooth',block:'end'});});}
}
function parseTxtQuestions(text){
  const rows=String(text||'').replace(/\r/g,'').replace(/[,，।]\s*/g,'\n').split('\n');
  const parsed=[];let current=null;let mode='';
  const flush=()=>{if(current){current.q=current.q.trim();current.a=current.a.map(x=>x.trim()).filter(Boolean);if(current.q&&current.a.length)parsed.push(current);current=null;mode='';}};
  for(const raw of rows){
    const line=raw.trim();
    const qm=line.match(/^(?:प्रश्न|प्रश्न\s*\d+|Q(?:uestion)?\s*\d*)\s*[:：.)-]\s*(.*)$/i);
    const am=line.match(/^(?:उत्तर|Answer|Ans)\s*[:：]\s*(.*)$/i);
    if(qm){flush();current={q:qm[1].trim(),a:[]};mode='q';continue;}
    if(am){if(!current)current={q:'',a:[]};mode='a';if(am[1].trim())current.a.push(am[1].trim());continue;}
    if(!line){continue;}
    if(!current)continue;
    if(mode==='q'){current.q+=(current.q?'\n':'')+line;}
    else if(mode==='a'){current.a.push(line);}
  }
  flush();
  return parsed;
}
function renderManage(){
const grouped={};
questions.forEach(q=>{const g=q.grade||'बिना कक्षा',b=bookOf(q),c=chapterOf(q),t=topicOf(q);grouped[g]??={};grouped[g][b]??={};grouped[g][b][c]??={};grouped[g][b][c][t]??=[];grouped[g][b][c][t].push(q)});
const delBtn=(level,values,count,label)=>`<button type="button" class="danger" data-delete-level="${esc(JSON.stringify({level,...values}))}" style="padding:6px 9px;font-size:12px;white-space:nowrap">🗑️ ${label} (${count})</button>`;
const groupBy=(arr,keyFn)=>{const out={};arr.forEach(item=>{const k=keyFn(item);(out[k]??=[]).push(item)});return out};
const ok=(...p)=>{const k=p.join('␟');return `data-k="${esc(k)}"${openKeys.has(k)?' open':''}`};
const folderHtml=Object.entries(groupBy(questions,q=>q.grade||'बिना कक्षा')).sort((a,b)=>a[0].localeCompare(b[0])).map(([g,gqs])=>{
 const books=groupBy(gqs,q=>bookOf(q));
 return `<details class="panel" open><summary style="cursor:pointer;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📁 ${esc(g)} (${gqs.length} प्रश्न)</span>${delBtn('grade',{g},gqs.length,'कक्षा हटाएँ')}</summary>${Object.entries(books).map(([b,bqs])=>{
  const chapters=groupBy(bqs,q=>chapterOf(q));
  return `<details ${ok(g,b)} style="margin:12px 0 0 12px;border-left:4px solid var(--wood);padding:10px 0 0 12px"><summary style="cursor:pointer;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📚 ${esc(b)} (${bqs.length} प्रश्न)</span>${delBtn('book',{g,b},bqs.length,'किताब हटाएँ')}</summary>${Object.entries(chapters).map(([c,cqs])=>{
   const topics=groupBy(cqs,q=>topicOf(q));
   return `<details ${ok(g,b,c)} style="margin:10px 0 0 12px;border-left:3px solid var(--blue);padding:8px 0 0 12px"><summary style="cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📂 ${esc(c)} (${cqs.length} प्रश्न)</span>${delBtn('chapter',{g,b,c},cqs.length,'अध्याय हटाएँ')}</summary>${Object.entries(topics).map(([t,tqs])=>{
    const subs=groupBy(tqs,q=>subtopicOf(q));
    return `<details ${ok(g,b,c,t)} style="margin:8px 0 0 12px"><summary style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>🗂️ ${esc(t)} (${tqs.length} प्रश्न)</span>${delBtn('topic',{g,b,c,t},tqs.length,'टॉपिक हटाएँ')}</summary><div class="question-list" style="margin-top:8px">${Object.entries(subs).map(([sub,sqs])=>`<details ${ok(g,b,c,t,sub)} style="margin:8px 0 0 10px"><summary style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📄 ${esc(sub)} (${sqs.length} प्रश्न)</span>${delBtn('subtopic',{g,b,c,t,sub},sqs.length,'सबटॉपिक हटाएँ')}</summary>${sqs.map((q,i)=>`<div class="qrow"><div><b>${q.ph?'':(i+1)+'. '}${esc(q.q)}</b><p>${esc(gradeOf(q))} · ${esc(subjectOf(q))} · ${esc(bookOf(q))}</p></div><div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">${q.ph?'':moveCtl(q,i,sqs.length)}<button class="secondary" data-edit="${q.id}">संपादित करें</button><button class="danger" data-delete="${q.id}">हटाएँ</button></div></div>`).join('')}</details>`).join('')}</div></details>`;
   }).join('')}</details>`;
  }).join('')}</details>`;
 }).join('')}</details>`;
}).join('');
const bookOptions=[...new Set(questions.map(bookOf))];let editQ=editId?questions.find(x=>x.id===editId):null;if(!editQ)editId=null;
$('#content').innerHTML=`
<div class="panel"><h2>कहाँ जोड़ना है?</h2><p class="hint">पहले यहाँ जगह चुनें, फिर नीचे प्रश्न लिखकर सेव करें। पुराने फ़ोल्डर लिस्ट से चुनें, नया बनाना हो तो “➕ नया लिखें” चुनें। चुनी हुई जगह बनी रहेगी, इसलिए अगला import भी वहीं होगा।</p><div id="picker"></div></div>
<div class="panel"><h2>Bulk Import (पेस्ट करके कई प्रश्न)</h2>
<p class="hint">ऊपर “कहाँ जोड़ना है?” में जगह चुनें, फिर प्रश्न नीचे पेस्ट करें। नए प्रश्न उस सबटॉपिक/टॉपिक के <b>अंत में</b> जुड़ेंगे। बाद में नीचे की सूची में ▲ ▼ या स्थान संख्या से ऊपर-नीचे कर सकते हैं।</p>
<div class="field"><label>प्रश्न यहाँ पेस्ट करें</label><textarea id="bulkText" rows="9" placeholder="प्रश्न: प्रकाश संश्लेषण क्या है?&#10;उत्तर:&#10;हरे पौधे अपना भोजन बनाते हैं।&#10;यह प्रक्रिया सूर्य के प्रकाश की सहायता से होती है।&#10;&#10;प्रश्न: कोशिका क्या है?&#10;उत्तर:&#10;कोशिका जीवों की संरचनात्मक और क्रियात्मक इकाई है।"></textarea></div>
<div class="actions"><button class="secondary" id="checkBulk">प्रश्नों की जाँच करें</button><button class="primary" id="importBulk">चुनी जगह में Bulk Import करें</button></div>
<div id="bulkStatus" class="notice">पहले जगह चुनें, फिर प्रश्न पेस्ट करके “जाँच करें” दबाएँ।</div>
<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">पेस्ट करने का नमूना देखें</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:var(--soft);padding:12px;border-radius:10px">प्रश्न: प्रकाश संश्लेषण क्या है?
उत्तर:
हरे पौधे अपना भोजन बनाते हैं।
यह प्रक्रिया सूर्य के प्रकाश की सहायता से होती है।

प्रश्न: कोशिका क्या है?
उत्तर:
कोशिका जीवों की संरचनात्मक और क्रियात्मक इकाई है।</pre></details>
</div>
<div class="panel"><h2>${editQ?'प्रश्न संपादित करें':'प्रश्न जोड़ें'}</h2><form id="addForm" class="formgrid">
<div class="field wide"><label>प्रश्न</label><textarea name="q" required rows="2" placeholder="लघु प्रश्न लिखें">${editQ?esc(editQ.q):''}</textarea></div>
<div class="field wide"><label>उत्तर — हर पंक्ति अलग लाइन में लिखें</label><textarea name="a" required rows="6" placeholder="पहली पंक्ति&#10;दूसरी पंक्ति&#10;तीसरी पंक्ति">${editQ?esc(editQ.a.join('\n')):''}</textarea><span class="hint">Revision में एक क्लिक पर एक नई पंक्ति खुलेगी।</span></div>
<div class="wide"><button class="primary" type="submit">${editQ?'बदलाव सेव करें':'＋ प्रश्न सेव करें'}</button>${editQ?' <button type="button" class="outline" id="cancelEdit">रद्द करें</button>':''}</div><div class="wide success" id="addStatus"></div></form><div class="notice">कक्षा, विषय, पुस्तक, अध्याय, टॉपिक और सबटॉपिक अपनी जरूरत के अनुसार लिखें। पढ़ाई का क्रम: कक्षा → पुस्तक → अध्याय → टॉपिक → सबटॉपिक।</div></div>
${trashHtml()}<div class="panel"><h2>कक्षा → पुस्तक → अध्याय → टॉपिक → सबटॉपिक (${questions.length} प्रश्न)</h2>${folderHtml||'<p class="empty">अभी कोई प्रश्न नहीं है।</p>'}</div>`;
renderPicker();bindTrash();bindEdit();bindMove();document.querySelectorAll('details[data-k]').forEach(d=>d.addEventListener('toggle',()=>{d.open?openKeys.add(d.dataset.k):openKeys.delete(d.dataset.k)}));$('#cancelEdit')?.addEventListener('click',()=>{editId=null;renderManage()});const bulkText=$('#bulkText'),bulkStatus=$('#bulkStatus');const getBulk=()=>parseTxtQuestions(bulkText.value);
$('#checkBulk').onclick=()=>{const parsed=getBulk();bulkStatus.textContent=bulkText.value.trim()?`जाँच पूरी: ${parsed.length} प्रश्न और उनके उत्तर मिले। ${parsed.length?'अब जगह देखकर Import करें।':'फ़ॉर्मेट नमूने के अनुसार जाँचें।'}`:'पहले प्रश्न पेस्ट करें।';};
$('#importBulk').onclick=()=>{const parsed=getBulk();if(!bulkText.value.trim()){bulkStatus.textContent='पहले प्रश्न पेस्ट करें।';return}if(!parsed.length){bulkStatus.textContent='कोई पूरा प्रश्न-उत्तर नहीं मिला। नमूने के अनुसार “प्रश्न:” और “उत्तर:” लिखें।';return}const d=getDst();if(d.err){bulkStatus.textContent=d.err;return}dropPh(d.g,d.su,d.bk,d.ch,d.top,d.sub);const now=Date.now();const add=parsed.map((q,i)=>({id:now+i,grade:d.g,subject:d.su,book:d.bk,chapter:d.ch,topic:d.top,subtopic:d.sub,q:q.q,a:q.a}));questions.push(...add);save();shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};index=0;revealed=0;const msg=`सफलता! ${add.length} प्रश्न “${d.bk} → ${d.ch} → ${d.top}${d.sub?' → '+d.sub:''}” के अंत में जुड़ गए।`;renderManage();$('#bulkStatus').textContent=msg;};
$('#addForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),raw=String(f.get('a')),qt=String(f.get('q')).trim();const a=(editId?raw:raw.replace(/[,，।]\s*/g,'\n')).split(/\n+/).map(x=>x.trim()).filter(Boolean);const d=getDst();if(d.err){alert(d.err);return}if(!a.length||!qt)return;let msg;if(editId){const i=questions.findIndex(x=>x.id===editId);if(i>=0){const nq={...questions[i],grade:d.g,subject:d.su,book:d.bk,chapter:d.ch,topic:d.top,subtopic:d.sub,q:qt,a};delete nq.ph;questions[i]=nq;dropPh(d.g,d.su,d.bk,d.ch,d.top,d.sub)}editId=null;msg='✓ बदलाव सेव हो गया।'}else{dropPh(d.g,d.su,d.bk,d.ch,d.top,d.sub);questions.push({id:Date.now(),grade:d.g,subject:d.su,book:d.bk,chapter:d.ch,topic:d.top,subtopic:d.sub,q:qt,a});msg=`✓ प्रश्न “${d.bk} → ${d.ch} → ${d.top}${d.sub?' → '+d.sub:''}” में जुड़ गया।`}save();shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};index=0;revealed=0;renderManage();$('#addStatus').textContent=msg;});
document.querySelectorAll('[data-delete-level]').forEach(b=>b.addEventListener('click',e=>{
e.preventDefault();e.stopPropagation();
let target;try{target=JSON.parse(b.dataset.deleteLevel)}catch{return}
const match=q=>{
 if((q.grade||'बिना कक्षा')!==target.g)return false;
 if(target.level==='grade')return true;
 if(bookOf(q)!==target.b)return false;
 if(target.level==='book')return true;
 if(chapterOf(q)!==target.c)return false;
 if(target.level==='chapter')return true;
 if(topicOf(q)!==target.t)return false;
 if(target.level==='topic')return true;
 return subtopicOf(q)===target.sub;
};
const count=questions.filter(match).length;if(!count)return;
const names={grade:'कक्षा / फ़ोल्डर',book:'किताब',chapter:'अध्याय',topic:'टॉपिक',subtopic:'सबटॉपिक'};
if(confirm(`क्या आप ${names[target.level]} “${target[target.level==='grade'?'g':target.level==='book'?'b':target.level==='chapter'?'c':target.level==='topic'?'t':'sub']}” हटाना चाहते हैं?\n\nइससे ${count} प्रश्न हटेंगे, पर वे “🗑️ कचरा पेटी” में रहेंगे और वहाँ से वापस आ सकते हैं।`)){
 {const nm=target[target.level==='grade'?'g':target.level==='book'?'b':target.level==='chapter'?'c':target.level==='topic'?'t':'sub'];moveToTrash(names[target.level]+': '+nm+(target.level!=='grade'?'  ('+target.g+')':''),questions.filter(match))}questions=questions.filter(q=>!match(q));save();
 shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};index=0;revealed=0;
 renderManage();
 }
}));
document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(confirm('क्या यह प्रश्न हटाना है?')){const it=questions.filter(q=>String(q.id)===String(b.dataset.delete));moveToTrash('प्रश्न: '+(it[0]?it[0].q.slice(0,40):''),it);questions=questions.filter(q=>String(q.id)!==String(b.dataset.delete));save();renderManage()}}));
}
function renderReport(){let known=Object.keys(seen).filter(id=>seen[id]==='याद').length;$('#content').innerHTML=`<div class="panel"><h2>आपकी Revision रिपोर्ट</h2><div class="stats"><div class="stat"><b>${questions.filter(q=>!q.ph).length}</b><span>कुल प्रश्न</span></div><div class="stat"><b>${known}</b><span>याद हो गए</span></div><div class="stat"><b>${Math.max(0,questions.filter(q=>!q.ph).length-known)}</b><span>बाकी प्रश्न</span></div></div><div class="actions"><button class="secondary" id="clearSeen">रिपोर्ट रीसेट करें</button><button class="outline" id="export">प्रश्नों का बैकअप डाउनलोड करें</button><label class="tab" style="display:inline-flex;align-items:center;cursor:pointer">बैकअप अपलोड करें<input id="import" type="file" accept="application/json" style="display:none"></label></div><div class="notice">प्रश्न कक्षा → पुस्तक → अध्याय → टॉपिक → सबटॉपिक के अनुसार व्यवस्थित हैं। डेटा MongoDB सर्वर पर सेव होता है, इसलिए हर डिवाइस पर एक जैसा दिखेगा।</div></div>`;$('#clearSeen').onclick=()=>{seen={};saveSeen();renderReport()};$('#export').onclick=()=>{let blob=new Blob([JSON.stringify(questions,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='shadab-revision-backup.json';a.click();URL.revokeObjectURL(url)};$('#import').onchange=async e=>{try{let data=JSON.parse(await e.target.files[0].text());if(Array.isArray(data)&&data.every(q=>q.q&&Array.isArray(q.a))){questions=data;save();renderReport()}else alert('यह सही प्रश्न बैकअप फ़ाइल नहीं है।')}catch{alert('फ़ाइल पढ़ी नहीं जा सकी।')}}}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;editId=null;render()}));boot();
// Auto-reveal one answer line every 10 seconds while Revision is open and not paused.
setInterval(()=>{if(tab!=='revise'||autoPaused||shelf.level!=='study')return;const list=filtered();const q=list[index];if(q&&revealed<q.a.length&&!typingNow){revealed++;renderRevise(true);}},10000);

/* ===== सर्वर (MongoDB) सिंक ===== */
const setStatus=t=>{const e=document.getElementById('syncStatus');if(e)e.textContent=t};
async function api(url,opt={},retry=true){
  const key=localStorage.getItem('shadabWriteKey')||'';
  const r=await fetch(url,{...opt,headers:{'Content-Type':'application/json','x-write-key':key}});
  if(r.status===401&&retry){const k=prompt('सेव करने के लिए एडमिन पासवर्ड डालें:');if(k){localStorage.setItem('shadabWriteKey',k);return api(url,opt,false)}}
  if(!r.ok)throw new Error('HTTP '+r.status);
  return r.json();
}
let syncT=null,syncing=false,dirty=false;
function queueSync(){if(!ready)return;dirty=true;setStatus('⏳ सेव हो रहा है…');clearTimeout(syncT);syncT=setTimeout(flush,700)}
async function flush(){
  if(syncing){syncT=setTimeout(flush,700);return}
  syncing=true;dirty=false;
  try{await api('/api/questions',{method:'PUT',body:JSON.stringify({questions:questions.map((q,i)=>({...q,pos:i}))})});setStatus('☁️ सर्वर पर सेव हो गया')}
  catch(e){dirty=true;setStatus('⚠️ सर्वर पर सेव नहीं हुआ — दोबारा कोशिश होगी')}
  syncing=false;
}
function saveSeen(){
  try{localStorage.setItem('shadabRevisionSeen',JSON.stringify(seen))}catch(e){}
  if(ready)api('/api/seen',{method:'PUT',body:JSON.stringify({seen})}).catch(()=>setStatus('⚠️ रिपोर्ट सर्वर पर सेव नहीं हुई'));
}
setInterval(()=>{if(dirty&&ready&&!syncing)flush()},15000);
async function boot(){
  let local=null;try{local=JSON.parse(localStorage.getItem('shadabRevisionQuestions'))}catch(e){}
  try{
    const d=await api('/api/data');
    questions=d.questions||[];seen=d.seen||{};trash=d.trash||[];
    if(!d.seeded){
      if(!questions.length)questions=(Array.isArray(local)&&local.length)?local:starter.slice();
      ready=true;loadAll();
    }
    ready=true;setStatus('☁️ सर्वर से जुड़ा');
  }catch(e){
    questions=(Array.isArray(local)&&local.length)?local:starter.slice();
    try{seen=JSON.parse(localStorage.getItem('shadabRevisionSeen'))||{}}catch(x){}
    try{trash=JSON.parse(localStorage.getItem('shadabTrash'))||[]}catch(x){}
    ready=false;setStatus('⚠️ सर्वर नहीं मिला — डेटा सिर्फ़ इसी डिवाइस में है');
  }
  render();
}

/* ===== "कहाँ जोड़ना है?" — सूची से चुनें या नया लिखें ===== */
const NEWV='__new',LEVELS=['grade','book','chapter','topic','subtopic'];
const LABEL={grade:'कक्षा / परीक्षा',book:'किताब',chapter:'अध्याय',topic:'टॉपिक',subtopic:'सबटॉपिक (वैकल्पिक)'};
const GETTER={grade:gradeOf,book:bookOf,chapter:chapterOf,topic:topicOf,subtopic:q=>q.subtopic||''};
let dst={grade:'',book:'',subject:'',chapter:'',topic:'',subtopic:'',nw:{}};
function sylSummary(){return ['SSC CGL','CTET','BPSC','UPSC'].map(g=>{const all=questions.filter(q=>q.grade===g);const f=new Set(all.map(q=>[bookOf(q),chapterOf(q),topicOf(q),subtopicOf(q)].join('|'))).size;return `${g}: ${f} फ़ोल्डर, ${all.filter(q=>!q.ph).length} प्रश्न`}).join(' · ')}
function pickerOpts(level){let r=questions;for(const L of LEVELS){if(L===level)break;r=r.filter(q=>GETTER[L](q)===dst[L])}return[...new Set(r.map(GETTER[level]))].filter(x=>level==='subtopic'?x!=='':true)}
function bookSubject(){const q=questions.find(q=>gradeOf(q)===dst.grade&&bookOf(q)===dst.book);return q?subjectOf(q):''}
function pickSummary(){const parts=LEVELS.map(L=>String(dst[L]||'').trim()).filter(Boolean);const el=document.getElementById('pickSummary');if(el)el.textContent=parts.length?'📍 चुनी जगह: '+parts.join(' → ')+(dst.subject?'  (विषय: '+dst.subject+')':''):'अभी कोई जगह नहीं चुनी।'}
function renderPicker(){
  const box=document.getElementById('picker');if(!box)return;
  let html='<div class="formgrid">',ok=true,parentNew=false,needSubject=false;
  LEVELS.forEach(L=>{
    if(!ok)return;
    if(parentNew)dst.nw[L]=true;
    const opts=parentNew?null:pickerOpts(L);
    const isNew=!!dst.nw[L];
    let sel='';
    if(opts){
      const cur=isNew?NEWV:dst[L];
      sel=`<select data-l="${L}">${L==='subtopic'?'<option value="">(बिना सबटॉपिक)</option>':'<option value="">— चुनें —</option>'}${opts.map(v=>`<option value="${esc(v)}" ${v===cur?'selected':''}>${esc(v)}</option>`).join('')}<option value="${NEWV}" ${isNew?'selected':''}>➕ नया लिखें…</option></select>`;
    }
    const txt=(isNew||!opts)?`<input data-t="${L}" value="${esc(dst[L]||'')}" placeholder="नया ${LABEL[L].replace(' (वैकल्पिक)','')} का नाम लिखें" style="${sel?'margin-top:6px':''}">`:'';
    html+=`<div class="field"><label>${LABEL[L]}</label>${sel}${txt}</div>`;
    if(L==='book'&&(isNew||!opts)){needSubject=true}
    if(isNew||!opts)parentNew=true;
    if(L!=='subtopic'&&opts&&!isNew&&!String(dst[L]||'').trim())ok=false;
  });
  if(needSubject){html+=`<div class="field"><label>विषय (नई किताब का)</label><input data-t="subject" list="subjectNames" value="${esc(dst.subject||'')}" placeholder="जैसे Science, Maths, Polity"><datalist id="subjectNames">${[...new Set(questions.map(subjectOf))].map(v=>`<option value="${esc(v)}">`).join('')}</datalist></div>`}
  html+='</div><div class="notice" id="pickSummary"></div>';
  box.innerHTML=html;pickSummary();
  box.querySelectorAll('select[data-l]').forEach(el=>el.onchange=()=>{
    const L=el.dataset.l,v=el.value;
    if(v===NEWV){dst.nw[L]=true;dst[L]=''}else{dst.nw[L]=false;dst[L]=v}
    LEVELS.slice(LEVELS.indexOf(L)+1).forEach(X=>{dst[X]='';dst.nw[X]=false});
    if(L==='grade')dst.subject='';
    if(L==='book')dst.subject=(!dst.nw.book&&v)?bookSubject():'';
    renderPicker();
  });
  box.querySelectorAll('input[data-t]').forEach(el=>el.oninput=()=>{dst[el.dataset.t]=el.value;pickSummary()});
}
function getDst(){
  const t=k=>String(dst[k]||'').trim();
  const g=t('grade'),bk=t('book'),ch=t('chapter'),top=t('topic'),sub=t('subtopic');
  const su=t('subject')||(dst.nw.book?'':bookSubject());
  if(!g)return{err:'“कहाँ जोड़ना है?” में पहले कक्षा / परीक्षा चुनें या लिखें।'};
  if(!bk)return{err:'किताब चुनें या नई किताब का नाम लिखें।'};
  if(!su)return{err:'नई किताब का विषय लिखें।'};
  if(!ch)return{err:'अध्याय चुनें या लिखें।'};
  if(!top)return{err:'टॉपिक चुनें या लिखें।'};
  return{g,su,bk,ch,top,sub};
}

/* ===== कचरा पेटी: हटाई चीज़ें वापस लाने के लिए ===== */
function saveTrash(){
  try{localStorage.setItem('shadabTrash',JSON.stringify(trash))}catch(e){}
  if(ready)api('/api/trash',{method:'PUT',body:JSON.stringify({trash})}).catch(()=>setStatus('⚠️ कचरा पेटी सर्वर पर सेव नहीं हुई'));
}
let toastT=null;
function toast(msg,label,fn){
  let b=document.getElementById('toastBar');
  if(!b){b=document.createElement('div');b.id='toastBar';b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:18px;max-width:92vw;background:#302719;color:#fff;padding:12px 14px;border-radius:14px;display:flex;gap:12px;align-items:center;z-index:99;box-shadow:0 8px 24px #0004;font-size:14px';document.body.appendChild(b)}
  b.innerHTML='';const sp=document.createElement('span');sp.textContent=msg;b.appendChild(sp);
  if(label){const bt=document.createElement('button');bt.textContent=label;bt.style.cssText='background:#fff;color:#302719;padding:8px 12px;white-space:nowrap';bt.onclick=()=>{b.style.display='none';fn()};b.appendChild(bt)}
  b.style.display='flex';clearTimeout(toastT);toastT=setTimeout(()=>{b.style.display='none'},label?15000:4000);
}
function moveToTrash(label,items){
  if(!items.length)return;
  const t={tid:Date.now(),at:Date.now(),label,items};
  trash.unshift(t);trash=trash.slice(0,50);saveTrash();
  toast('🗑️ हटाया: '+label,'↩ पूर्ववत करें',()=>restoreTrash(t.tid));
}
function restoreTrash(tid){
  const t=trash.find(x=>x.tid===tid);if(!t)return;
  const ids=new Set(questions.map(q=>q.id));
  const same=(a,b)=>gradeOf(a)===gradeOf(b)&&subjectOf(a)===subjectOf(b)&&bookOf(a)===bookOf(b)&&chapterOf(a)===chapterOf(b)&&topicOf(a)===topicOf(b)&&subtopicOf(a)===subtopicOf(b);
  let n=0;
  t.items.forEach(q=>{if(ids.has(q.id))return;if(q.ph&&questions.some(x=>same(x,q)))return;questions.push(q);n++});
  trash=trash.filter(x=>x.tid!==tid);save();saveTrash();
  toast('↩ वापस आ गया: '+t.label);
  if(tab==='manage')renderManage();else if(tab==='revise')renderRevise();
}
function trashHtml(){
  const rows=trash.map(t=>`<div class="qrow"><div><b>${esc(t.label)}</b><p>${t.items.length} प्रश्न · ${esc(new Date(t.at).toLocaleString('hi-IN'))}</p></div><div class="actions" style="margin:0"><button class="secondary" data-restore="${t.tid}">↩ वापस लाएँ</button><button class="danger" data-purge="${t.tid}">हमेशा के लिए हटाएँ</button></div></div>`).join('');
  return `<div class="panel"><h2>कचरा पेटी (${trash.length})</h2>${trash.length?`<p class="hint">गलती से हटाई चीज़ें यहाँ रहती हैं। जो चाहिए सिर्फ़ वही वापस लाएँ।</p><div class="question-list">${rows}</div><div class="actions"><button class="outline" id="emptyTrash">कचरा पेटी खाली करें</button></div>`:'<p class="hint">अभी कुछ नहीं हटाया गया। हटाई हुई किताब, अध्याय, टॉपिक या प्रश्न यहाँ मिलेंगे।</p>'}</div>`;
}
function bindTrash(){
  document.querySelectorAll('[data-restore]').forEach(b=>b.onclick=()=>restoreTrash(Number(b.dataset.restore)));
  document.querySelectorAll('[data-purge]').forEach(b=>b.onclick=()=>{if(confirm('यह हमेशा के लिए हट जाएगा। पक्का?')){trash=trash.filter(t=>t.tid!==Number(b.dataset.purge));saveTrash();renderManage()}});
  const e=document.getElementById('emptyTrash');
  if(e)e.onclick=()=>{if(confirm('पूरी कचरा पेटी खाली करें? ये चीज़ें फिर वापस नहीं आएँगी।')){trash=[];saveTrash();renderManage()}};
}

/* ===== प्रश्न संपादित करना ===== */
function startEdit(id){
  const q=questions.find(x=>String(x.id)===String(id));if(!q)return;
  editId=q.id;
  dst={grade:gradeOf(q),book:bookOf(q),subject:subjectOf(q),chapter:chapterOf(q),topic:topicOf(q),subtopic:q.subtopic||'',nw:{}};
  tab='manage';render();
  const f=document.getElementById('addForm');
  if(f&&f.scrollIntoView)f.scrollIntoView({behavior:'smooth',block:'start'});
}
function bindEdit(){document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>startEdit(b.dataset.edit))}

/* ===== प्रश्नों का क्रम: ऊपर-नीचे / स्थान संख्या ===== */
function samePath(a,b){return gradeOf(a)===gradeOf(b)&&subjectOf(a)===subjectOf(b)&&bookOf(a)===bookOf(b)&&chapterOf(a)===chapterOf(b)&&topicOf(a)===topicOf(b)&&subtopicOf(a)===subtopicOf(b)}
function groupIdxs(q){const r=[];questions.forEach((x,i)=>{if(samePath(x,q))r.push(i)});return r}
function posOf(id){const q=questions.find(x=>String(x.id)===String(id));if(!q)return 0;return groupIdxs(q).findIndex(i=>questions[i].id===q.id)+1}
function moveQ(id,to){
  const q=questions.find(x=>String(x.id)===String(id));if(!q)return;
  const idxs=groupIdxs(q),items=idxs.map(i=>questions[i]);
  const from=items.findIndex(x=>x.id===q.id);
  const t=Math.max(1,Math.min(items.length,Math.round(Number(to))||1))-1;
  if(t===from)return;
  items.splice(from,1);items.splice(t,0,q);
  idxs.forEach((qi,k)=>{questions[qi]=items[k]});
  save();renderManage();
}
function moveCtl(q,i,n){
  return `<button class="outline" data-up="${q.id}" title="ऊपर" ${i===0?'disabled':''}>▲</button><button class="outline" data-down="${q.id}" title="नीचे" ${i===n-1?'disabled':''}>▼</button><input type="number" min="1" max="${n}" value="${i+1}" data-pos="${q.id}" title="स्थान संख्या" style="width:66px;padding:8px"><button class="outline" data-go="${q.id}">जाएँ</button>`;
}
function bindMove(){
  document.querySelectorAll('[data-up]').forEach(b=>b.onclick=()=>moveQ(b.dataset.up,posOf(b.dataset.up)-1));
  document.querySelectorAll('[data-down]').forEach(b=>b.onclick=()=>moveQ(b.dataset.down,posOf(b.dataset.down)+1));
  const go=id=>{const inp=document.querySelector(`[data-pos="${id}"]`);if(inp)moveQ(id,inp.value)};
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>go(b.dataset.go));
  document.querySelectorAll('[data-pos]').forEach(inp=>inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();go(inp.dataset.pos)}});
}

/* ===== हाथ से टाइप करने जैसा उत्तर ===== */
function typeInto(elm,text,done){
  const seg=(typeof Intl!=='undefined'&&Intl.Segmenter)?[...new Intl.Segmenter('hi',{granularity:'grapheme'}).segment(text)].map(x=>x.segment):[...text];
  let i=0;typingNow=true;
  const caret=document.createElement('span');caret.className='nb-caret';
  if(elm.after)elm.after(caret);
  const finish=()=>{typingNow=false;if(caret.remove)caret.remove();if(done)done()};
  const step=()=>{
    if(!elm.isConnected){typingNow=false;return}
    i++;elm.textContent=seg.slice(0,i).join('');
    if(i>=seg.length){finish();return}
    const c=seg[i-1];
    const d=/[।,.?!;:]/.test(c)?240+Math.random()*160:/\s/.test(c)?60+Math.random()*60:26+Math.random()*44;
    typingTimer=setTimeout(step,d);
  };
  typingTimer=setTimeout(step,220);
}
