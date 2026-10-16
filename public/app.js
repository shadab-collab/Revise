let questions=[],seen={},ready=false;let tab='revise',grade='सभी कक्षाएँ',book='सभी पुस्तकें',subject='सभी विषय',chapter='सभी टॉपिक',subtopic='सभी सबटॉपिक',index=0,revealed=0,autoPaused=false;let shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};
const $=s=>document.querySelector(s);const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const save=()=>{try{localStorage.setItem('shadabRevisionQuestions',JSON.stringify(questions))}catch(e){}queueSync()};const bookOf=q=>q.book||`${q.subject||'सामान्य'} — सामान्य पुस्तक`;const chapterOf=q=>q.chapter||'बिना अध्याय';const topicOf=q=>q.topic||'सामान्य प्रश्न';const subtopicOf=q=>q.subtopic||'बिना सबटॉपिक';const filtered=()=>questions.filter(q=>q.grade===shelf.grade&&q.subject===shelf.subject&&bookOf(q)===shelf.book&&chapterOf(q)===shelf.chapter&&topicOf(q)===shelf.topic&&subtopicOf(q)===shelf.subtopic);
function options(values,current){return values.map(v=>`<option ${v===current?'selected':''} value="${esc(v)}">${esc(v)}</option>`).join('')}
function render(){document.querySelectorAll('.tab').forEach(b=>b.classList.toggle('active',b.dataset.tab===tab));if(tab==='revise')renderRevise();if(tab==='manage')renderManage();if(tab==='report')renderReport()}
function renderRevise(autoScroll=false){
const allGrades=[...new Set(questions.map(q=>q.grade).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'hi'));
const allBooks=questions.filter(q=>q.grade===shelf.grade).reduce((acc,q)=>{const key=[q.subject||'सामान्य',bookOf(q)].join('|||');if(!acc.some(x=>x.key===key))acc.push({key,subject:q.subject||'सामान्य',book:bookOf(q)});return acc},[]);
const inBook=questions.filter(q=>q.grade===shelf.grade&&q.subject===shelf.subject&&bookOf(q)===shelf.book);
const chapters=[...new Set(inBook.map(chapterOf))];
const inChapter=inBook.filter(q=>chapterOf(q)===shelf.chapter);
const topics=[...new Set(inChapter.map(topicOf))];
const inTopic=inChapter.filter(q=>topicOf(q)===shelf.topic);
const subtopics=[...new Set(inTopic.map(subtopicOf))];
const list=filtered();if(index>=list.length)index=Math.max(0,list.length-1);const q=shelf.level==='study'?list[index]:null;
const countGrade=g=>questions.filter(q=>q.grade===g).length;
const countBook=(su,bk)=>questions.filter(q=>q.grade===shelf.grade&&q.subject===su&&bookOf(q)===bk).length;
const countChapter=c=>inBook.filter(q=>chapterOf(q)===c).length;
const countTopic=t=>inChapter.filter(q=>topicOf(q)===t).length;
const countSub=sub=>inTopic.filter(q=>subtopicOf(q)===sub).length;
const card=(name,count,icon,action,cls='')=>`<button class="shelf-card ${cls}" data-shelf-action="${esc(action)}"><span class="folder-icon">${icon}</span><span class="shelf-name">${esc(name)}</span><span class="shelf-count">${count} प्रश्न</span></button>`;
let crumbs=`<div class="crumbs"><button class="crumb ${shelf.level==='grade'?'current':''}" data-level="grade">🏠 सभी कक्षाएँ</button>${shelf.grade?`<button class="crumb ${shelf.level==='book'?'current':''}" data-level="book">📁 ${esc(shelf.grade)}</button>`:''}${shelf.book?`<button class="crumb ${shelf.level==='chapter'?'current':''}" data-level="chapter">📚 ${esc(shelf.book)}</button>`:''}${shelf.chapter?`<button class="crumb ${shelf.level==='topic'?'current':''}" data-level="topic">📂 ${esc(shelf.chapter)}</button>`:''}${shelf.topic?`<button class="crumb ${shelf.level==='subtopic'?'current':''}" data-level="subtopic">🗂️ ${esc(shelf.topic)}</button>`:''}${shelf.level==='study'?`<span class="crumb current">📖 पढ़ाई</span>`:''}</div>`;
let body='';
if(shelf.level==='grade'){
 body=`<div class="shelf-intro"><h2>📚 अपनी कक्षा चुनें</h2><span class="hint">कक्षा के फ़ोल्डर खोलकर अपनी किताब तक पहुँचें</span></div><div class="shelf-section"><p class="shelf-label">कक्षा / अध्ययन स्तर</p><div class="shelf-grid">${allGrades.map(g=>card(g,countGrade(g),'📁',`grade|${g}`)).join('')}</div></div>`;
}else if(shelf.level==='book'){
 body=`<div class="shelf-intro"><h2>📚 ${esc(shelf.grade)} की किताबें</h2><span class="hint">हर किताब अपनी अलग जगह पर</span></div><div class="shelf-section"><p class="shelf-label">किताबों की शेल्फ</p><div class="shelf-row">${allBooks.map(b=>card(b.book,countBook(b.subject,b.book),'📕',`book|${b.subject}|${b.book}`,'book-card')).join('')}</div></div>`;
}else if(shelf.level==='chapter'){
 body=`<div class="shelf-intro"><h2>📖 ${esc(shelf.book)}</h2><span class="hint">विषय: ${esc(shelf.subject)}</span></div><div class="shelf-section"><p class="shelf-label">अध्याय चुनें</p><div class="shelf-grid">${chapters.map(c=>card(c,countChapter(c),'📂',`chapter|${c}`)).join('')}</div></div>`;
}else if(shelf.level==='topic'){
 body=`<div class="shelf-intro"><h2>📂 ${esc(shelf.chapter)}</h2><span class="hint">अब अध्याय के अंदर टॉपिक चुनें</span></div><div class="shelf-section"><p class="shelf-label">टॉपिक</p><div class="shelf-grid">${topics.map(t=>card(t,countTopic(t),'🗂️',`topic|${t}`)).join('')}</div></div>`;
}else if(shelf.level==='subtopic'){
 body=`<div class="shelf-intro"><h2>🗂️ ${esc(shelf.topic)}</h2><span class="hint">सबटॉपिक हो तो चुनें, वरना सीधे पढ़ाई शुरू करें</span></div><div class="shelf-section"><p class="shelf-label">सबटॉपिक / छोटे भाग</p><div class="shelf-grid">${subtopics.map(st=>card(st==='बिना सबटॉपिक'?'सीधे प्रश्न शुरू करें':st,countSub(st),st==='बिना सबटॉपिक'?'📖':'📄',`subtopic|${st}`)).join('')}</div></div>`;
}else if(shelf.level==='study'){
 body=`<button class="secondary study-back" id="backToShelf">← किताब की शेल्फ पर वापस</button>${q?`<div class="panel study-card"><div class="meta"><span>${esc(q.grade)} · ${esc(q.subject)} · ${esc(bookOf(q))}</span><span>प्रश्न ${index+1}/${list.length}</span></div><div class="book-spine">अध्याय: ${esc(chapterOf(q))}</div><div class="book-spine">टॉपिक: ${esc(topicOf(q))}</div>${q.subtopic?`<div class="book-spine">सबटॉपिक: ${esc(q.subtopic)}</div>`:''}<div class="progress"><span style="width:${list.length?(index+1)/list.length*100:0}%"></span></div><h2>प्रश्न ${index+1}</h2><div class="question">${esc(q.q)}</div><div class="answer-lines">${q.a.slice(0,revealed).map((line,i)=>`<div class="answer-line"><span class="line-label">पंक्ति ${i+1}</span>${esc(line)}</div>`).join('')}</div>${revealed===q.a.length?'<p class="success">✓ उत्तर पूरा हो गया!</p>':''}<div class="actions">${revealed<q.a.length?`<button class="primary" id="reveal">${revealed===0?'पहली पंक्ति दिखाएँ':'अगली पंक्ति दिखाएँ'} →</button>`:`<button class="primary" id="next">अगला प्रश्न →</button>`}<button class="secondary" id="autoToggle">${autoPaused?'▶ ऑटो रिवील चालू करें':'⏸ ऑटो रिवील रोकें'}</button><button class="secondary" id="remember">✓ याद हो गया</button><button class="outline" id="again">↻ फिर से देखें</button></div></div>`:`<div class="panel shelf-empty">इस सबटॉपिक में प्रश्न नहीं मिले।</div>`}`;
}
$('#content').innerHTML=`<div class="panel bookshelf-panel">${crumbs}${body}</div>`;
document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{const level=b.dataset.level;shelf.level=level;if(level==='grade'){shelf.grade=shelf.subject=shelf.book=shelf.chapter=shelf.topic=shelf.subtopic=''}if(level==='book'){shelf.subject=shelf.book=shelf.chapter=shelf.topic=shelf.subtopic=''}if(level==='chapter'){shelf.chapter=shelf.topic=shelf.subtopic=''}if(level==='topic'){shelf.topic=shelf.subtopic=''}index=0;revealed=0;renderRevise()});
document.querySelectorAll('[data-shelf-action]').forEach(b=>b.onclick=()=>{const parts=b.dataset.shelfAction.split('|'),act=parts[0];if(act==='grade'){shelf.grade=parts[1];shelf.level='book';shelf.subject=shelf.book=shelf.chapter=shelf.topic=shelf.subtopic=''}if(act==='book'){shelf.subject=parts[1];shelf.book=parts[2];shelf.level='chapter';shelf.chapter=shelf.topic=shelf.subtopic=''}if(act==='chapter'){shelf.chapter=parts[1];shelf.level='topic';shelf.topic=shelf.subtopic=''}if(act==='topic'){shelf.topic=parts[1];shelf.level='subtopic';shelf.subtopic=''}if(act==='subtopic'){shelf.subtopic=parts[1];shelf.level='study';index=0;revealed=0}renderRevise()});
if(shelf.level!=='study'||!q)return;
$('#backToShelf')?.addEventListener('click',()=>{shelf.level='subtopic';index=0;revealed=0;renderRevise()});
$('#reveal')?.addEventListener('click',()=>{revealed=Math.min(q.a.length,revealed+1);renderRevise()});
$('#autoToggle')?.addEventListener('click',()=>{autoPaused=!autoPaused;renderRevise()});
$('#next')?.addEventListener('click',()=>{index=(index+1)%list.length;revealed=0;renderRevise()});
$('#remember')?.addEventListener('click',()=>{seen[q.id]='याद';saveSeen();if(index<list.length-1){index++;revealed=0}renderRevise()});
$('#again')?.addEventListener('click',()=>{revealed=0;renderRevise()});
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
const folderHtml=Object.entries(groupBy(questions,q=>q.grade||'बिना कक्षा')).sort((a,b)=>a[0].localeCompare(b[0])).map(([g,gqs])=>{
 const books=groupBy(gqs,q=>bookOf(q));
 return `<details class="panel" open><summary style="cursor:pointer;font-weight:800;font-size:17px;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📁 ${esc(g)} (${gqs.length} प्रश्न)</span>${delBtn('grade',{g},gqs.length,'कक्षा हटाएँ')}</summary>${Object.entries(books).map(([b,bqs])=>{
  const chapters=groupBy(bqs,q=>chapterOf(q));
  return `<details style="margin:12px 0 0 12px;border-left:4px solid var(--wood);padding:10px 0 0 12px"><summary style="cursor:pointer;font-weight:800;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📚 ${esc(b)} (${bqs.length} प्रश्न)</span>${delBtn('book',{g,b},bqs.length,'किताब हटाएँ')}</summary>${Object.entries(chapters).map(([c,cqs])=>{
   const topics=groupBy(cqs,q=>topicOf(q));
   return `<details style="margin:10px 0 0 12px;border-left:3px solid var(--blue);padding:8px 0 0 12px"><summary style="cursor:pointer;font-weight:700;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📂 ${esc(c)} (${cqs.length} प्रश्न)</span>${delBtn('chapter',{g,b,c},cqs.length,'अध्याय हटाएँ')}</summary>${Object.entries(topics).map(([t,tqs])=>{
    const subs=groupBy(tqs,q=>subtopicOf(q));
    return `<details style="margin:8px 0 0 12px"><summary style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>🗂️ ${esc(t)} (${tqs.length} प्रश्न)</span>${delBtn('topic',{g,b,c,t},tqs.length,'टॉपिक हटाएँ')}</summary><div class="question-list" style="margin-top:8px">${Object.entries(subs).map(([sub,sqs])=>`<details style="margin:8px 0 0 10px"><summary style="cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap"><span>📄 ${esc(sub)} (${sqs.length} प्रश्न)</span>${delBtn('subtopic',{g,b,c,t,sub},sqs.length,'सबटॉपिक हटाएँ')}</summary>${sqs.map(q=>`<div class="qrow"><div><b>${esc(q.q)}</b><p>${esc(q.grade)} · ${esc(q.subject)} · ${esc(bookOf(q))}</p></div><button class="danger" data-delete="${q.id}">प्रश्न हटाएँ</button></div>`).join('')}</details>`).join('')}</div></details>`;
   }).join('')}</details>`;
  }).join('')}</details>`;
 }).join('')}</details>`;
}).join('');
const bookOptions=[...new Set(questions.map(bookOf))];
$('#content').innerHTML=`
<div class="panel"><h2>🎯 प्रतियोगी परीक्षा सिलेबस</h2><p class="hint">SSC CGL, CTET, BPSC और UPSC का पूरा ढाँचा (किताब → अध्याय → टॉपिक → सबटॉपिक) एक क्लिक में जोड़ें; हर सबटॉपिक में आप अपने प्रश्न डालेंगे। आपके पुराने प्रश्न नहीं हटेंगे, और दोबारा दबाने पर डुप्लिकेट नहीं बनेंगे।</p><div class="actions"><button class="primary" onclick="alert(loadAll()+' नए फ़ोल्डर/प्रश्न जुड़े');renderManage()">＋ CGL / CTET / BPSC / UPSC जोड़ें</button></div></div>
<div class="panel"><h2>📚 पुस्तक के अनुसार Bulk Import</h2>
<p class="hint">कक्षा → पुस्तक → अध्याय → टॉपिक → सबटॉपिक के क्रम में किताबों की शेल्फ बनेगी। नीचे चुनी गई जगह पर TXT के सभी प्रश्न Import होंगे।</p>
<div class="field" style="margin:12px 0"><label>TXT फ़ाइल चुनें (वैकल्पिक)</label><input id="txtFile" type="file" accept=".txt,text/plain"></div>
<div class="field"><label>या प्रश्न यहाँ पेस्ट करें</label><textarea id="bulkText" rows="9" placeholder="प्रश्न: प्रकाश संश्लेषण क्या है?\nउत्तर:\nहरे पौधे अपना भोजन बनाते हैं।\nयह प्रक्रिया सूर्य के प्रकाश की सहायता से होती है।\n\nप्रश्न: कोशिका क्या है?\nउत्तर:\nकोशिका जीवों की संरचनात्मक और क्रियात्मक इकाई है।"></textarea></div>
<div class="formgrid" style="margin-top:12px">
<div class="field"><label>कक्षा / स्तर (अपना नाम लिखें)</label><input id="bulkGrade" list="gradeNames" value="कक्षा 10" placeholder="जैसे कक्षा 11, CTET, UPSC" required></div>
<div class="field"><label>विषय</label><input id="bulkSubject" value="Science" placeholder="Science / Maths / SST"></div>
<div class="field"><label>पुस्तक का नाम (Parent Folder)</label><input id="bulkBook" list="bookNames" placeholder="जैसे विज्ञान, NCERT Science" required></div>
<div class="field"><label>अध्याय</label><input id="bulkChapter" placeholder="जैसे अध्याय 6 — जैव प्रक्रम" required></div>
<div class="field"><label>टॉपिक</label><input id="bulkTopic" placeholder="जैसे प्रकाश संश्लेषण" required></div>
<div class="field"><label>सबटॉपिक (वैकल्पिक)</label><input id="bulkSubtopic" placeholder="जैसे प्रकाश संश्लेषण"></div>
</div>
<datalist id="bookNames">${bookOptions.map(b=>`<option value="${esc(b)}">`).join('')}</datalist><datalist id="gradeNames">${[...new Set(questions.map(q=>q.grade))].map(g=>`<option value="${esc(g)}">`).join('')}</datalist>
<div class="actions"><button class="secondary" id="checkBulk">प्रश्नों की जाँच करें</button><button class="primary" id="importBulk">इस टॉपिक में Bulk Import करें</button></div>
<div id="bulkStatus" class="notice">कक्षा, विषय, पुस्तक, अध्याय और टॉपिक भरें। सबटॉपिक वैकल्पिक है।</div>
<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">TXT का नमूना देखें</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere;background:var(--soft);padding:12px;border-radius:10px">प्रश्न: प्रकाश संश्लेषण क्या है?
उत्तर:
हरे पौधे अपना भोजन बनाते हैं।
यह प्रक्रिया सूर्य के प्रकाश की सहायता से होती है।

प्रश्न: कोशिका क्या है?
उत्तर:
कोशिका जीवों की संरचनात्मक और क्रियात्मक इकाई है।</pre></details>
</div>
<div class="panel"><h2>एक प्रश्न मैन्युअल जोड़ें</h2><form id="addForm" class="formgrid">
<div class="field"><label>कक्षा / स्तर (अपना नाम लिखें)</label><input name="grade" list="gradeNames" required placeholder="जैसे कक्षा 11, CTET, प्रतियोगी परीक्षा"></div>
<div class="field"><label>विषय</label><input name="subject" required placeholder="Science, Maths, SST"></div>
<div class="field"><label>पुस्तक का नाम (Parent Folder)</label><input name="book" list="bookNames" required placeholder="पुस्तक का नाम"></div>
<div class="field"><label>अध्याय</label><input name="chapter" required placeholder="अध्याय का नाम"></div>
<div class="field"><label>टॉपिक</label><input name="topic" required placeholder="अध्याय के अंदर टॉपिक"></div>
<div class="field"><label>सबटॉपिक (वैकल्पिक)</label><input name="subtopic" placeholder="टॉपिक के अंदर छोटा भाग"></div>
<div class="field wide"><label>प्रश्न</label><textarea name="q" required rows="2" placeholder="लघु प्रश्न लिखें"></textarea></div>
<div class="field wide"><label>उत्तर — हर पंक्ति अलग लाइन में लिखें</label><textarea name="a" required rows="5" placeholder="पहली पंक्ति\nदूसरी पंक्ति\nतीसरी पंक्ति"></textarea><span class="hint">Revision में एक क्लिक पर एक नई पंक्ति खुलेगी।</span></div>
<div class="wide"><button class="primary" type="submit">＋ प्रश्न सेव करें</button></div></form><div class="notice">कक्षा, विषय, पुस्तक, अध्याय, टॉपिक और सबटॉपिक अपनी जरूरत के अनुसार लिखें। पढ़ाई का क्रम: कक्षा → पुस्तक → अध्याय → टॉपिक → सबटॉपिक।</div></div>
<div class="panel"><h2>📚 कक्षा → पुस्तक → अध्याय → टॉपिक → सबटॉपिक (${questions.length} प्रश्न)</h2>${folderHtml||'<p class="empty">अभी कोई प्रश्न नहीं है।</p>'}</div>`;
const bulkText=$('#bulkText'),bulkStatus=$('#bulkStatus');
$('#txtFile').addEventListener('change',async e=>{const file=e.target.files&&e.target.files[0];if(!file)return;bulkText.value=await file.text();bulkStatus.textContent=`फ़ाइल लोड हुई: ${file.name}। अब “प्रश्नों की जाँच करें” दबाएँ।`;});
const getBulk=()=>parseTxtQuestions(bulkText.value);
$('#checkBulk').onclick=()=>{const parsed=getBulk();bulkStatus.textContent=bulkText.value.trim()?`जाँच पूरी: ${parsed.length} प्रश्न और उनके उत्तर मिले। ${parsed.length?'अब पुस्तक और अध्याय का नाम जाँचकर Import करें।':'TXT का फ़ॉर्मेट नमूने के अनुसार जाँचें।'}`:'पहले TXT फ़ाइल चुनें या टेक्स्ट पेस्ट करें।';};
$('#importBulk').onclick=()=>{const parsed=getBulk(),g=$('#bulkGrade').value.trim(),su=$('#bulkSubject').value.trim(),bk=$('#bulkBook').value.trim(),ch=$('#bulkChapter').value.trim(),top=$('#bulkTopic').value.trim(),sub=$('#bulkSubtopic').value.trim();if(!bulkText.value.trim()){bulkStatus.textContent='पहले TXT फ़ाइल चुनें या टेक्स्ट पेस्ट करें।';return;}if(!parsed.length){bulkStatus.textContent='कोई पूरा प्रश्न-उत्तर नहीं मिला। नमूने के अनुसार “प्रश्न:” और “उत्तर:” लिखें।';return;}if(!g||!su||!bk||!ch||!top){bulkStatus.textContent='कक्षा, विषय, पुस्तक, अध्याय और टॉपिक का नाम भरें।';return;}const now=Date.now();const additions=parsed.map((q,i)=>({id:now+i,grade:g,subject:su,book:bk,chapter:ch,topic:top,subtopic:sub,q:q.q,a:q.a}));dropPh(g,su,bk,ch,top,sub);questions.push(...additions);save();shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};index=0;revealed=0;renderManage();$('#bulkStatus').textContent=`सफलता! ${additions.length} प्रश्न “${bk} → ${ch} → ${top}” में Import हो गए।`;};
$('#addForm').addEventListener('submit',e=>{e.preventDefault();const f=new FormData(e.target),a=String(f.get('a')).replace(/[,，।]\s*/g,'\n').split(/\n+/).map(x=>x.trim()).filter(Boolean),bk=String(f.get('book')).trim(),ch=String(f.get('chapter')).trim(),top=String(f.get('topic')).trim(),su=String(f.get('subject')).trim(),g=String(f.get('grade')).trim(),sub=String(f.get('subtopic')||'').trim();if(!a.length||!bk||!ch||!top||!g||!su)return;dropPh(g,su,bk,ch,top,sub);questions.push({id:Date.now(),grade:g,subject:su,book:bk,chapter:ch,topic:top,subtopic:sub,q:String(f.get('q')).trim(),a});save();shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};index=0;revealed=0;renderManage();});
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
if(confirm(`क्या आप ${names[target.level]} “${target[target.level==='grade'?'g':target.level==='book'?'b':target.level==='chapter'?'c':target.level==='topic'?'t':'sub']}” हटाना चाहते हैं?\n\nइससे ${count} प्रश्न स्थायी रूप से हट जाएँगे। पहले बैकअप डाउनलोड कर लें।`)){
 questions=questions.filter(q=>!match(q));save();
 shelf={level:'grade',grade:'',subject:'',book:'',chapter:'',topic:'',subtopic:''};index=0;revealed=0;
 renderManage();
 }
}));
document.querySelectorAll('[data-delete]').forEach(b=>b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();if(confirm('क्या यह प्रश्न हटाना है?')){questions=questions.filter(q=>String(q.id)!==String(b.dataset.delete));save();renderManage()}}));
}
function renderReport(){let known=Object.keys(seen).filter(id=>seen[id]==='याद').length;$('#content').innerHTML=`<div class="panel"><h2>आपकी Revision रिपोर्ट</h2><div class="stats"><div class="stat"><b>${questions.filter(q=>!q.ph).length}</b><span>कुल प्रश्न</span></div><div class="stat"><b>${known}</b><span>याद हो गए</span></div><div class="stat"><b>${Math.max(0,questions.filter(q=>!q.ph).length-known)}</b><span>बाकी प्रश्न</span></div></div><div class="actions"><button class="secondary" id="clearSeen">रिपोर्ट रीसेट करें</button><button class="outline" id="export">प्रश्नों का बैकअप डाउनलोड करें</button><label class="tab" style="display:inline-flex;align-items:center;cursor:pointer">बैकअप अपलोड करें<input id="import" type="file" accept="application/json" style="display:none"></label></div><div class="notice">प्रश्न कक्षा → पुस्तक → अध्याय → टॉपिक → सबटॉपिक के अनुसार व्यवस्थित हैं। डेटा MongoDB सर्वर पर सेव होता है, इसलिए हर डिवाइस पर एक जैसा दिखेगा।</div></div>`;$('#clearSeen').onclick=()=>{seen={};saveSeen();renderReport()};$('#export').onclick=()=>{let blob=new Blob([JSON.stringify(questions,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='shadab-revision-backup.json';a.click();URL.revokeObjectURL(url)};$('#import').onchange=async e=>{try{let data=JSON.parse(await e.target.files[0].text());if(Array.isArray(data)&&data.every(q=>q.q&&Array.isArray(q.a))){questions=data;save();renderReport()}else alert('यह सही प्रश्न बैकअप फ़ाइल नहीं है।')}catch{alert('फ़ाइल पढ़ी नहीं जा सकी।')}}}
document.querySelectorAll('.tab').forEach(b=>b.addEventListener('click',()=>{tab=b.dataset.tab;render()}));boot();
// Auto-reveal one answer line every 10 seconds while Revision is open and not paused.
setInterval(()=>{if(tab!=='revise'||autoPaused||shelf.level!=='study')return;const list=filtered();const q=list[index];if(q&&revealed<q.a.length){revealed++;renderRevise(true);}},10000);

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
  try{await api('/api/questions',{method:'PUT',body:JSON.stringify({questions})});setStatus('☁️ सर्वर पर सेव हो गया')}
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
    questions=d.questions||[];seen=d.seen||{};
    if(!d.seeded){
      if(!questions.length)questions=(Array.isArray(local)&&local.length)?local:starter.slice();
      ready=true;loadAll();
    }
    ready=true;setStatus('☁️ सर्वर से जुड़ा');
  }catch(e){
    questions=(Array.isArray(local)&&local.length)?local:starter.slice();
    try{seen=JSON.parse(localStorage.getItem('shadabRevisionSeen'))||{}}catch(x){}
    ready=false;setStatus('⚠️ सर्वर नहीं मिला — डेटा सिर्फ़ इसी डिवाइस में है');
  }
  render();
}
