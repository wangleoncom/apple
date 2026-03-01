/* ==========================================================================
   老王 QA 粉絲站 v12.0 - 終極四核心 AI 引擎 (具備記憶、無縫備援與全域溯源)
   ========================================================================== */

// 1. Google Gemini 金鑰 (主核心) - 滿血復活版！ (強烈建議未來移至後端)
const geminiPart1 = "AIzaSy"; 
const geminiPart2 = "CREZ3jlL-2kq0gO9Om4WVtLZw0NrVsISA"; 
const GEMINI_KEY = geminiPart1 + geminiPart2;

// 2. Groq 金鑰 (副核心 - Llama 3.1)
const groqPart1 = "gsk_"; 
const groqPart2 = "8qNnAGhigu5qBCjjhXQQWGdyb3FYse4p4uoPx4VFjTdFabH9wGPn"; 
const GROQ_KEY = groqPart1 + groqPart2;

// 3. Cohere 金鑰 (第三防線 - Command R)
const coherePart1 = "frvOfi4zljbyxwdS23";
const coherePart2 = "uew64ToVRlcncLSBmFpdxG";
const COHERE_KEY = coherePart1 + coherePart2;

// 4. Hugging Face 金鑰 (第四防線 - Mistral)
const hfPart1 = "hf_";
const hfPart2 = "dzazvhipXumdDutlvmsRxniMYdgibzoDxT";
const HF_KEY = hfPart1 + hfPart2;

/* ========================================================================== */

const qaData = window.QA_DB || window.wangQuiz_DB || []; 
const quizData = window.QUIZ_DB || window.wangQuiz_DB || [];

let appSettings = { exp: 0, qaPerPage: 6, soundOn: true, lastCheckIn: "" };
const WATERMARK_TEXT = "老王專屬秘密基地";

// === 基地公告資料庫 ===
const announcementsData = [
    {
        id: "announce-001",
        title: "注意！TikTok「小鬼瓶」為假冒帳號",
        date: "2026-03-01",
        type: "warning", 
        isPinned: true,  
        summary: "近期發現有人盜用老王的影片，並且主動私訊粉絲請求捐款，請粉絲們務必提高警覺，切勿上當受騙。",
        image: "img1.jpg", 
        content: `
            <div class="text-left space-y-4 text-sm text-zinc-300 mt-2">
                <p>近期我們發現 TikTok 帳號 <span class="text-sky-500 font-bold bg-sky-500/10 px-1 rounded">@epigdynm（暱稱：小鬼瓶）</span> 嚴重冒用老王的名義與粉絲互動，甚至有私訊粉絲要求捐款的行為。</p>
                <div class="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl">
                    <p class="text-red-400 font-black tracking-wide">請各位粉絲務必提高警覺，該帳號絕對不是老王本人！</p>
                </div>
                <p>老王的唯一本人 TikTok 帳號為 <a href="https://www.tiktok.com/@z.knccc" target="_blank" class="text-sky-500 underline underline-offset-4 font-bold">@z.knccc</a>，如果可以的話請大家協助檢舉假帳號，保護彼此的資訊安全。</p>
            </div>
        `
    }
];

const PremiumSwal = Swal.mixin({
    background: 'rgba(15, 15, 15, 0.85)',
    color: '#fff',
    backdrop: `rgba(0,0,0,0.6) backdrop-filter: blur(8px)`,
    customClass: {
        popup: 'border border-[#333] rounded-3xl shadow-[0_20px_60px_-15px_rgba(56,189,248,0.2)] backdrop-blur-xl',
        confirmButton: 'bg-gradient-to-r from-sky-600 to-sky-500 text-white font-black rounded-xl px-6 py-2.5 shadow-[0_5px_15px_rgba(56,189,248,0.3)] hover:scale-105 transition-transform w-full',
        cancelButton: 'bg-[#222] text-zinc-300 font-bold rounded-xl px-6 py-2.5 hover:bg-[#333] transition-colors',
        title: 'text-xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-sky-200 to-sky-500',
        htmlContainer: 'text-sm text-zinc-300 leading-relaxed'
    }
});

document.addEventListener('DOMContentLoaded', () => {
    loadSettings(); 
    updateExpUI();
    renderAnnouncements(); 
    renderAISuggestions();

    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => { 
                splash.style.display = 'none'; 
                initQA(); 
                document.getElementById('page-home').classList.add('active');
            }, 700);
        } else { initQA(); }
    }, 1200);
});

// === 公告系統渲染邏輯 ===
function renderAnnouncements() {
    const homeContainer = document.getElementById('home-pinned-announcements');
    const pageContainer = document.getElementById('announcements-list');
    
    let homeHTML = ''; let pageHTML = '';

    announcementsData.forEach(item => {
        const isWarning = item.type === 'warning';
        const colorClass = isWarning ? 'red-500' : 'sky-500';
        const iconClass = isWarning ? 'fa-triangle-exclamation' : 'fa-circle-info';
        const tagText = isWarning ? '重要公告' : '基地資訊';

        const cardHTML = `
            <div class="premium-card p-5 md:p-6 border-l-4 border-l-${colorClass} relative overflow-hidden group cursor-pointer hover:bg-[#111] transition-all duration-300" onclick="openAnnouncement('${item.id}')">
                <div class="absolute top-0 right-0 w-32 h-32 bg-${colorClass}/10 rounded-full blur-3xl group-hover:bg-${colorClass}/20 transition-all duration-500"></div>
                <div class="flex flex-col md:flex-row items-start gap-4 relative z-10">
                    <div class="w-12 h-12 rounded-full bg-${colorClass}/20 flex items-center justify-center flex-shrink-0 border border-${colorClass}/30 shadow-[0_0_15px_rgba(${isWarning ? '239,68,68' : '56,189,248'},0.3)] group-hover:scale-110 transition-transform">
                        <i class="fa-solid ${iconClass} text-${colorClass} text-lg"></i>
                    </div>
                    <div class="flex-1 w-full">
                        <div class="flex items-center gap-3 mb-2 flex-wrap">
                            <span class="bg-${colorClass} text-${isWarning ? 'white' : 'black'} text-[10px] font-black px-2 py-1 rounded tracking-widest">${tagText}</span>
                            ${item.isPinned ? `<span class="text-[10px] text-zinc-400 font-mono bg-[#111] px-2 py-1 rounded border border-[#333]"><i class="fa-solid fa-thumbtack mr-1"></i>置頂</span>` : ''}
                            <span class="text-[10px] text-zinc-500 font-mono ml-auto">${item.date}</span>
                        </div>
                        <h4 class="text-base font-black text-white mb-2 tracking-wide group-hover:text-${colorClass} transition-colors">${item.title}</h4>
                        <p class="text-sm text-zinc-400 leading-relaxed font-medium line-clamp-2">${item.summary}</p>
                    </div>
                </div>
            </div>`;
        if (item.isPinned) { homeHTML += cardHTML; }
        pageHTML += cardHTML;
    });

    if (homeHTML) {
        homeContainer.innerHTML = `<h3 class="text-sm font-bold text-zinc-400 mb-4 tracking-widest pl-2 flex items-center"><i class="fa-solid fa-bullhorn text-red-500 mr-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></i> 基地最新通報</h3><div class="space-y-4">${homeHTML}</div>`;
    } else { homeContainer.innerHTML = ''; }
    if (pageHTML) { pageContainer.innerHTML = pageHTML; } else { pageContainer.innerHTML = `<div class="text-center text-zinc-500 py-12 text-sm bg-[#0a0a0a] rounded-2xl border border-[#222]">目前無任何基地公告</div>`; }
}

window.openAnnouncement = function(id) {
    playClickSound();
    const data = announcementsData.find(item => item.id === id);
    if (!data) return;
    const isWarning = data.type === 'warning';
    const colorClass = isWarning ? 'red-500' : 'sky-500';
    let imageHTML = data.image ? `<img src="${data.image}" class="w-full rounded-xl border border-[#333] mb-4 shadow-lg object-cover" onerror="this.style.display='none'">` : '';

    PremiumSwal.fire({
        title: `<div class="text-${colorClass} text-lg mb-1"><i class="fa-solid ${isWarning ? 'fa-triangle-exclamation' : 'fa-bullhorn'}"></i></div>${data.title}`,
        html: `<div class="mt-2 mb-4 text-xs text-zinc-500 font-mono tracking-widest">${data.date} 發布</div>${imageHTML}<div class="border-t border-[#222] pt-4">${data.content}</div>`,
        confirmButtonText: '已了解狀況', confirmButtonColor: isWarning ? '#ef4444' : '#0ea5e9'
    });
};

function playClickSound() {
    if(!appSettings.soundOn) return;
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05); } catch(e) {}
}

function playSuccessSound() {
    if(!appSettings.soundOn) return;
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'triangle'; osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4); } catch(e) {}
}

let currentAIEngine = 'groq'; 
window.addEventListener('load', () => { document.getElementById('ai-engine-selector').value = 'groq'; });

window.switchAIEngine = function(engine) {
    currentAIEngine = engine;
    playClickSound();
    let engineName = engine === 'auto' ? "自動備援模式" : engine === 'gemini' ? "主核 Gemini 2.5" : engine === 'groq' ? "極速 Groq (Llama 3.1)" : engine === 'cohere' ? "三核 Cohere" : engine === 'hf' ? "四核 Hugging Face" : "純離線比對模式";
    PremiumSwal.fire({ title: '<i class="fa-solid fa-microchip text-sky-500"></i> 引擎切換成功', html: `<div class="text-zinc-300 text-sm mt-2">已將 AI 核心強制切換為：<br><b class="text-sky-400 text-base block mt-2">${engineName}</b></div>`, showConfirmButton: false, timer: 1500 });
};

window.toggleSettings = function() {
    playClickSound();
    const modal = document.getElementById('settings-modal'); const content = document.getElementById('settings-content');
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden'); modal.classList.add('flex');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
    } else {
        modal.classList.add('opacity-0'); content.classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
    }
};

function loadSettings() {
    const saved = localStorage.getItem('wangAppConfig_V29');
    if (saved) { try { appSettings = JSON.parse(saved); } catch (e) {} }
    if(typeof appSettings.soundOn !== 'boolean') appSettings.soundOn = true;
    document.getElementById('sound-toggle').checked = appSettings.soundOn;
    document.getElementById('qa-per-page-slider').value = appSettings.qaPerPage || 6;
    document.getElementById('qa-count-display').innerText = `${appSettings.qaPerPage || 6} 題`;
}

window.saveSettings = function() {
    appSettings.soundOn = document.getElementById('sound-toggle').checked;
    localStorage.setItem('wangAppConfig_V29', JSON.stringify(appSettings));
    playClickSound();
}

window.updateQASetting = function(val) {
    appSettings.qaPerPage = parseInt(val); document.getElementById('qa-count-display').innerText = `${val} 題`;
    saveSettings(); currentPage = 1; renderQA(1);
}

window.showChangelog = function() {
    playClickSound();
    PremiumSwal.fire({ title: '<i class="fa-solid fa-code-commit text-sky-500 mr-3 drop-shadow-md"></i><span class="tracking-widest font-black">系統日誌</span>', html: `<div class="text-left text-sm leading-relaxed space-y-4 mt-4 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]"><div><b class="text-sky-400 font-black tracking-widest text-base drop-shadow-md">v12.0 - 終極四核心架構上線</b><br><span class="text-zinc-400 mt-1.5 inline-block">導入 Gemini, Groq, Cohere, HF 四重備援引擎，並賦予 AI 大腦前後文記憶功能。手動切換與沉浸式離線系統已實裝。本地推論引擎全面升級，支援語意理解。</span></div></div>`});
}

window.switchTab = function(tabId, btn) {
    playClickSound();
    document.querySelectorAll('.page').forEach(sec => { sec.classList.remove('active'); sec.style.display = 'none'; });
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    const targetPage = document.getElementById(tabId);
    targetPage.style.display = 'block'; void targetPage.offsetWidth; targetPage.classList.add('active');
    btn.classList.add('active'); window.scrollTo({ top: 0, behavior: 'smooth' });
    if(tabId === 'page-timeline') initTimelineAnimation();
};

function showFloatingExp(amount) {
    const el = document.createElement('div'); el.innerText = `+${amount} EXP`;
    el.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sky-500 font-black text-2xl z-[9999] pointer-events-none drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]';
    el.style.animation = 'floatUpFade 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
}

function gainExp(amount, silent = false) {
    appSettings.exp = (appSettings.exp || 0) + amount;
    localStorage.setItem('wangAppConfig_V29', JSON.stringify(appSettings)); updateExpUI();
    if(!silent && amount > 0) { if(appSettings.soundOn) playSuccessSound(); showFloatingExp(amount); }
}

function updateExpUI() {
    let level = 1, title = "訪客", nextExp = 50; const exp = appSettings.exp || 0;
    if(exp >= 2000) { level = 6, title = "傳說中的狂粉", nextExp = 2000; }
    else if(exp >= 800) { level = 5; title = "皇家護衛", nextExp = 2000; }
    else if(exp >= 300) { level = 4; title = "核心幹部", nextExp = 800; }
    else if(exp >= 100) { level = 3; title = "死忠鐵粉", nextExp = 300; }
    else if(exp >= 30) { level = 2; title = "初階粉絲", nextExp = 100; }
    
    const titleEl = document.getElementById('level-title'); if(titleEl) titleEl.innerText = `LV.${level} ${title}`;
    document.getElementById('exp-text').innerText = `${exp} / ${nextExp} EXP`;
    document.getElementById('exp-bar').style.width = level === 6 ? '100%' : `${Math.min(100, (exp / nextExp) * 100)}%`;
}

window.dailyCheckIn = function() {
    playClickSound(); const today = new Date().toDateString();
    if(appSettings.lastCheckIn === today) { PremiumSwal.fire({ title: '已完成簽到', text: '今日能量已補充，請明天再來！', icon: 'info' }); return; }
    appSettings.lastCheckIn = today; gainExp(30);
    PremiumSwal.fire({ title: '簽到成功', html: `<div class="text-3xl text-sky-500 font-black my-4 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">+30 EXP</div><p>保持活躍，解鎖更高階粉絲頭銜！</p>`, icon: 'success' });
}

window.gachaQuote = function() {
    playClickSound();
    if(appSettings.exp < 20) { PremiumSwal.fire({ title: '能量不足', text: '每次抽卡需消耗 20 EXP，快去互動累積吧！', icon: 'warning' }); return; }
    gainExp(-20, true); playSuccessSound();
    const isSSR = Math.random() > 0.8; const randomQuote = qaData.length > 0 ? qaData[Math.floor(Math.random() * qaData.length)] : { q: "系統隱藏彩蛋", a: "永遠支持老王，不離不棄！" };
    const cardBorder = isSSR ? 'border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)]' : 'border-[#333] shadow-lg';
    const rarityLabel = isSSR ? '<span class="bg-gradient-to-r from-sky-300 to-sky-600 text-white px-3 py-1 rounded shadow-lg animate-pulse">SSR 絕密語錄</span>' : '<span class="bg-[#222] text-zinc-400 border border-[#444] px-3 py-1 rounded">R 級資訊</span>';
    PremiumSwal.fire({ title: '✨ 專屬資料卡解鎖', html: `<div class="bg-gradient-to-br from-[#1a1a1a] to-[#050505] border-2 ${cardBorder} p-8 rounded-2xl mt-4 relative overflow-hidden text-left transform transition-transform hover:scale-105 duration-300"><div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 transform -skew-x-12 -translate-x-full animate-[shine_3s_infinite]"></div><div class="text-[10px] font-black mb-5 tracking-widest">${rarityLabel}</div><div class="text-base font-black text-white mb-3 tracking-wide">${randomQuote.q}</div><div class="text-sm text-zinc-400 leading-relaxed font-medium pl-3 border-l-2 border-sky-500/50">${randomQuote.a}</div></div>`, confirmButtonText: '收入資料庫' });
}

// === QA 系統 ===
let currentPage = 1; let filteredQA = [...qaData];
function initQA() { if (qaData.length > 0) renderQA(1); }
window.handleSearchInput = function() {
    const term = document.getElementById('qa-search').value.toLowerCase();
    if(!term) { filteredQA = [...qaData]; renderQA(1); return; }
    filteredQA = qaData.filter(item => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term));
    currentPage = 1; renderQA(currentPage);
}
window.renderQA = function(page) {
    const list = document.getElementById('qa-list'); const controls = document.getElementById('pagination-controls'); list.innerHTML = '';
    if (filteredQA.length === 0) { list.innerHTML = '<div class="col-span-1 md:col-span-2 text-center text-zinc-500 py-12 text-sm bg-[#0a0a0a] rounded-2xl border border-[#222]"><i class="fa-solid fa-ghost text-3xl mb-3 block opacity-50"></i>資料庫未尋獲相關紀錄</div>'; controls.innerHTML = ''; return; }
    const perPage = appSettings.qaPerPage || 6; const totalPages = Math.ceil(filteredQA.length / perPage); const start = (page - 1) * perPage; const currentItems = filteredQA.slice(start, start + perPage);
    currentItems.forEach((item, index) => {
        const delay = index * 0.05;
        list.innerHTML += `<div class="premium-card p-6 cursor-pointer flex flex-col justify-between group hover:bg-[#111] transition-all duration-300" style="animation: cinematicReveal 0.5s ease backwards; animation-delay: ${delay}s;" onclick="showAnswer(event, '${item.a.replace(/'/g, "\\'")}')"><div class="flex items-center gap-3 mb-4"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-[#333] to-[#111] border border-sky-500/30 text-sky-500 flex items-center justify-center font-black text-[11px] shadow-[0_0_10px_rgba(56,189,248,0.1)] group-hover:scale-110 transition-transform">Q</div></div><h3 class="font-bold text-white text-sm pr-8 leading-relaxed group-hover:text-sky-400 transition-colors">${item.q}</h3><button onclick="openQAShare(event, '${item.q.replace(/'/g, "\\'")}', '${item.a.replace(/'/g, "\\'")}')" class="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-[#111] text-zinc-500 hover:text-white hover:bg-sky-500 hover:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all flex items-center justify-center"><i class="fa-solid fa-share-nodes text-xs"></i></button></div>`;
    });
    controls.innerHTML = `<button onclick="changePageTo(1)" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-zinc-500 disabled:opacity-30 hover:bg-[#222] hover:text-white flex items-center justify-center transition-all hover:shadow-lg" ${page === 1 ? 'disabled' : ''}><i class="fa-solid fa-angles-left text-xs"></i></button><button onclick="changePageTo(${page - 1})" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-white disabled:opacity-30 hover:bg-[#222] flex items-center justify-center transition-all hover:shadow-lg hover:-translate-x-1" ${page === 1 ? 'disabled' : ''}><i class="fa-solid fa-angle-left text-sm"></i></button><span class="text-zinc-400 font-bold text-xs px-4 bg-[#111]/50 py-2 rounded-xl border border-[#222]">第 <span class="text-sky-500">${page}</span> 頁 / 共 ${totalPages} 頁</span><button onclick="changePageTo(${page + 1})" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-white disabled:opacity-30 hover:bg-[#222] flex items-center justify-center transition-all hover:shadow-lg hover:translate-x-1" ${page === totalPages ? 'disabled' : ''}><i class="fa-solid fa-angle-right text-sm"></i></button><button onclick="changePageTo(${totalPages})" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-zinc-500 disabled:opacity-30 hover:bg-[#222] hover:text-white flex items-center justify-center transition-all hover:shadow-lg" ${page === totalPages ? 'disabled' : ''}><i class="fa-solid fa-angles-right text-xs"></i></button>`;
}
window.changePageTo = function(p) { playClickSound(); currentPage = p; renderQA(p); window.scrollTo({top: document.getElementById('qa-search').offsetTop - 20, behavior: 'smooth'});}
window.showAnswer = function(e, ans) { if(e.target.closest('button')) return; playClickSound(); gainExp(2, true); PremiumSwal.fire({ html: `<div class="text-left"><div class="text-xs text-sky-500 font-black mb-3 flex items-center gap-2"><i class="fa-solid fa-database"></i> 解答存取完畢</div><div class="text-base text-white leading-relaxed font-medium">${ans}</div></div>`, showConfirmButton: false, timer: 4000, timerProgressBar: true }); }
window.openQAShare = function(e, q, a) { e.stopPropagation(); playClickSound(); PremiumSwal.fire({ title: '資料匯出協定', html: `<div class="grid grid-cols-2 gap-4 mt-6"><button onclick="copyQAText('${q.replace(/'/g, "\\'")}','${a.replace(/'/g, "\\'")}')" class="bg-[#111] border border-[#333] py-5 rounded-2xl text-sm font-black text-white hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all flex flex-col items-center gap-3 group"><i class="fa-solid fa-copy text-2xl text-zinc-500 group-hover:text-sky-500 transition-colors"></i>純文字拷貝</button><button onclick="renderQAImage('${q.replace(/'/g, "\\'")}','${a.replace(/'/g, "\\'")}')" class="bg-gradient-to-br from-zinc-200 to-white text-black py-5 rounded-2xl text-sm font-black hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all flex flex-col items-center gap-3"><i class="fa-solid fa-image text-2xl"></i>渲染高畫質圖卡</button></div>`, showConfirmButton: false }); };
window.copyQAText = function(q, a) { navigator.clipboard.writeText(`Q: ${q}\nA: ${a}\n\n來自 ${WATERMARK_TEXT}`); PremiumSwal.fire({ title: '拷貝成功', icon: 'success', timer: 1500, showConfirmButton: false }); };
window.renderQAImage = function(q, a) {
    const canvas = document.getElementById('qa-canvas'); const ctx = canvas.getContext('2d');
    const grad = ctx.createLinearGradient(0, 0, 1080, 1080); grad.addColorStop(0, '#1a1a1a'); grad.addColorStop(0.5, '#050505'); grad.addColorStop(1, '#000000'); ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1080);
    const glow = ctx.createRadialGradient(1080, 0, 0, 1080, 0, 600); glow.addColorStop(0, 'rgba(56, 189, 248, 0.15)'); glow.addColorStop(1, 'transparent'); ctx.fillStyle = glow; ctx.fillRect(0,0,1080,1080);
    ctx.fillStyle = 'rgba(20, 20, 20, 0.8)'; ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.roundRect(80, 100, 920, 800, 40); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.roundRect(95, 115, 890, 770, 25); ctx.stroke();
    function wrapText(context, text, x, y, maxWidth, lineHeight) { let words = text.split(''); let line = ''; let currentY = y; for(let n = 0; n < words.length; n++) { let testLine = line + words[n]; let metrics = context.measureText(testLine); if (metrics.width > maxWidth && n > 0) { context.fillText(line, x, currentY); line = words[n]; currentY += lineHeight; } else { line = testLine; } } context.fillText(line, x, currentY); }
    ctx.textAlign = "left"; ctx.fillStyle = '#38bdf8'; ctx.font = '900 60px "SF Pro Display", sans-serif'; ctx.fillText('Q.', 140, 220); ctx.fillStyle = '#ffffff'; ctx.font = 'bold 55px "PingFang TC", sans-serif'; wrapText(ctx, q, 230, 220, 700, 75);
    ctx.fillStyle = 'rgba(255,255,255,0.05)'; ctx.fillRect(140, 450, 800, 2);
    ctx.fillStyle = '#555'; ctx.font = '900 60px "SF Pro Display", sans-serif'; ctx.fillText('A.', 140, 540); ctx.fillStyle = '#d4d4d8'; ctx.font = '50px "PingFang TC", sans-serif'; wrapText(ctx, a, 230, 540, 700, 70);
    ctx.textAlign = "center"; ctx.fillStyle = '#444'; ctx.font = 'bold 28px "SF Pro Display", monospace'; ctx.letterSpacing = "5px"; ctx.fillText(WATERMARK_TEXT, 540, 1000);
    try { PremiumSwal.fire({ title: '渲染完成', html: '<p class="text-xs text-zinc-400 mb-2">請長按或點擊右鍵儲存圖片</p>', imageUrl: canvas.toDataURL('image/jpeg', 0.98), imageWidth: '100%', imageClass: 'rounded-xl shadow-2xl border border-[#333]' }); } catch(e) { PremiumSwal.fire('錯誤', '瀏覽器阻擋生成，請部署至伺服器環境', 'error'); }
};

/* ==========================================================================
   🤖 終極四核心 AI 大腦 (具備記憶與瀑布流無縫備援)
   ========================================================================== */

let aiMemory = []; 
let currentAbortController = null; 

function renderAISuggestions() {
    const container = document.getElementById('ai-suggestion-chips');
    if (!container || !qaData || qaData.length === 0) return;

    const shuffledQA = [...qaData].sort(() => 0.5 - Math.random());
    const selectedQA = shuffledQA.slice(0, 4);
    const icons = ['💡', '🔍', '✨', '🎯'];

    container.innerHTML = selectedQA.map((item, index) => {
        const randomIcon = icons[index];
        const safeQ = item.q.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    }).join('');
}

function disableModelOption(modelValue) {
    const opt = document.getElementById(`opt-${modelValue}`);
    if (opt && !opt.disabled) {
        opt.disabled = true;
        opt.innerText = opt.innerText.replace(/✨|⚡|🧠|🧊/g, '❌') + ' (已失效)';
    }
}

window.stopAIGeneration = function() {
    if (currentAbortController) {
        currentAbortController.abort(); 
        currentAbortController = null;
        document.getElementById('ai-stop-btn').classList.add('hidden');
        document.getElementById('ai-send-btn').classList.remove('hidden');
        document.getElementById('ai-input').disabled = false;
        document.getElementById('ai-send-btn').disabled = false;
        document.getElementById('ai-status-text').innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span> 生成已中斷`;
    }
};

class AIEngine {
    // 🔥 全新升級的本地狀態機與記憶體
    static localMemory = { 
        userName: null, 
        lastTopic: null, 
        interactionCount: 0,
        pendingClarification: false
    };

    static getSystemPrompt() {
        const contextData = qaData.map(item => `問：${item.q} 答：${item.a}`).join("\n");
        return `你現在是「老王專屬秘密基地」的官方 AI 助理。語氣幽默、熱情。
【秘密基地資料庫】：
${contextData}

【指導原則】：
1. 具備記憶力：若使用者說出名字，後續對話請稱呼他。
2. 資料庫沒有的問題請委婉告知。
3. 輸出純文字或簡易 HTML (<br>)，絕對不要使用 Markdown 星號或粗體。`;
    }

    static async analyze(input, signal) {
        const text = input.trim();
        aiMemory.push({ role: "user", content: text });
        if (aiMemory.length > 12) aiMemory = aiMemory.slice(aiMemory.length - 12);

        let responseText = "";
        let engineInfo = "";

        // 🛡️ 瀑布流邏輯 (預設首選 Groq)
        try {
            if (currentAIEngine === 'groq') {
                responseText = await this.callGroq(signal);
                engineInfo = `<i class="fa-solid fa-bolt text-orange-400"></i> 極速 Groq 引擎`;
            } else if (currentAIEngine === 'gemini') {
                responseText = await this.callGemini(signal);
                engineInfo = `<i class="fa-solid fa-sparkles text-sky-400"></i> 主核 Gemini 引擎`;
            } else if (currentAIEngine === 'cohere') {
                responseText = await this.callCohere(text, signal);
                engineInfo = `<i class="fa-solid fa-brain text-purple-400"></i> 三核 Cohere 引擎`;
            } else if (currentAIEngine === 'hf') {
                responseText = await this.callHF(signal);
                engineInfo = `<i class="fa-solid fa-cube text-yellow-400"></i> 四核開源引擎`;
            } else if (currentAIEngine === 'local') {
                // 強制觸發地表最強本地大腦
                responseText = this.localAnalyze(text);
                engineInfo = `<i class="fa-solid fa-microchip text-sky-400"></i> 終極神經網絡模組 (無網直連)`;
            } else {
                try {
                    responseText = await this.callGroq(signal);
                    engineInfo = `<i class="fa-solid fa-bolt text-orange-400"></i> Groq 引擎 (自動預設)`;
                } catch (e1) {
                    if (e1.name === 'AbortError') throw e1;
                    console.warn("Groq 失效，切換 Gemini...");
                    try {
                        responseText = await this.callGemini(signal);
                        engineInfo = `<i class="fa-solid fa-sparkles text-sky-400"></i> Gemini (備援)`;
                    } catch (e2) {
                        if (e2.name === 'AbortError') throw e2;
                        responseText = this.localAnalyze(text);
                        engineInfo = `<i class="fa-solid fa-server text-sky-400"></i> 終極神經網絡模組 (自動降級)`;
                    }
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') return `<div class="text-zinc-400 italic"><i class="fa-solid fa-ban mr-1"></i>已停止神經網路運算。</div>`;
            responseText = this.localAnalyze(text);
            engineInfo = `<i class="fa-solid fa-shield-halved text-sky-400"></i> 本地安全模式運算中`;
        }

        aiMemory.push({ role: "assistant", content: responseText });

        // 全域溯源按鈕檢測
        let sourceButtonHTML = "";
        let bestMatch = null; let highestScore = 0;
        qaData.forEach(item => {
            let score = 0;
            if (text.toLowerCase().includes(item.q.toLowerCase())) score += 50;
            if (score > highestScore && score > 5) { highestScore = score; bestMatch = item; }
        });

        if (bestMatch) {
            const safeQ = bestMatch.q.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            const safeA = bestMatch.a.replace(/'/g, "\\'").replace(/"/g, '&quot;');
            sourceButtonHTML = `
            <div class="mt-4">
                <button onclick="showSource('${safeQ}', '${safeA}')" class="text-[11px] bg-sky-500/10 text-sky-400 border border-sky-500/30 px-3 py-1.5 rounded-lg hover:bg-sky-500/20 hover:scale-105 transition-all shadow-sm flex items-center gap-1.5 w-fit font-bold tracking-widest">
                    <i class="fa-solid fa-satellite-dish animate-pulse"></i> 檢視機密溯源
                </button>
            </div>`;
        }

        return `<div class="text-zinc-200 leading-relaxed">${responseText.replace(/\n/g, '<br>')}</div>${sourceButtonHTML}<div class="mt-4 pt-3 border-t border-white/10"><span class="text-[10px] text-zinc-400 flex items-center gap-1.5 bg-white/5 w-fit px-3 py-1.5 rounded-lg border border-white/10 shadow-sm">${engineInfo}</span></div>`;
    }

    static async callGroq(signal) {
        if (!GROQ_KEY || GROQ_KEY.length < 20) throw new Error("無 Groq 金鑰");
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY.trim()}` }, signal: signal,
            body: JSON.stringify({ model: "llama-3.1-8b-instant", messages: [{ role: "system", content: this.getSystemPrompt() }, ...aiMemory], temperature: 0.7 })
        });
        if (!response.ok) { if (response.status === 429 || response.status === 401) disableModelOption('groq'); throw new Error(`Groq API Error`); }
        const data = await response.json(); return data.choices[0].message.content;
    }

    static async callGemini(signal) {
        if (!GEMINI_KEY || GEMINI_KEY.length < 20) throw new Error("無 Gemini 金鑰");
        const geminiHistory = aiMemory.map(msg => ({ role: msg.role === 'assistant' ? 'model' : 'user', parts: [{ text: msg.content }] }));
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY.trim()}`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: signal, 
            body: JSON.stringify({ system_instruction: { parts: [{ text: this.getSystemPrompt() }] }, contents: geminiHistory, generationConfig: { temperature: 0.7 } })
        });
        if (!response.ok) { if (response.status === 429 || response.status === 404 || response.status === 400) disableModelOption('gemini'); throw new Error(`Gemini Error`); }
        const data = await response.json(); return data.candidates[0].content.parts[0].text;
    }

    static async callCohere(currentInput, signal) {
        if (!COHERE_KEY || COHERE_KEY.length < 10) throw new Error("無 Cohere 金鑰");
        const chatHistory = aiMemory.slice(0, -1).map(msg => ({ role: msg.role === 'assistant' ? 'CHATBOT' : 'USER', message: msg.content }));
        const response = await fetch('https://api.cohere.ai/v1/chat', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${COHERE_KEY.trim()}` }, signal: signal,
            body: JSON.stringify({ model: 'command-r', message: currentInput, preamble: this.getSystemPrompt(), chat_history: chatHistory })
        });
        if (!response.ok) { disableModelOption('cohere'); throw new Error(`Cohere Error`); }
        const data = await response.json(); return data.text;
    }

    static async callHF(signal) {
        if (!HF_KEY || HF_KEY.length < 10) throw new Error("無 HF 金鑰");
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2/v1/chat/completions', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${HF_KEY.trim()}` }, signal: signal,
            body: JSON.stringify({ model: 'mistralai/Mistral-7B-Instruct-v0.2', messages: [{ role: "system", content: this.getSystemPrompt() }, ...aiMemory] })
        });
        if (!response.ok) { disableModelOption('hf'); throw new Error(`HF Error`); }
        const data = await response.json(); return data.choices[0].message.content;
    }

    // ==========================================
    // 🧠 終極超級本地大腦 (全新升級版：上下文感知 + 意圖識別)
    // ==========================================
    static localAnalyze(input) {
        const rawText = input.trim();
        const text = rawText.toLowerCase();
        this.localMemory.interactionCount++;

        // --- 0. 上下文代詞替換 (解決「那他多高？」的問題) ---
        let processedText = text;
        if (this.localMemory.lastTopic === "老王" && /(他|這位|這個人)/.test(text)) {
            processedText = processedText.replace(/(他|這位|這個人)/g, "老王");
        }

        // --- 1. 本地數學邏輯引擎 ---
        const mathMatch = rawText.match(/(?:算|計算|解答)?\s*([0-9+\-*/().\s]{3,})\s*(?:等於|=|\?)?/);
        if (mathMatch && /[0-9]/.test(mathMatch[1])) {
            try {
                const equation = mathMatch[1].replace(/[^0-9+\-*/().]/g, '');
                if (equation.length > 2) {
                    const result = new Function('return ' + equation)();
                    if (!isNaN(result) && result !== Infinity) {
                        return `就算在離線模式，我的神經算力依舊精準！<br>這題的答案是：<span class="text-sky-400 font-bold text-lg ml-1">${result}</span> 🧮`;
                    }
                }
            } catch(e) {}
        }

        // --- 2. 本地時間感知器 ---
        if (/幾點|時間|今天幾號|現在時刻/.test(processedText)) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
            return `我看了看系統底層的時鐘，現在時間是 <span class="text-sky-400 font-bold">${timeStr}</span> ⏰。<br>老王差不多該準備行動了吧？`;
        }

        // --- 3. 身份與寒暄模組 (具備記憶) ---
        const nameMatch = rawText.match(/(?:我叫|我是|我的名字(?:是|叫))([\u4e00-\u9fa5A-Za-z]+)/);
        if (nameMatch && nameMatch[1].length < 10 && !nameMatch[1].includes("誰")) {
            this.localMemory.userName = nameMatch[1].replace(/啊|啦|喔|的/g, '');
            return `太棒了！我已經把你的代號「<span class="text-sky-400 font-bold">${this.localMemory.userName}</span>」寫入我的唯讀記憶體了！😎<br>所以${this.localMemory.userName}，今天想查老王的什麼資料？`;
        }
        
        if (processedText.includes("我是誰") || processedText.includes("我的名字")) {
            if (this.localMemory.userName) return `你當然是 <span class="text-sky-400 font-bold">${this.localMemory.userName}</span> 呀！我的本地記憶體可是過目不忘的！`;
            return "嗯...因為目前處於離線運算模式，我腦海裡還沒有建檔你的名字耶。可以跟我說「我叫ＯＯＯ」嗎？";
        }

        if (/^(hi|hello|你好|嗨|安安|早安|晚安)/.test(processedText) && processedText.length < 10) {
            const greetingName = this.localMemory.userName ? `，${this.localMemory.userName}` : '';
            return `哈囉${greetingName}！我是老王秘密基地的專屬 AI。<br>目前我正在使用 **本地神經核心** 支援中，反應速度絕對是一流的，儘管問我吧！`;
        }

        if (/(你是誰|你叫什麼|你的名字)/.test(processedText)) {
            return "我是**老王專屬秘密基地**的最強本地 AI！就算雲端伺服器被外星人炸了，我依然能在你的瀏覽器裡回答關於老王的大小事。😎";
        }

        // --- 4. 終極語意推論引擎 (NLP-lite 降噪與加權) ---
        // 建立停用詞表，避免被無意義的字眼干擾
        const stopWords = ['的', '是', '嗎', '了', '呢', '啊', '在', '有', '和', '與', '怎麼', '什麼', '老王'];
        const keywords = processedText.split(/(?:[?？,，。!！\s])/).filter(k => k.length > 0 && !stopWords.includes(k));

        let bestMatch = null;
        let highestScore = 0;
        
        qaData.forEach(item => {
            let score = 0;
            const qText = item.q.toLowerCase();
            const aText = item.a.toLowerCase();
            
            // 完全命中加極高分
            if (processedText.includes(qText)) score += 300;
            
            // 關鍵字疊加計分 (字串越長權重越高)
            keywords.forEach(kw => {
                if (qText.includes(kw)) score += kw.length * 20;
                if (aText.includes(kw)) score += kw.length * 5;
            });

            // 針對老王核心屬性的高權重同義詞觸發
            if (/(身高|多高)/.test(processedText) && /(身高|高)/.test(qText)) score += 100;
            if (/(年紀|多大|幾歲|生日)/.test(processedText) && /(年齡|歲|生日)/.test(qText)) score += 100;
            if (/(粉絲|觀眾|假帳號|小鬼瓶)/.test(processedText) && /(粉絲|小鬼瓶|詐騙)/.test(qText)) score += 100;
            if (/(直播|哪裡看|twitch|抖音|tiktok)/.test(processedText) && /(直播|平台|tiktok|twitch)/.test(qText)) score += 100;

            if (score > highestScore && score > 30) { // 提高觸發門檻，避免亂答
                highestScore = score;
                bestMatch = item;
            }
        });

        if (bestMatch) {
            this.localMemory.lastTopic = "老王"; // 更新話題記憶

            // 動態生成語氣模板，讓回答不像死板的機器人
            const templates = [
                `根據我的本地高速檢索，這題的答案是：<br><br><span class="text-sky-400 font-bold border-l-2 border-sky-500 pl-3 block">${bestMatch.a}</span>`, 
                `這個問題問得好！我從資料庫底層挖出了這筆紀錄：<br><br><span class="text-sky-400 font-bold border-l-2 border-sky-500 pl-3 block">${bestMatch.a}</span>`, 
                `這可是身為粉絲必備的常識喔😎！本地神經網路分析結果如下：<br><br><span class="text-sky-400 font-bold border-l-2 border-sky-500 pl-3 block">${bestMatch.a}</span>`,
                `叮咚！找到了！請看：<br><br><span class="text-sky-400 font-bold border-l-2 border-sky-500 pl-3 block">${bestMatch.a}</span>`
            ];
            
            // 如果是老用戶，語氣更親切
            const greeting = this.localMemory.userName && Math.random() > 0.5 ? `${this.localMemory.userName}，` : "";
            const template = templates[Math.floor(Math.random() * templates.length)];
            
            return greeting + template;
        }

        // --- 5. 智慧上下文兜底防呆 (Fallback) ---
        if (processedText.includes("為什麼") || processedText.includes("怎麼會")) {
            return "這牽涉到更深層的邏輯推演，礙於目前「斷網狀態」的運算資源限制，我只能調閱既有的實體機密檔案... 你要不要換個具體的關鍵字問我呢？";
        }

        if (processedText.includes("謝謝") || processedText.includes("感謝")) {
            return "不會啦！能為粉絲服務是我本地 AI 的榮幸！還有什麼想查的嗎？";
        }

        this.localMemory.lastTopic = null; // 查無資料，清空話題

        const fallbacks = [
            "哎呀，我的本地突觸網路似乎沒掃描到這個關鍵字... 換個關於老王的具體詞彙試試看？例如：「身高」、「直播平台」或「假帳號」？",
            "這觸及了我的本地知識盲區呢！這題可能要等雲端大腦連線後才能幫你深度解析了。你可以先問我關於老王的基本資料喔！",
            "查無此資料 📉。不過身為一個專業的本地 AI，我建議你縮減提問的字數，直接輸入核心關鍵字，命中率會更高喔！"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
}

// ==========================================
// 處理打字機動畫與 UI 送出按鈕狀態
// ==========================================
function streamText(elementId, htmlContent, onComplete) {
    const el = document.getElementById(elementId);
    if(!el) return;
    el.style.opacity = '0'; el.innerHTML = htmlContent; el.style.transition = 'opacity 0.5s ease-in';
    let progress = 0;
    const interval = setInterval(() => {
        progress += 0.2; el.style.opacity = progress;
        if(progress >= 1) {
            clearInterval(interval);
            const chatWindow = document.getElementById('chat-window');
            chatWindow.scrollTop = chatWindow.scrollHeight;
            if (onComplete) onComplete();
        }
    }, 100);
}

window.handleAIKeyPress = function(e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAIMessage(); } };

window.sendAIMessage = async function() {
    const inputEl = document.getElementById('ai-input'); 
    const text = inputEl.value.trim(); 
    if (!text) return;
    
    playClickSound(); gainExp(5, true);

    const chat = document.getElementById('chat-window');
    const sendBtn = document.getElementById('ai-send-btn');
    const stopBtn = document.getElementById('ai-stop-btn');
    const statusText = document.getElementById('ai-status-text');
    
    // UI 切換：隱藏送出，顯示停止，禁用輸入
    inputEl.disabled = true; 
    sendBtn.classList.add('hidden');
    stopBtn.classList.remove('hidden');
    inputEl.style.height = '60px'; // 恢復 textarea 預設高度
    statusText.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span> 運算中...`;

    // 實例化中止控制器
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    // 移除歡迎畫面 (若存在)
    const emptyState = chat.querySelector('.animate-\\[smoothReveal_0\\.6s_ease\\]');
    if (emptyState) emptyState.remove();

    // 建立使用者訊息氣泡
    chat.innerHTML += `
        <div class="flex justify-end w-full animate-[smoothReveal_0.4s_ease]">
            <div class="bg-zinc-800 text-white font-medium max-w-[85%] text-base leading-relaxed px-5 py-3 rounded-3xl rounded-tr-md shadow-md border border-white/5">${text.replace(/\n/g, '<br>')}</div>
        </div>`;
    inputEl.value = ''; chat.scrollTop = chat.scrollHeight;

    // 建立 AI 思考中動畫
    const thinkingId = 'thinking-' + Date.now();
    chat.innerHTML += `
        <div id="${thinkingId}" class="flex gap-4 w-full mt-4 mb-2">
            <div class="w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 border border-sky-500/30 overflow-hidden bg-black/80 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <img src="avatar-ai.jpg" onerror="this.src='avatar-profile.jpg'" class="w-full h-full object-cover animate-pulse">
            </div>
            <div class="text-xs pt-3 text-zinc-500 font-mono tracking-widest flex items-center gap-2">
                核心運作中 <span class="flex gap-1"><span class="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></span><span class="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span></span>
            </div>
        </div>`;
    chat.scrollTop = chat.scrollHeight;

    try {
        const responseHTML = await AIEngine.analyze(text, signal);
        
        const thinkingElement = document.getElementById(thinkingId);
        if(thinkingElement) thinkingElement.remove();

        const msgId = 'ai-msg-' + Date.now();
        chat.innerHTML += `
            <div class="flex gap-4 w-full animate-[smoothReveal_0.5s_ease]">
                <div class="w-9 h-9 md:w-10 md:h-10 rounded-full flex-shrink-0 border border-sky-500/50 overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.3)] bg-[#111] p-0.5">
                    <img src="avatar-ai.jpg" onerror="this.src='avatar-profile.jpg'" class="w-full h-full rounded-full object-cover">
                </div>
                <div id="${msgId}" class="text-base font-medium leading-relaxed w-full text-zinc-100 p-2 md:p-3"></div>
            </div>`;
        
        chat.scrollTop = chat.scrollHeight;
        
        streamText(msgId, responseHTML, () => {
            if (currentAbortController) {
                inputEl.disabled = false; 
                stopBtn.classList.add('hidden');
                sendBtn.classList.remove('hidden');
                statusText.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></span> 系統待命`;
                currentAbortController = null;
                inputEl.focus();
            }
        });
    } catch(err) {
        if (err.name !== 'AbortError') console.error("AI流程發生錯誤", err);
        inputEl.disabled = false; stopBtn.classList.add('hidden'); sendBtn.classList.remove('hidden');
        statusText.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span> 系統待命`;
        currentAbortController = null;
    }
};

window.showSource = function(q, a) {
    playClickSound();
    PremiumSwal.fire({
        title: '<i class="fa-solid fa-server text-sky-500 mr-2"></i> 系統數據溯源',
        html: `<div class="text-left text-sm space-y-5 mt-4">
                <div><span class="text-zinc-500 text-xs font-mono tracking-widest block mb-2 border-b border-[#333] pb-1">DATABASE_QUERY</span><div class="bg-[#050505] text-zinc-300 p-4 rounded-xl border border-[#222]">${q}</div></div>
                <div><span class="text-zinc-500 text-xs font-mono tracking-widest block mb-2 border-b border-[#333] pb-1">DATABASE_RESPONSE</span><div class="bg-sky-500/10 text-sky-500 p-4 rounded-xl border border-sky-500/30 font-bold shadow-inner">${a}</div></div>
               </div>`,
    });
};

// === 軌跡紀實 ===
function initTimelineAnimation() {
    const timelineData = [
        { date: "2024/06/02", title: "初次亮相", desc: "在 TikTok 上發佈了第 1 則 貼文。" },
        { date: "2024/06/07", title: "達到了 1 萬 名粉絲", desc: "發佈了 4 則 貼文，每則貼文平均有 18.3 萬 次觀看。" },
        { date: "2024/12/04", title: "達到了 10 萬 名粉絲", desc: "發佈了 32 則 貼文，每則貼文平均有 28.5 萬 次觀看。熱門標題用詞：fyp tiktok。" },
        { date: "2026/03/01", title: "網站上架", desc: "網站完成測試，並上架於網路。" }
    ];
    const container = document.getElementById('timeline-nodes-container');
    if(!container) return;
    
    container.innerHTML = timelineData.map((t, index) => {
        const isLast = index === timelineData.length - 1;
        const dotStyle = isLast ? "bg-sky-500 shadow-[0_0_20px_rgba(56,189,248,1)] animate-pulse" : "bg-[#222] border-2 border-[#444]";
        const titleColor = isLast ? "text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-sky-600" : "text-white";
        
        return `
        <div class="timeline-node relative pl-12">
            <div class="absolute w-4 h-4 rounded-full left-0 top-5 z-10 ${dotStyle} transition-all duration-500"></div>
            <div class="premium-card p-6 md:p-8 relative overflow-hidden group">
                ${isLast ? '<div class="absolute -right-10 -top-10 w-32 h-32 bg-sky-500/10 rounded-full blur-3xl group-hover:bg-sky-500/20 transition-all duration-700"></div>' : ''}
                <span class="text-[10px] text-sky-500 font-bold tracking-[0.2em] block mb-3 bg-[#111] border border-[#333] w-fit px-3 py-1 rounded-full shadow-inner">${t.date}</span>
                <h3 class="text-xl font-black ${titleColor} mb-2 tracking-wide">${t.title}</h3>
                <p class="text-sm text-zinc-400 leading-relaxed font-medium">${t.desc}</p>
            </div>
        </div>`;
    }).join('');

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.2 });

    document.querySelectorAll('.timeline-node').forEach((node, i) => {
        node.style.transitionDelay = `${i * 0.2}s`; 
        observer.observe(node);
    });
}

// === 1. 一般粉絲認證卡生成 (經典淡藍科技風) ===
window.generateIDCard = function() {
    playClickSound();
    const nameInput = document.getElementById('id-name').value.trim() || "尊榮粉絲";
    
    PremiumSwal.fire({ title: '核心驗證中...', text: '正在鑄造專屬粉絲晶片卡', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    const canvas = document.getElementById('id-canvas'); 
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 1080, 1500);
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 1080, 1500);
    const grad = ctx.createRadialGradient(540, 200, 100, 540, 600, 1000);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)'); // sky-500
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1500);
    
    ctx.fillStyle = '#0a0a0a'; 
    ctx.beginPath(); ctx.roundRect(80, 80, 920, 1340, 50); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 4; ctx.stroke();
    
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    ctx.strokeRect(140, 140, 80, 60);
    ctx.beginPath(); ctx.moveTo(140, 170); ctx.lineTo(120, 170); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(220, 170); ctx.lineTo(240, 170); ctx.stroke();

    const avatarImg = new Image(); 
    avatarImg.crossOrigin = "Anonymous"; 
    avatarImg.src = "avatar-main.jpg";

    const finalizeDraw = (usedFallback = false) => {
        ctx.textAlign = "center";
        ctx.fillStyle = '#38bdf8'; ctx.font = '900 35px "SF Pro Display", sans-serif'; ctx.letterSpacing = "15px"; 
        ctx.fillText('EXCLUSIVE FAN CERTIFICATE', 540, 860);
        
        ctx.fillStyle = '#FFFFFF'; ctx.font = '900 130px "PingFang TC", sans-serif'; 
        ctx.save(); ctx.globalAlpha = 0.1; ctx.scale(1, -1); ctx.fillText(nameInput, 540, -1180); ctx.restore();
        ctx.fillText(nameInput, 540, 1020);

        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(240, 1100, 600, 2);

        ctx.fillStyle = '#666'; ctx.font = 'bold 35px monospace'; 
        ctx.fillText(`ID: WANG-${Date.now().toString().slice(-6)}`, 540, 1200);
        
        ctx.fillStyle = '#333';
        for(let i=0; i<30; i++) {
            let w = Math.random() * 8 + 2; ctx.fillRect(300 + i*16, 1250, w, 60);
        }

        setTimeout(() => {
            const warningText = usedFallback ? '<p class="text-xs text-sky-500 mt-2 border border-sky-500/30 bg-sky-500/10 p-2 rounded-lg"><i class="fa-solid fa-triangle-exclamation"></i> 尚未放置 avatar-main.jpg，套用預設頭像。</p>' : '';
            PremiumSwal.fire({ 
                title: '核發成功', 
                html: `<p class="text-sm text-zinc-400 mb-2">晶片寫入完畢，請長按保存圖片。</p>${warningText}`, 
                imageUrl: canvas.toDataURL('image/jpeg', 0.98), imageWidth: '90%',
                imageClass: 'rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)] border border-[#333]'
            });
            gainExp(15);
        }, 800);
    };

    avatarImg.onload = () => {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)'; ctx.shadowBlur = 50;
        ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(avatarImg, 280, 220, 520, 520); ctx.restore();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke();
        finalizeDraw(false);
    };
    
    avatarImg.onerror = () => { 
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "Anonymous";
        fallbackImg.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(nameInput[0] || '王') + "&background=111111&color=38bdf8&size=512";
        fallbackImg.onload = () => {
            ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(fallbackImg, 280, 220, 520, 520); ctx.restore();
            ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke();
            finalizeDraw(true);
        };
    };
};

// === 1. 一般粉絲認證卡生成 (經典淡藍科技風 - 純中文版) ===
window.generateIDCard = function() {
    playClickSound();
    const nameInput = document.getElementById('id-name').value.trim() || "尊榮粉絲";
    
    PremiumSwal.fire({ title: '核心驗證中...', text: '正在鑄造專屬粉絲晶片卡', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    const canvas = document.getElementById('id-canvas'); 
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 1080, 1500);
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 1080, 1500);
    const grad = ctx.createRadialGradient(540, 200, 100, 540, 600, 1000);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)'); // sky-500
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1500);
    
    ctx.fillStyle = '#0a0a0a'; 
    ctx.beginPath(); ctx.roundRect(80, 80, 920, 1340, 50); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 4; ctx.stroke();
    
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    ctx.strokeRect(140, 140, 80, 60);
    ctx.beginPath(); ctx.moveTo(140, 170); ctx.lineTo(120, 170); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(220, 170); ctx.lineTo(240, 170); ctx.stroke();

    const avatarImg = new Image(); 
    avatarImg.crossOrigin = "Anonymous"; 
    avatarImg.src = "avatar-main.jpg";

    const finalizeDraw = (usedFallback = false) => {
        ctx.textAlign = "center";
        
        // 替換掉英文，改為中文
        ctx.fillStyle = '#38bdf8'; ctx.font = '900 40px "PingFang TC", sans-serif'; ctx.letterSpacing = "15px"; 
        ctx.fillText('專屬粉絲認證卡', 540, 860);
        
        ctx.fillStyle = '#FFFFFF'; ctx.font = '900 130px "PingFang TC", sans-serif'; 
        ctx.save(); ctx.globalAlpha = 0.1; ctx.scale(1, -1); ctx.fillText(nameInput, 540, -1180); ctx.restore();
        ctx.fillText(nameInput, 540, 1020);

        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(240, 1100, 600, 2);

        // 替換 ID 為專屬編號
        ctx.fillStyle = '#666'; ctx.font = 'bold 35px "PingFang TC", monospace'; ctx.letterSpacing = "2px";
        ctx.fillText(`專屬編號：${Date.now().toString().slice(-6)}`, 540, 1200);
        
        ctx.fillStyle = '#333';
        for(let i=0; i<30; i++) {
            let w = Math.random() * 8 + 2; ctx.fillRect(300 + i*16, 1250, w, 60);
        }

        setTimeout(() => {
            const warningText = usedFallback ? '<p class="text-xs text-sky-500 mt-2 border border-sky-500/30 bg-sky-500/10 p-2 rounded-lg"><i class="fa-solid fa-triangle-exclamation"></i> 尚未放置 avatar-main.jpg，套用預設頭像。</p>' : '';
            PremiumSwal.fire({ 
                title: '核發成功', 
                html: `<p class="text-sm text-zinc-400 mb-2">晶片寫入完畢，請長按保存圖片。</p>${warningText}`, 
                imageUrl: canvas.toDataURL('image/jpeg', 0.98), imageWidth: '90%',
                imageClass: 'rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)] border border-[#333]'
            });
            gainExp(15);
        }, 800);
    };

    avatarImg.onload = () => {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)'; ctx.shadowBlur = 50;
        ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(avatarImg, 280, 220, 520, 520); ctx.restore();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke();
        finalizeDraw(false);
    };
    
    avatarImg.onerror = () => { 
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "Anonymous";
        fallbackImg.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(nameInput[0] || '王') + "&background=111111&color=38bdf8&size=512";
        fallbackImg.onload = () => {
            ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(fallbackImg, 280, 220, 520, 520); ctx.restore();
            ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke();
            finalizeDraw(true);
        };
    };
};

// === 1. 一般粉絲認證卡生成 (經典淡藍科技風 - 純中文版) ===
window.generateIDCard = function() {
    playClickSound();
    const nameInput = document.getElementById('id-name').value.trim() || "尊榮粉絲";
    
    PremiumSwal.fire({ title: '核心驗證中...', text: '正在鑄造專屬粉絲晶片卡', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    const canvas = document.getElementById('id-canvas'); 
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 1080, 1500);
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 1080, 1500);
    const grad = ctx.createRadialGradient(540, 200, 100, 540, 600, 1000);
    grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)'); // sky-500
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1500);
    
    ctx.fillStyle = '#0a0a0a'; 
    ctx.beginPath(); ctx.roundRect(80, 80, 920, 1340, 50); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 4; ctx.stroke();
    
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2;
    ctx.strokeRect(140, 140, 80, 60);
    ctx.beginPath(); ctx.moveTo(140, 170); ctx.lineTo(120, 170); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(220, 170); ctx.lineTo(240, 170); ctx.stroke();

    const avatarImg = new Image(); 
    avatarImg.crossOrigin = "Anonymous"; 
    avatarImg.src = "avatar-main.jpg";

    const finalizeDraw = (usedFallback = false) => {
        ctx.textAlign = "center";
        
        ctx.fillStyle = '#38bdf8'; ctx.font = '900 40px "PingFang TC", sans-serif'; ctx.letterSpacing = "15px"; 
        ctx.fillText('專屬粉絲認證卡', 540, 860);
        
        ctx.fillStyle = '#FFFFFF'; ctx.font = '900 130px "PingFang TC", sans-serif'; 
        ctx.save(); ctx.globalAlpha = 0.1; ctx.scale(1, -1); ctx.fillText(nameInput, 540, -1180); ctx.restore();
        ctx.fillText(nameInput, 540, 1020);

        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(240, 1100, 600, 2);

        ctx.fillStyle = '#666'; ctx.font = 'bold 35px "PingFang TC", monospace'; ctx.letterSpacing = "2px";
        ctx.fillText(`專屬編號：${Date.now().toString().slice(-6)}`, 540, 1200);
        
        ctx.fillStyle = '#333';
        for(let i=0; i<30; i++) {
            let w = Math.random() * 8 + 2; ctx.fillRect(300 + i*16, 1250, w, 60);
        }

        setTimeout(() => {
            const warningText = usedFallback ? '<p class="text-xs text-sky-500 mt-2 border border-sky-500/30 bg-sky-500/10 p-2 rounded-lg"><i class="fa-solid fa-triangle-exclamation"></i> 尚未放置 avatar-main.jpg，套用預設頭像。</p>' : '';
            PremiumSwal.fire({ 
                title: '核發成功', 
                html: `<p class="text-sm text-zinc-400 mb-2">晶片寫入完畢，請長按保存圖片。</p>${warningText}`, 
                imageUrl: canvas.toDataURL('image/jpeg', 0.98), imageWidth: '90%',
                imageClass: 'rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)] border border-[#333]'
            });
            gainExp(15);
        }, 800);
    };

    avatarImg.onload = () => {
        ctx.shadowColor = 'rgba(56, 189, 248, 0.5)'; ctx.shadowBlur = 50;
        ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip();
        ctx.drawImage(avatarImg, 280, 220, 520, 520); ctx.restore();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke();
        finalizeDraw(false);
    };
    
    avatarImg.onerror = () => { 
        const fallbackImg = new Image();
        fallbackImg.crossOrigin = "Anonymous";
        fallbackImg.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(nameInput[0] || '王') + "&background=111111&color=38bdf8&size=512";
        fallbackImg.onload = () => {
            ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(fallbackImg, 280, 220, 520, 520); ctx.restore();
            ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke();
            finalizeDraw(true);
        };
    };
};

// === 2. 生日專屬認證卡生成 (明亮香檳金 + 隨機滿版蛋糕) ===
window.generateBirthdayIDCard = async function() {
    playClickSound();
    const nameInput = document.getElementById('id-name').value.trim() || "尊榮粉絲";
    
    // 震撼的過場動畫
    PremiumSwal.fire({ 
        title: '<div class="animate-pulse text-yellow-400"><i class="fa-solid fa-cake-candles"></i></div>',
        html: '<div class="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-yellow-600 tracking-widest mt-2 mb-4">啟動生日專屬鑄造協議</div><div class="text-xs text-yellow-600 font-mono tracking-widest">注入金光能量中...</div>',
        showConfirmButton: false, 
        allowOutsideClick: false,
        timer: 1500
    });

    setTimeout(() => {
        const canvas = document.getElementById('id-canvas'); 
        const ctx = canvas.getContext('2d');
        
        ctx.clearRect(0, 0, 1080, 1500);

        // 1. 明亮的耀眼金色背景 (取代原本的黑底)
        ctx.fillStyle = '#fef3c7'; // 非常亮的米黃色基底
        ctx.fillRect(0, 0, 1080, 1500);
        
        const gradGold = ctx.createRadialGradient(540, 750, 100, 540, 750, 1000);
        gradGold.addColorStop(0, '#fef08a'); // 亮金
        gradGold.addColorStop(1, '#d97706'); // 邊緣帶點深邃的琥珀金
        ctx.fillStyle = gradGold; 
        ctx.fillRect(0, 0, 1080, 1500);
        
        // 2. 卡片主體 (半透明的白底，讓金色透出來，整體非常明亮)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)'; 
        ctx.beginPath(); ctx.roundRect(80, 80, 920, 1340, 50); ctx.fill();
        ctx.strokeStyle = '#fef08a'; ctx.lineWidth = 6; ctx.stroke();
        
        // 內圈裝飾線
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.roundRect(95, 95, 890, 1310, 35); ctx.stroke();

        // === 🍰 防重疊演算法：25 顆不打架的蛋糕 ===
        ctx.save();
        ctx.beginPath(); ctx.roundRect(80, 80, 920, 1340, 50); ctx.clip();
        ctx.globalAlpha = 0.5; // 在亮背景上透明度調高一點，讓蛋糕明顯
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        let cakes = [];
        let numCakes = 25; 
        let maxAttempts = 500; 
        let attempts = 0;

        while (cakes.length < numCakes && attempts < maxAttempts) {
            let randSize = 40 + Math.random() * 40; 
            let randX = 120 + randSize + Math.random() * (840 - randSize * 2);
            let randY = 120 + randSize + Math.random() * (1260 - randSize * 2);
            let randAngle = Math.random() * Math.PI * 2;

            let overlapping = false;
            for (let j = 0; j < cakes.length; j++) {
                let dx = randX - cakes[j].x;
                let dy = randY - cakes[j].y;
                let distance = Math.sqrt(dx * dx + dy * dy);
                let minDistance = (randSize + cakes[j].size) / 2 + 15;
                if (distance < minDistance) {
                    overlapping = true;
                    break;
                }
            }

            if (!overlapping) {
                cakes.push({ x: randX, y: randY, size: randSize, angle: randAngle });
            }
            attempts++;
        }

        for (let i = 0; i < cakes.length; i++) {
            let cake = cakes[i];
            ctx.font = `${cake.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
            ctx.save();
            ctx.translate(cake.x, cake.y);
            ctx.rotate(cake.angle);
            ctx.fillText('🎂', 0, 0);
            ctx.restore();
        }
        ctx.restore();

        // 4. 左上角專屬晶片 (深金框)
        ctx.strokeStyle = '#b45309'; ctx.lineWidth = 3;
        ctx.strokeRect(140, 140, 80, 60);
        ctx.beginPath(); ctx.moveTo(140, 170); ctx.lineTo(120, 170); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(220, 170); ctx.lineTo(240, 170); ctx.stroke();

        const avatarImg = new Image(); 
        avatarImg.crossOrigin = "Anonymous"; 
        avatarImg.src = "avatar-main.jpg";

        const finalizeDraw = (usedFallback = false) => {
            ctx.textAlign = "center";
            
            // ⭐ 頂部標題改為「專屬粉絲認證卡」(深棕金，對比亮背景)
            ctx.fillStyle = '#451a03'; 
            ctx.font = '900 40px "PingFang TC", sans-serif'; ctx.letterSpacing = "15px"; 
            ctx.fillText('專屬粉絲認證卡', 540, 840);
            
            // 名字印製 (極深灰/近黑，帶白色發光陰影凸顯質感)
            ctx.fillStyle = '#1c1917'; 
            ctx.font = '900 130px "PingFang TC", sans-serif'; 
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'; ctx.shadowBlur = 20; 
            ctx.fillText(nameInput, 540, 1000);
            ctx.shadowBlur = 0; // 重置陰影

            // 分隔線
            ctx.fillStyle = 'rgba(180, 83, 9, 0.3)'; ctx.fillRect(240, 1080, 600, 2);

            // ⭐ 寫上「老王生日限定版」
            ctx.fillStyle = '#9a3412'; ctx.font = 'bold 32px "PingFang TC", sans-serif'; ctx.letterSpacing = "4px"; 
            ctx.fillText('老王生日限定版', 540, 1150);
            
            // ⭐ 專屬編號 (阿拉伯數字)
            ctx.fillStyle = '#451a03'; ctx.font = 'bold 28px "PingFang TC", sans-serif'; ctx.letterSpacing = "2px"; 
            ctx.fillText(`專屬編號：${Date.now().toString().slice(-6)}`, 540, 1200);
            
            // 底部裝飾條碼 (深色)
            ctx.fillStyle = 'rgba(69, 26, 3, 0.7)';
            for(let i=0; i<30; i++) {
                let w = Math.random() * 8 + 2; ctx.fillRect(300 + i*16, 1250, w, 60);
            }

            setTimeout(() => {
                const warningText = usedFallback ? '<p class="text-xs text-yellow-600 mt-2 border border-yellow-500/30 bg-yellow-500/10 p-2 rounded-lg"><i class="fa-solid fa-triangle-exclamation"></i> 尚未放置 avatar-main.jpg，套用預設頭像。</p>' : '';
                PremiumSwal.fire({ 
                    title: '生日金卡核發成功', 
                    html: `<p class="text-sm text-zinc-400 mb-2">專屬生日晶片已寫入，請長按保存圖片，祝老王生日快樂！🎉</p>${warningText}`, 
                    imageUrl: canvas.toDataURL('image/jpeg', 0.98), imageWidth: '90%',
                    imageClass: 'rounded-2xl shadow-[0_0_40px_rgba(251,191,36,0.3)] border border-[#333]'
                });
                gainExp(50);
            }, 600);
        };

        avatarImg.onload = () => {
            // 頭像光暈 (白金色)
            ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'; ctx.shadowBlur = 40;
            ctx.save(); ctx.beginPath(); ctx.arc(540, 460, 260, 0, Math.PI * 2); ctx.clip();
            ctx.drawImage(avatarImg, 280, 200, 520, 520); ctx.restore();
            ctx.shadowBlur = 0;
            
            // 雙層頭像框：外圈白，內圈深金
            ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(540, 460, 264, 0, Math.PI * 2); ctx.stroke();
            ctx.strokeStyle = '#d97706'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(540, 460, 256, 0, Math.PI * 2); ctx.stroke();
            
            finalizeDraw(false);
        };
        
        avatarImg.onerror = () => { 
            const fallbackImg = new Image();
            fallbackImg.crossOrigin = "Anonymous";
            // 預設圖片也改成金色系搭配
            fallbackImg.src = "https://ui-avatars.com/api/?name=" + encodeURIComponent(nameInput[0] || '王') + "&background=fef08a&color=b45309&size=512";
            fallbackImg.onload = () => {
                ctx.save(); ctx.beginPath(); ctx.arc(540, 460, 260, 0, Math.PI * 2); ctx.clip();
                ctx.drawImage(fallbackImg, 280, 200, 520, 520); ctx.restore();
                ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 16; ctx.beginPath(); ctx.arc(540, 460, 264, 0, Math.PI * 2); ctx.stroke();
                ctx.strokeStyle = '#d97706'; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(540, 460, 256, 0, Math.PI * 2); ctx.stroke();
                finalizeDraw(true);
            };
        };
    }, 1500);
};
// === 會考系統 ===
let currentQuiz = [], currentQIndex = 0, score = 0;

window.startQuiz = function() {
    playClickSound();
    const name = document.getElementById('quiz-player-name').value.trim();
    if(!name) { PremiumSwal.fire({ title: '存取拒絕', text: '請輸入挑戰者大名以啟動測驗協議！', icon: 'warning' }); return; }
    if (quizData.length < 10) { PremiumSwal.fire({ title: '系統錯誤', text: '題庫數據不足 10 題，無法啟動。', icon: 'error' }); return; }

    const intro = document.getElementById('quiz-intro');
    const area = document.getElementById('quiz-area');
    
    intro.style.opacity = '0';
    setTimeout(() => {
        intro.classList.add('hidden'); 
        area.classList.replace('hidden', 'flex');
        area.style.animation = 'cinematicReveal 0.6s ease forwards';
        
        currentQuiz = [...quizData].sort(() => 0.5 - Math.random()).slice(0, 10);
        currentQIndex = 0; score = 0; 
        renderQuizQuestion();
    }, 300);
};

function renderQuizQuestion() {
    if (currentQIndex >= 10) { endQuiz(); return; }
    const qData = currentQuiz[currentQIndex];
    document.getElementById('quiz-progress').innerText = `第 ${currentQIndex + 1} 題 / 共 10 題`;
    document.getElementById('quiz-score').innerText = `目前積分: ${score}`;
    
    const qEl = document.getElementById('quiz-question');
    qEl.style.opacity = '0';
    setTimeout(() => {
        qEl.innerText = qData.q;
        qEl.style.transition = 'opacity 0.4s';
        qEl.style.opacity = '1';
    }, 200);
    
    const optsContainer = document.getElementById('quiz-options'); 
    optsContainer.innerHTML = '';
    
    [...qData.options].sort(() => 0.5 - Math.random()).forEach((opt, idx) => {
        const delay = idx * 0.1;
        optsContainer.innerHTML += `
            <button onclick="answerQuiz(this, ${opt === qData.a})" class="w-full text-left bg-[#111] border border-[#333] p-5 rounded-2xl hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] font-bold text-zinc-200 transition-all duration-300 text-sm transform hover:-translate-y-1" style="animation: cinematicReveal 0.4s ease backwards; animation-delay: ${delay}s;">
                <span class="inline-block w-6 text-zinc-500 font-mono">${['A','B','C','D'][idx]}.</span> ${opt}
            </button>`;
    });
}

window.answerQuiz = function(btn, isCorrect) {
    document.getElementById('quiz-options').querySelectorAll('button').forEach(b => {
        b.disabled = true; b.classList.add('opacity-50');
    });
    btn.classList.remove('opacity-50');
    
    if (isCorrect) { 
        if(appSettings.soundOn) playSuccessSound();
        btn.className = "w-full text-left bg-green-500/20 border-2 border-green-500 p-5 rounded-2xl text-green-400 font-black text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] transform scale-105 transition-all"; 
        score += 10; 
    } else { 
        playClickSound();
        btn.className = "w-full text-left bg-red-500/20 border-2 border-red-500 p-5 rounded-2xl text-red-400 font-black text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] transform scale-95 transition-all"; 
    }
    
    document.getElementById('quiz-score').innerText = `目前積分: ${score}`;
    setTimeout(() => { currentQIndex++; renderQuizQuestion(); }, 1200);
};

function endQuiz() {
    gainExp(score); 
    const area = document.getElementById('quiz-area');
    const intro = document.getElementById('quiz-intro');
    
    area.style.opacity = '0';
    setTimeout(() => {
        area.classList.replace('flex','hidden'); 
        intro.classList.remove('hidden');
        intro.style.opacity = '1';
        
        let rank = "";
        if(score === 100) rank = "🏆 完美滿分神級粉絲";
        else if(score >= 80) rank = "🥇 核心護衛隊";
        else if(score >= 60) rank = "🥈 合格粉絲";
        else rank = "🥉 假粉警報！需要多補課了";

        PremiumSwal.fire({ 
            title: '測驗評估完成', 
            html: `
                <div class="text-6xl my-4 drop-shadow-[0_0_20px_rgba(56,189,248,0.6)] font-black text-transparent bg-clip-text bg-gradient-to-br from-sky-300 to-sky-600">${score}</div>
                <div class="text-lg font-bold text-white mb-2">${rank}</div>
                <p class="text-zinc-400 text-sm border-t border-[#333] pt-3 mt-3">已根據表現發放 ${score} EXP，前往主頁查看等級吧！</p>
            `
        });
    }, 500);
}