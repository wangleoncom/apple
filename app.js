/* ==========================================================================
   鹿🦌 QA 粉絲站 v8.2 - 終極美學核心 (app.js)
   ========================================================================== */
const CURRENT_APP_VERSION = "8.2"; 

const qaData = window.QA_DB || [];
const quizData = window.QUIZ_DB || [];
let appSettings = { version: CURRENT_APP_VERSION, qaPerPage: 8, soundOn: true, powerSave: false };

/* ================== 1. 初始化與快取清除 ================== */
document.addEventListener('DOMContentLoaded', async () => {
    checkVersionAndClearCache();
    loadSettings();
    await detectAvatars();
    
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => { splash.style.display = 'none'; initQA(); }, 400);
        } else initQA();
    }, 600);
});

function checkVersionAndClearCache() {
    const saved = localStorage.getItem('deerAppSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            if (!parsed.version || parsed.version !== CURRENT_APP_VERSION) localStorage.removeItem('deerAppSettings');
        } catch(e) { localStorage.removeItem('deerAppSettings'); }
    }
}

window.nukeAndReload = function() {
    localStorage.clear(); sessionStorage.clear();
    window.location.reload(true); 
};

window.switchTab = function(tabId, btn) {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
    document.querySelector('.scrollable-content').scrollTo({ top: 0, behavior: 'smooth' });
};

/* ================== 2. 設定管理 ================== */
window.toggleSettings = function() {
    const modal = document.getElementById('settings-modal');
    const content = document.getElementById('settings-content');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden'); void modal.offsetWidth; 
        modal.classList.remove('opacity-0'); content.classList.remove('scale-95');
    } else {
        modal.classList.add('opacity-0'); content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

function loadSettings() {
    const saved = localStorage.getItem('deerAppSettings');
    if (saved) {
        appSettings = JSON.parse(saved);
        document.getElementById('qa-per-page-slider').value = appSettings.qaPerPage;
        document.getElementById('qa-count-display').innerText = `${appSettings.qaPerPage} 題`;
    }
}

window.updateQASetting = function(val) {
    appSettings.qaPerPage = parseInt(val);
    document.getElementById('qa-count-display').innerText = `${val} 題`;
    localStorage.setItem('deerAppSettings', JSON.stringify(appSettings));
    currentPage = 1; renderQA(1);
};

/* ================== 3. QA 渲染 ================== */
let currentPage = 1;
let filteredQA = [...qaData];

function initQA() { if (qaData.length > 0) renderQA(1); }

window.filterQA = function() {
    const term = document.getElementById('qa-search').value.toLowerCase();
    if (!term) filteredQA = [...qaData];
    else filteredQA = qaData.filter(item => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term));
    currentPage = 1; renderQA(currentPage);
};

function renderQA(page) {
    const list = document.getElementById('qa-list');
    const controls = document.getElementById('pagination-controls');
    list.innerHTML = '';
    
    if (filteredQA.length === 0) {
        list.innerHTML = '<div class="text-center text-slate-500 py-10 text-sm">找不到相關問題</div>';
        controls.innerHTML = ''; return;
    }

    const totalPages = Math.ceil(filteredQA.length / appSettings.qaPerPage);
    const start = (page - 1) * appSettings.qaPerPage;
    const currentItems = filteredQA.slice(start, start + appSettings.qaPerPage);

    currentItems.forEach((item, index) => {
        const num = String(start + index + 1).padStart(2, '0');
        list.innerHTML += `
            <div class="glass-panel hover-glass p-5 flex flex-col justify-between cursor-pointer group" onclick="Swal.fire({title:'解答', text:'${item.a}', background:'#18181b', color:'#fff', confirmButtonColor:'#f43f5e', customClass:{title:'text-pink-500', popup:'rounded-3xl border border-slate-700'}})">
                <div class="flex justify-between items-start mb-2">
                   <div class="w-6 h-6 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center font-black text-xs">Q</div>
                   <div class="text-slate-500 text-[9px] font-black tracking-widest">#${num}</div>
                </div>
                <h3 class="text-sm font-bold text-white mb-3 line-clamp-2 leading-relaxed">${item.q}</h3>
                <div class="text-right mt-auto transition-transform group-hover:translate-x-1">
                   <span class="text-[9px] font-bold text-slate-500 tracking-widest">查看答案 <i class="fas fa-chevron-right ml-1"></i></span>
                </div>
            </div>
        `;
    });

    controls.innerHTML = `
        <button onclick="changePage(-1)" class="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 text-white rounded-full hover:bg-pink-500 transition disabled:opacity-20" ${page === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left text-xs"></i></button>
        <span class="text-slate-400 font-black text-[10px] tracking-[0.2em]">PAGE ${page} / ${totalPages}</span>
        <button onclick="changePage(1)" class="w-8 h-8 flex items-center justify-center bg-white/5 border border-white/10 text-white rounded-full hover:bg-pink-500 transition disabled:opacity-20" ${page === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right text-xs"></i></button>
    `;
}

window.changePage = function(delta) {
    currentPage += delta; renderQA(currentPage);
    document.querySelector('.scrollable-content').scrollTo({ top: 0, behavior: 'smooth' });
};

/* ================== 4. AI 麋鹿 ================== */
window.handleAIKeyPress = function(e) { if (e.key === 'Enter') sendAIMessage(); };

window.sendAIMessage = function() {
    const inputEl = document.getElementById('ai-input');
    const text = inputEl.value.trim();
    if (!text) return;

    const chat = document.getElementById('chat-window');
    chat.innerHTML += `<div class="max-w-[85%] self-end glass-panel p-3 shadow-lg text-sm leading-relaxed border border-pink-500/30 bg-[#2d1b2e] ml-auto text-right">${text}</div>`;
    inputEl.value = '';
    chat.scrollTop = chat.scrollHeight;

    const bestMatch = findBestMatch(text);
    setTimeout(() => {
        let reply = (bestMatch.score > 0.15) 
            ? `根據搜尋：<br><b class="text-pink-400 mt-1 block text-sm">${bestMatch.item.a}</b>`
            : "這個超出了我的資料庫範圍喔！下次直播問鹿吧🦌";
        chat.innerHTML += `<div class="max-w-[85%] self-start glass-panel p-3 shadow-lg text-sm leading-relaxed border border-white/5 bg-white/5 animate__animated animate__fadeInUp">${reply}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }, 600 + Math.random() * 500); 
};

function findBestMatch(userInput) {
    let best = { item: null, score: 0 };
    const nGrams = (str) => {
        const grams = [];
        if (str.length === 1) return [str];
        for (let i = 0; i < str.length - 1; i++) grams.push(str.substring(i, i + 2));
        return grams;
    };
    const inputGrams = nGrams(userInput.toLowerCase());
    qaData.forEach(row => {
        const targetGrams = nGrams(row.q.toLowerCase() + " " + row.a.toLowerCase());
        let matches = 0;
        inputGrams.forEach(ig => { if (targetGrams.includes(ig)) matches++; });
        const score = matches / Math.max(inputGrams.length, 1);
        if (score > best.score) best = { item: row, score: score };
    });
    return best;
}

/* ================== 5. 照片自動探測 ================== */
let detectedAvatars = [];
let selectedAvatarId = 0;

async function detectAvatars() {
    const grid = document.getElementById('avatar-selection-grid');
    for (let i = 1; i <= 9; i++) {
        let url = `avatar-card${i}.jpg`;
        let exists = await new Promise(r => { let img = new Image(); img.onload=()=>r(true); img.onerror=()=>r(false); img.src=url; });
        if (exists) detectedAvatars.push(url); else break; 
    }
    grid.innerHTML = '';
    if (detectedAvatars.length === 0) {
        grid.innerHTML = '<p class="col-span-3 text-slate-500 text-xs py-2">查無照片，請放置 avatar-card1.jpg</p>'; return;
    }
    detectedAvatars.forEach((url, idx) => {
        grid.innerHTML += `
            <div class="avatar-option aspect-[3/4] rounded-xl cursor-pointer border-2 ${idx===0 ? 'border-pink-500 opacity-100' : 'border-transparent opacity-40'} overflow-hidden relative transition" onclick="selectAvatar(this, ${idx})">
                <img src="${url}" class="w-full h-full object-cover pointer-events-none">
                <div class="icon-check absolute inset-0 bg-black/40 ${idx===0 ? 'flex' : 'hidden'} items-center justify-center"><i class="fas fa-check text-white text-xl"></i></div>
            </div>`;
    });
}

window.selectAvatar = function(el, idx) {
    selectedAvatarId = idx;
    document.querySelectorAll('.avatar-option').forEach(d => {
        d.classList.remove('border-pink-500', 'opacity-100'); d.classList.add('border-transparent', 'opacity-40');
        d.querySelector('.icon-check').classList.replace('flex','hidden');
    });
    el.classList.remove('border-transparent', 'opacity-40'); el.classList.add('border-pink-500', 'opacity-100');
    el.querySelector('.icon-check').classList.replace('hidden','flex');
};

/* ================== 6. 頂級精美 Canvas 渲染引擎 ================== */

// 畫圓角矩形工具
function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath(); ctx.moveTo(x+r, y); ctx.lineTo(x+w-r, y); ctx.quadraticCurveTo(x+w, y, x+w, y+r);
    ctx.lineTo(x+w, y+h-r); ctx.quadraticCurveTo(x+w, y+h, x+w-r, y+h); ctx.lineTo(x+r, y+h);
    ctx.quadraticCurveTo(x, y+h, x, y+h-r); ctx.lineTo(x, y+r); ctx.quadraticCurveTo(x, y, x+r, y); ctx.closePath();
}

window.generateIDCard = function() {
    if(detectedAvatars.length === 0) { Swal.fire('錯誤', '沒有找到照片！', 'error'); return; }
    const nameInput = document.getElementById('id-name').value.trim() || "神秘麋鹿";
    const canvas = document.getElementById('id-canvas'); const ctx = canvas.getContext('2d');
    
    // 1. 深色科技背景
    ctx.fillStyle = '#0a0a0c'; ctx.fillRect(0, 0, 1080, 1350);
    const grad = ctx.createLinearGradient(0, 0, 1080, 1350);
    grad.addColorStop(0, 'rgba(244, 63, 94, 0.15)'); grad.addColorStop(1, 'rgba(139, 92, 246, 0.05)');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350);

    // 2. 裝飾網格與光暈
    ctx.strokeStyle = 'rgba(255,255,255,0.03)'; ctx.lineWidth = 2;
    for(let i=0; i<1080; i+=60) { ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,1350); ctx.stroke(); }
    for(let i=0; i<1350; i+=60) { ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(1080,i); ctx.stroke(); }

    // 3. 卡片主體與外框 (玻璃透視感)
    ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 20;
    ctx.fillStyle = '#121218'; roundRect(ctx, 80, 80, 920, 1190, 60); ctx.fill();
    ctx.shadowColor = 'transparent'; // 重置陰影
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)'; ctx.lineWidth = 4; roundRect(ctx, 80, 80, 920, 1190, 60); ctx.stroke();

    // 4. 照片處理
    const img = new Image(); img.crossOrigin = "Anonymous"; img.src = detectedAvatars[selectedAvatarId];
    img.onload = () => {
        ctx.save();
        roundRect(ctx, 140, 140, 800, 750, 40); ctx.clip();
        ctx.drawImage(img, 140, 140, 800, 750);
        ctx.restore();

        // 照片內發光邊框
        ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 6; roundRect(ctx, 140, 140, 800, 750, 40); ctx.stroke();

        // 5. 高質感文字排版
        ctx.textAlign = "center";
        
        // 標題
        ctx.fillStyle = '#f43f5e'; ctx.font = '900 42px "Segoe UI", sans-serif'; ctx.letterSpacing = "8px";
        ctx.fillText('OFFICIAL DEER FAN', 540, 1000);
        
        // 名字 (帶發光效果)
        ctx.shadowColor = 'rgba(255,255,255,0.3)'; ctx.shadowBlur = 20;
        ctx.fillStyle = '#ffffff'; ctx.font = '900 90px "Segoe UI", "PingFang TC", sans-serif'; ctx.letterSpacing = "0px";
        ctx.fillText(nameInput, 540, 1120);
        ctx.shadowColor = 'transparent';

        // 底部 ID
        const dateStr = new Date().toISOString().split('T')[0];
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 28px monospace';
        ctx.fillText(`ID: 8${Date.now().toString().slice(-5)} | DATE: ${dateStr}`, 540, 1210);

        document.getElementById('id-result-img').src = canvas.toDataURL('image/jpeg', 0.95);
        document.getElementById('id-result-area').classList.remove('hidden');
    };
};

/* ================== 7. 會考系統 ================== */
let currentQuiz = [], currentQIndex = 0, score = 0, quizPlayerName = "";

window.startQuiz = function() {
    quizPlayerName = document.getElementById('quiz-player-name').value.trim();
    if(!quizPlayerName) { Swal.fire('提示', '請輸入名字！', 'warning'); return; }
    document.getElementById('quiz-intro').classList.add('hidden'); document.getElementById('quiz-area').classList.remove('hidden');
    currentQuiz = [...quizData].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQIndex = 0; score = 0; renderQuizQuestion();
};

function renderQuizQuestion() {
    if (currentQIndex >= 10) { endQuiz(); return; }
    const qData = currentQuiz[currentQIndex];
    document.getElementById('quiz-progress').innerText = `Q ${currentQIndex + 1}/10`;
    document.getElementById('quiz-score').innerText = `SCORE: ${score}`;
    document.getElementById('quiz-question').innerText = `Q: ${qData.q}`;

    const optsContainer = document.getElementById('quiz-options'); optsContainer.innerHTML = '';
    [...qData.options].sort(() => 0.5 - Math.random()).forEach(opt => {
        const isCorrect = (opt === qData.a);
        optsContainer.innerHTML += `<button onclick="answerQuiz(this, ${isCorrect})" class="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10 transition font-bold text-sm text-white">${opt}</button>`;
    });
}

window.answerQuiz = function(btn, isCorrect) {
    document.getElementById('quiz-options').querySelectorAll('button').forEach(b => b.disabled = true);
    if (isCorrect) {
        btn.className = "w-full text-left bg-green-600/30 border border-green-500 text-green-400 p-4 rounded-xl font-black text-sm"; score += 10;
    } else {
        btn.className = "w-full text-left bg-red-600/30 border border-red-500 text-red-400 p-4 rounded-xl font-bold text-sm";
        document.getElementById('quiz-options').querySelectorAll('button').forEach(b => {
            if (b.innerText.trim() === currentQuiz[currentQIndex].a) b.className = "w-full text-left bg-green-600/30 border border-green-500 text-green-400 p-4 rounded-xl font-bold text-sm";
        });
    }
    document.getElementById('quiz-score').innerText = `SCORE: ${score}`;
    setTimeout(() => { currentQIndex++; renderQuizQuestion(); }, 1000);
};

function endQuiz() {
    let title = score >= 90 ? "鹿的終極守護者" : score >= 60 ? "鐵桿麋鹿" : "新手麋鹿";
    generateQuizResultImage(title);
    document.getElementById('quiz-area').classList.add('hidden');
}

window.generateQuizResultImage = function(title) {
    const canvas = document.getElementById('quiz-canvas'); const ctx = canvas.getContext('2d');
    
    // 深藍電競背景
    ctx.fillStyle = '#060b19'; ctx.fillRect(0, 0, 1080, 1350);
    const grad = ctx.createRadialGradient(540, 600, 100, 540, 600, 800);
    grad.addColorStop(0, 'rgba(59, 130, 246, 0.2)'); grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1350);

    // 外框
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.4)'; ctx.lineWidth = 8; roundRect(ctx, 50, 50, 980, 1250, 50); ctx.stroke();

    ctx.textAlign = "center";
    
    ctx.fillStyle = '#ffffff'; ctx.font = '900 65px "Segoe UI", sans-serif';
    ctx.fillText('麋鹿大會考 戰績認證', 540, 250);
    
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText(`挑戰者：${quizPlayerName}`, 540, 350);

    // 分數發光特效
    ctx.shadowColor = 'rgba(236, 72, 153, 0.8)'; ctx.shadowBlur = 50;
    ctx.fillStyle = '#f43f5e'; ctx.font = '900 350px "Segoe UI", sans-serif';
    ctx.fillText(`${score}`, 540, 750);
    ctx.shadowColor = 'transparent';
    
    ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 45px "Segoe UI", sans-serif';
    ctx.fillText(`最終稱號`, 540, 950);
    
    // 稱號金色漸層
    const textGrad = ctx.createLinearGradient(0, 980, 0, 1080);
    textGrad.addColorStop(0, '#fbbf24'); textGrad.addColorStop(1, '#f59e0b');
    ctx.fillStyle = textGrad; ctx.font = '900 85px "Segoe UI", sans-serif';
    ctx.fillText(`🏆 ${title}`, 540, 1060);

    ctx.fillStyle = '#475569'; ctx.font = 'bold 24px monospace';
    ctx.fillText(`ISSUED: ${new Date().toISOString().split('T')[0]} | APP v8.2`, 540, 1220);

    document.getElementById('quiz-result-img').src = canvas.toDataURL('image/jpeg', 0.95);
    document.getElementById('quiz-result-area').classList.remove('hidden');
};