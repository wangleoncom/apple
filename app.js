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
        let