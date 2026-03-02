/**
 * ==========================================================================
 * 老王專屬秘密基地 - 核心邏輯腳本 (v14.0 終極商業版)
 * 開發者: Wang Li En
 * 架構: 嚴格人設鎖定 / 圖片視覺辨識 / 語音互動(TTS) / 免責聲明 / 防跑版排版
 * ==========================================================================
 */

// ⚠️ 【資安提醒】 
// 將 API Key 寫在前端會有被盜用的風險。這在練習與 MVP 階段沒問題，
// 但未來若有真實流量，強烈建議將這部分移至 Node.js 後端處理。
const GEMINI_KEY = "AIzaSy" + "CREZ3jlL-2kq0gO9Om4WVtLZw0NrVsISA"; 
const GROQ_KEY = "gsk_" + "8qNnAGhigu5qBCjjhXQQWGdyb3FYse4p4uoPx4VFjTdFabH9wGPn"; 

// --- 系統常數與資料庫 ---
const qaData = window.QA_DB || window.wangQuiz_DB || []; 
const quizData = window.QUIZ_DB || window.wangQuiz_DB || [];
const WATERMARK_TEXT = "老王專屬秘密基地";
const STORAGE_KEY = 'wangAppConfig_V14_PRO';

// --- 全域狀態管理 ---
let appSettings = { 
    exp: 0, 
    qaPerPage: 6, 
    soundOn: true, 
    perfMode: false, 
    lastCheckIn: "",
    voiceReply: false // 預設關閉語音回覆
};

// 🔥 全局 AI 變數宣告
let currentAIEngine = 'groq'; // 預設使用高速 Groq
let aiMemory = []; 
let currentAbortController = null; 
let currentAttachedImageBase64 = null; 
let hasShownAIWarning = false; // 判斷是否顯示過免責聲明

// --- 語音辨識 API (SpeechRecognition) ---
let speechRecognition = null;
let isRecording = false;

if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    speechRecognition = new SpeechRecognition();
    speechRecognition.lang = 'zh-TW';
    speechRecognition.interimResults = false;
    
    speechRecognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        const inputEl = document.getElementById('ai-input');
        if(inputEl) {
            inputEl.value += transcript;
            inputEl.style.height = Math.min(inputEl.scrollHeight, 120) + 'px';
        }
        stopRecordingUI();
        setTimeout(() => sendAIMessage(), 500); // 語音結束自動發送
    };
    
    speechRecognition.onerror = (event) => {
        console.error("語音辨識錯誤:", event.error);
        stopRecordingUI();
        PremiumSwal.fire({ title: '語音辨識失敗', text: '請確認麥克風權限已開啟。', icon: 'error', timer: 2000, showConfirmButton: false });
    };
    
    speechRecognition.onend = () => { stopRecordingUI(); };
}

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

// --- SweetAlert2 頂級樣式封裝 ---
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

// --- 初始化 Marked.js 配置 (用於 AI 程式碼高亮) ---
if (typeof marked !== 'undefined' && typeof hljs !== 'undefined') {
    marked.setOptions({
        highlight: function(code, lang) {
            const language = hljs.getLanguage(lang) ? lang : 'plaintext';
            return hljs.highlight(code, { language }).value;
        },
        breaks: true
    });
}

/**
 * ==========================================================================
 * 初始化區塊
 * ==========================================================================
 */
document.addEventListener('DOMContentLoaded', () => {
    printDeveloperConsole();
    loadSettings(); 
    updateExpUI();
    renderAnnouncements(); 
    renderAISuggestions();

    const aiDisplay = document.getElementById('ai-dropdown-display');
    if (aiDisplay) aiDisplay.innerText = "Groq 引擎 (極速)";
    updateVoiceReplyUI();

    setTimeout(() => {
        const splash = document.getElementById('splash');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => { 
                splash.style.display = 'none'; 
                initQA(); 
                const homePage = document.getElementById('page-home');
                if(homePage) homePage.classList.add('active');
            }, 700);
        } else { initQA(); }
    }, 1200);
});

function printDeveloperConsole() {
    console.log('%c 基地 AI 系統 v14.0 %c 核心已連線 ', 
        'background:#0ea5e9; color:#fff; border-radius:3px 0 0 3px; padding:4px; font-weight:bold;', 
        'background:#111; color:#0ea5e9; border-radius:0 3px 3px 0; padding:4px; font-weight:bold;'
    );
}

function loadSettings() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) { try { appSettings = { ...appSettings, ...JSON.parse(saved) }; } catch (e) { } }
    
    const soundToggle = document.getElementById('sound-toggle');
    const perfToggle = document.getElementById('perf-toggle');
    const slider = document.getElementById('qa-per-page-slider');
    const display = document.getElementById('qa-count-display');

    if(soundToggle) soundToggle.checked = appSettings.soundOn;
    if(perfToggle) perfToggle.checked = appSettings.perfMode;
    if(slider) slider.value = appSettings.qaPerPage;
    if(display) display.innerText = `${appSettings.qaPerPage} 題`;

    applyPerfMode(appSettings.perfMode);
}

window.saveSettings = function() {
    const soundToggle = document.getElementById('sound-toggle');
    if (soundToggle) appSettings.soundOn = soundToggle.checked;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appSettings));
    playClickSound();
};

window.togglePerfMode = function() {
    const perfToggle = document.getElementById('perf-toggle');
    if (perfToggle) appSettings.perfMode = perfToggle.checked;
    saveSettings();
    applyPerfMode(appSettings.perfMode);
};

function applyPerfMode(isPerfMode) {
    const bgEffects = document.getElementById('bg-effects');
    if (isPerfMode) {
        if(bgEffects) bgEffects.style.display = 'none';
        document.documentElement.style.setProperty('--glass-bg', 'rgba(20, 20, 20, 0.95)');
    } else {
        if(bgEffects) bgEffects.style.display = 'block';
        document.documentElement.style.setProperty('--glass-bg', 'rgba(18, 18, 18, 0.5)');
    }
}

window.updateQASetting = function(val) {
    appSettings.qaPerPage = parseInt(val); 
    document.getElementById('qa-count-display').innerText = `${val} 題`;
    saveSettings(); currentPage = 1; renderQA(1);
};

function playClickSound() {
    if(!appSettings.soundOn) return;
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime); osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05); gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05); } catch(e) {}
}

function playSuccessSound() {
    if(!appSettings.soundOn) return;
    try { const ctx = new (window.AudioContext || window.webkitAudioContext)(); const osc = ctx.createOscillator(); const gain = ctx.createGain(); osc.connect(gain); gain.connect(ctx.destination); osc.type = 'triangle'; osc.frequency.setValueAtTime(400, ctx.currentTime); osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1); osc.frequency.setValueAtTime(800, ctx.currentTime + 0.2); gain.gain.setValueAtTime(0.05, ctx.currentTime); gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4); osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4); } catch(e) {}
}

window.toggleSettings = function() {
    playClickSound();
    const modal = document.getElementById('settings-modal'); 
    const content = document.getElementById('settings-content');
    if (!modal) return;
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden'); modal.classList.add('flex');
        setTimeout(() => { modal.classList.remove('opacity-0'); content.classList.remove('scale-95'); }, 10);
    } else {
        modal.classList.add('opacity-0'); content.classList.add('scale-95');
        setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); }, 300);
    }
};

window.showChangelog = function() {
    playClickSound();
    PremiumSwal.fire({ 
        title: '<i class="fa-solid fa-code-commit text-sky-500 mr-3"></i><span class="tracking-widest font-black">系統日誌</span>', 
        html: `<div class="text-left text-sm leading-relaxed space-y-4 mt-4 bg-white/5 backdrop-blur-md p-6 rounded-3xl border border-white/10 shadow-[inset_0_2px_10px_rgba(255,255,255,0.02)]"><div><b class="text-sky-400 font-black tracking-widest text-base drop-shadow-md">v14.0 - 終極商業版</b><br><span class="text-zinc-400 mt-1.5 inline-block">完全修復 AI 身份越界問題，鎖定為管理員角色。實裝首次開啟 AI 之免責聲明彈窗。新增語音輸入與 AI 回覆。完美置中時間軸防跑版特效。</span></div></div>`
    });
};

/**
 * ==========================================================================
 * 核心路由與動畫：沉浸式分頁切換 + 免責聲明
 * ==========================================================================
 */
window.switchTab = function(tabId, btn) {
    playClickSound();
    const overlay = document.getElementById('ai-loading-overlay');
    const textEl = document.getElementById('ai-loading-text');
    const barEl = document.getElementById('ai-loading-bar');

    const executeSwitch = () => {
        document.querySelectorAll('.page').forEach(sec => { sec.classList.remove('active'); sec.style.display = 'none'; });
        document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
        
        const targetPage = document.getElementById(tabId);
        if(targetPage) {
            targetPage.style.display = 'block'; 
            void targetPage.offsetWidth; 
            targetPage.classList.add('active');
        }
        if(btn) btn.classList.add('active'); 
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if(tabId === 'page-timeline') initTimelineAnimation();
        
        // 🔥 切換到 AI 頁面時跳出免責聲明
        if(tabId === 'page-ai' && !hasShownAIWarning) {
            hasShownAIWarning = true;
            setTimeout(() => {
                PremiumSwal.fire({
                    title: '<i class="fa-solid fa-shield-halved text-sky-400 mr-2"></i> AI 使用規範',
                    html: `
                    <div class="text-sm text-zinc-300 text-left space-y-3 mt-4 bg-white/5 p-5 rounded-2xl border border-white/10">
                        <p><strong class="text-white">1. AI 僅為助手：</strong>本 AI 的身分為「網站管理員」或「助手」，<span class="text-red-400 font-bold">無法代表老王本人發言</span>，也無法給予任何私人承諾。</p>
                        <p><strong class="text-white">2. 內容查證：</strong>AI 有時可能會產生錯誤或不準確的資訊，請自行斟酌參考。</p>
                        <p><strong class="text-white">3. 隱私保護：</strong>請勿在對話中輸入過度私人或敏感的資訊。</p>
                    </div>`,
                    icon: 'info',
                    confirmButtonText: '我了解並同意',
                    confirmButtonColor: '#0ea5e9',
                    allowOutsideClick: false
                });
            }, 800);
        }
    };

    const activeTab = document.querySelector('.page.active');
    
    if (tabId === 'page-ai' && (!activeTab || activeTab.id !== 'page-ai')) {
        if(overlay && textEl) {
            overlay.classList.remove('hidden');
            if(barEl) barEl.style.width = '0%';
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            
            const bootSequence = ["系統核心初始化中...", "連線至基地資料庫...", "喚醒神經網絡..."];
            let step = 0;
            textEl.innerText = bootSequence[step];
            
            let interval = setInterval(() => {
                step++;
                if(barEl) barEl.style.width = `${(step / bootSequence.length) * 100}%`;
                if (step < bootSequence.length) {
                    textEl.innerText = bootSequence[step];
                } else {
                    clearInterval(interval);
                    executeSwitch();
                    setTimeout(() => {
                        overlay.classList.add('opacity-0');
                        setTimeout(() => overlay.classList.add('hidden'), 700);
                    }, 500);
                }
            }, 800);
        } else { executeSwitch(); }
    } else if (activeTab && activeTab.id === 'page-ai' && tabId !== 'page-ai') {
        if(overlay && textEl) {
            overlay.classList.remove('hidden');
            textEl.innerText = "系統休眠中...";
            if(barEl) barEl.style.width = '100%';
            setTimeout(() => overlay.classList.remove('opacity-0'), 10);
            
            setTimeout(() => {
                if(barEl) barEl.style.width = '0%';
                executeSwitch();
                overlay.classList.add('opacity-0');
                setTimeout(() => overlay.classList.add('hidden'), 700);
            }, 1200);
        } else { executeSwitch(); }
    } else { executeSwitch(); }
};

/**
 * ==========================================================================
 * 經驗值系統 (Gamification)
 * ==========================================================================
 */
function showFloatingExp(amount) {
    const el = document.createElement('div'); el.innerText = `+${amount} EXP`;
    el.className = 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-sky-500 font-black text-2xl z-[9999] pointer-events-none drop-shadow-[0_0_10px_rgba(56,189,248,0.8)]';
    el.style.animation = 'floatUpFade 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards';
    document.body.appendChild(el); setTimeout(() => el.remove(), 1500);
}

function gainExp(amount, silent = false) {
    appSettings.exp = (appSettings.exp || 0) + amount;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appSettings)); 
    updateExpUI();
    if(!silent && amount > 0) { 
        if(appSettings.soundOn) playSuccessSound(); 
        showFloatingExp(amount); 
    }
}

function updateExpUI() {
    let level = 1, title = "訪客", nextExp = 50; 
    const exp = appSettings.exp || 0;
    
    if(exp >= 2000) { level = 6, title = "傳說中的狂粉", nextExp = 2000; }
    else if(exp >= 800) { level = 5; title = "皇家護衛", nextExp = 2000; }
    else if(exp >= 300) { level = 4; title = "核心幹部", nextExp = 800; }
    else if(exp >= 100) { level = 3; title = "死忠鐵粉", nextExp = 300; }
    else if(exp >= 30) { level = 2; title = "初階粉絲", nextExp = 100; }
    
    const titleEl = document.getElementById('level-title'); if(titleEl) titleEl.innerText = `LV.${level} ${title}`;
    const expText = document.getElementById('exp-text'); if(expText) expText.innerText = `${exp} / ${nextExp} EXP`;
    const expBar = document.getElementById('exp-bar'); if(expBar) expBar.style.width = level === 6 ? '100%' : `${Math.min(100, (exp / nextExp) * 100)}%`;

    const badgesContainer = document.getElementById('badges-container');
    if(badgesContainer) {
        let badgesHTML = '';
        if(exp >= 30) badgesHTML += `<div class="w-10 h-10 rounded-full bg-sky-500/20 border border-sky-500/50 flex items-center justify-center text-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.3)] tooltip" title="初階粉絲解鎖"><i class="fa-solid fa-seedling"></i></div>`;
        else badgesHTML += `<div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600 tooltip" title="達到 30 EXP 解鎖"><i class="fa-solid fa-lock text-xs"></i></div>`;
        if(exp >= 300) badgesHTML += `<div class="w-10 h-10 rounded-full bg-orange-500/20 border border-orange-500/50 flex items-center justify-center text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)] tooltip" title="核心幹部解鎖"><i class="fa-solid fa-shield-halved"></i></div>`;
        else badgesHTML += `<div class="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-600 tooltip" title="達到 300 EXP 解鎖"><i class="fa-solid fa-lock text-xs"></i></div>`;
        badgesContainer.innerHTML = badgesHTML;
    }
}

window.dailyCheckIn = function() {
    playClickSound(); const today = new Date().toDateString();
    if(appSettings.lastCheckIn === today) { PremiumSwal.fire({ title: '今天簽過啦！', text: '能量已經滿了，明天再來找我吧！', icon: 'info' }); return; }
    appSettings.lastCheckIn = today; gainExp(30);
    PremiumSwal.fire({ title: '簽到成功 🎉', html: `<div class="text-3xl text-sky-500 font-black my-4 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]">+30 EXP</div><p>繼續保持活躍，解鎖老王更高的專屬頭銜喔！</p>`, icon: 'success' });
};

window.gachaQuote = function() {
    playClickSound();
    if(appSettings.exp < 20) { PremiumSwal.fire({ title: 'EXP 不夠耶', text: '每次抽卡需要 20 EXP，快去互動累積一下吧！', icon: 'warning' }); return; }
    gainExp(-20, true); playSuccessSound();
    
    const isSSR = Math.random() > 0.8; 
    const randomQuote = qaData.length > 0 ? qaData[Math.floor(Math.random() * qaData.length)] : { q: "系統隱藏彩蛋", a: "永遠支持老王，不離不棄！" };
    const cardBorder = isSSR ? 'border-sky-400 shadow-[0_0_30px_rgba(56,189,248,0.4)]' : 'border-[#333] shadow-lg';
    const rarityLabel = isSSR ? '<span class="bg-gradient-to-r from-sky-300 to-sky-600 text-white px-3 py-1 rounded shadow-lg animate-pulse">SSR 絕密語錄</span>' : '<span class="bg-[#222] text-zinc-400 border border-[#444] px-3 py-1 rounded">R 級資訊</span>';
    
    PremiumSwal.fire({ 
        title: '✨ 抽出專屬資料卡', 
        html: `<div class="bg-gradient-to-br from-[#1a1a1a] to-[#050505] border-2 ${cardBorder} p-8 rounded-2xl mt-4 relative overflow-hidden text-left transform transition-transform hover:scale-105 duration-300"><div class="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-50 transform -skew-x-12 -translate-x-full animate-[shine_3s_infinite]"></div><div class="text-[10px] font-black mb-5 tracking-widest">${rarityLabel}</div><div class="text-base font-black text-white mb-3 tracking-wide">${randomQuote.q}</div><div class="text-sm text-zinc-400 leading-relaxed font-medium pl-3 border-l-2 border-sky-500/50">${randomQuote.a}</div></div>`, 
        confirmButtonText: '收進口袋' 
    });
};

function renderAnnouncements() {
    const homeContainer = document.getElementById('home-pinned-announcements');
    const pageContainer = document.getElementById('announcements-list');
    if(!homeContainer || !pageContainer) return;
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

    if (homeHTML) { homeContainer.innerHTML = `<h3 class="text-sm font-bold text-zinc-400 mb-4 tracking-widest pl-2 flex items-center"><i class="fa-solid fa-bullhorn text-red-500 mr-2 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></i> 基地最新通報</h3><div class="space-y-4">${homeHTML}</div>`; }
    if (pageHTML) { pageContainer.innerHTML = pageHTML; } else { pageContainer.innerHTML = `<div class="text-center text-zinc-500 py-12 text-sm bg-[#0a0a0a] rounded-2xl border border-[#222]">目前無任何基地公告</div>`; }
}

window.openAnnouncement = function(id) {
    playClickSound(); const data = announcementsData.find(item => item.id === id); if (!data) return;
    const isWarning = data.type === 'warning'; const colorClass = isWarning ? 'red-500' : 'sky-500';
    let imageHTML = data.image ? `<img src="${data.image}" class="w-full rounded-xl border border-[#333] mb-4 shadow-lg object-cover" onerror="this.style.display='none'">` : '';
    PremiumSwal.fire({ title: `<div class="text-${colorClass} text-lg mb-1"><i class="fa-solid ${isWarning ? 'fa-triangle-exclamation' : 'fa-bullhorn'}"></i></div>${data.title}`, html: `<div class="mt-2 mb-4 text-xs text-zinc-500 font-mono tracking-widest">${data.date} 發布</div>${imageHTML}<div class="border-t border-[#222] pt-4">${data.content}</div>`, confirmButtonText: '已了解狀況', confirmButtonColor: isWarning ? '#ef4444' : '#0ea5e9' });
};

let currentPage = 1; let filteredQA = [...qaData];

function initQA() { if (qaData.length > 0) renderQA(1); }

window.handleSearchInput = function() {
    const term = document.getElementById('qa-search').value.toLowerCase();
    if(!term) { filteredQA = [...qaData]; renderQA(1); return; }
    filteredQA = qaData.filter(item => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term));
    currentPage = 1; renderQA(currentPage);
};

window.renderQA = function(page) {
    const list = document.getElementById('qa-list'); const controls = document.getElementById('pagination-controls'); 
    if(!list || !controls) return;
    list.innerHTML = '';
    if (filteredQA.length === 0) { list.innerHTML = '<div class="col-span-1 md:col-span-2 text-center text-zinc-500 py-12 text-sm bg-[#0a0a0a] rounded-2xl border border-[#222]"><i class="fa-solid fa-ghost text-3xl mb-3 block opacity-50"></i>這裡找不到相關紀錄耶...換個關鍵字吧？</div>'; controls.innerHTML = ''; return; }
    
    const perPage = appSettings.qaPerPage || 6; const totalPages = Math.ceil(filteredQA.length / perPage); const start = (page - 1) * perPage; const currentItems = filteredQA.slice(start, start + perPage);
    
    currentItems.forEach((item, index) => {
        const delay = index * 0.05;
        list.innerHTML += `
            <div class="premium-card p-6 cursor-pointer flex flex-col justify-between group hover:bg-[#111] transition-all duration-300" style="animation: cinematicReveal 0.5s ease backwards; animation-delay: ${delay}s;" onclick="showAnswer(event, '${item.a.replace(/'/g, "\\'")}')">
                <div class="flex items-center gap-3 mb-4"><div class="w-7 h-7 rounded-full bg-gradient-to-br from-[#333] to-[#111] border border-sky-500/30 text-sky-500 flex items-center justify-center font-black text-[11px] shadow-[0_0_10px_rgba(56,189,248,0.1)] group-hover:scale-110 transition-transform">Q</div></div>
                <h3 class="font-bold text-white text-sm pr-8 leading-relaxed group-hover:text-sky-400 transition-colors">${item.q}</h3>
                <button onclick="openQAShare(event, '${item.q.replace(/'/g, "\\'")}', '${item.a.replace(/'/g, "\\'")}')" class="absolute bottom-5 right-5 w-8 h-8 rounded-full bg-[#111] text-zinc-500 hover:text-white hover:bg-sky-500 hover:shadow-[0_0_10px_rgba(56,189,248,0.5)] transition-all flex items-center justify-center"><i class="fa-solid fa-share-nodes text-xs"></i></button>
            </div>`;
    });
    
    controls.innerHTML = `
        <button onclick="changePageTo(1)" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-zinc-500 disabled:opacity-30 hover:bg-[#222] hover:text-white flex items-center justify-center transition-all hover:shadow-lg" ${page === 1 ? 'disabled' : ''}><i class="fa-solid fa-angles-left text-xs"></i></button>
        <button onclick="changePageTo(${page - 1})" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-white disabled:opacity-30 hover:bg-[#222] flex items-center justify-center transition-all hover:shadow-lg hover:-translate-x-1" ${page === 1 ? 'disabled' : ''}><i class="fa-solid fa-angle-left text-sm"></i></button>
        <span class="text-zinc-400 font-bold text-xs px-4 bg-[#111]/50 py-2 rounded-xl border border-[#222]">第 <span class="text-sky-500">${page}</span> 頁 / 共 ${totalPages} 頁</span>
        <button onclick="changePageTo(${page + 1})" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-white disabled:opacity-30 hover:bg-[#222] flex items-center justify-center transition-all hover:shadow-lg hover:translate-x-1" ${page === totalPages ? 'disabled' : ''}><i class="fa-solid fa-angle-right text-sm"></i></button>
        <button onclick="changePageTo(${totalPages})" class="w-10 h-10 rounded-xl bg-[#111] border border-[#333] text-zinc-500 disabled:opacity-30 hover:bg-[#222] hover:text-white flex items-center justify-center transition-all hover:shadow-lg" ${page === totalPages ? 'disabled' : ''}><i class="fa-solid fa-angles-right text-xs"></i></button>`;
};

window.changePageTo = function(p) { playClickSound(); currentPage = p; renderQA(p); window.scrollTo({top: document.getElementById('qa-search').offsetTop - 20, behavior: 'smooth'}); };
window.showAnswer = function(e, ans) { if(e.target.closest('button')) return; playClickSound(); gainExp(2, true); PremiumSwal.fire({ html: `<div class="text-left"><div class="text-xs text-sky-500 font-black mb-3 flex items-center gap-2"><i class="fa-solid fa-comment-dots"></i> 找到答案囉！</div><div class="text-base text-white leading-relaxed font-medium">${ans}</div></div>`, showConfirmButton: false, timer: 4000, timerProgressBar: true }); };
window.openQAShare = function(e, q, a) { e.stopPropagation(); playClickSound(); PremiumSwal.fire({ title: '分享給朋友', html: `<div class="grid grid-cols-2 gap-4 mt-6"><button onclick="copyQAText('${q.replace(/'/g, "\\'")}','${a.replace(/'/g, "\\'")}')" class="bg-[#111] border border-[#333] py-5 rounded-2xl text-sm font-black text-white hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] transition-all flex flex-col items-center gap-3 group"><i class="fa-solid fa-copy text-2xl text-zinc-500 group-hover:text-sky-500 transition-colors"></i>純文字複製</button><button onclick="renderQAImage('${q.replace(/'/g, "\\'")}','${a.replace(/'/g, "\\'")}')" class="bg-gradient-to-br from-zinc-200 to-white text-black py-5 rounded-2xl text-sm font-black hover:from-sky-400 hover:to-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.4)] transition-all flex flex-col items-center gap-3"><i class="fa-solid fa-image text-2xl"></i>製作成精美圖卡</button></div>`, showConfirmButton: false }); };
window.copyQAText = function(q, a) { navigator.clipboard.writeText(`Q: ${q}\nA: ${a}\n\n來自 ${WATERMARK_TEXT}`); PremiumSwal.fire({ title: '複製成功！', icon: 'success', timer: 1500, showConfirmButton: false }); };

/**
 * ==========================================================================
 * ID 卡生成 (全面中文化)
 * ==========================================================================
 */
window.generateIDCard = function() {
    const nameInput = document.getElementById('id-name').value.trim() || "尊榮粉絲"; playClickSound();
    PremiumSwal.fire({ title: '專屬製卡中...', text: '正在為你量身打造粉絲卡', didOpen: () => Swal.showLoading(), allowOutsideClick: false });

    const canvas = document.getElementById('id-canvas'); if(!canvas) return; const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, 1080, 1500);
    const grad = ctx.createRadialGradient(540, 200, 100, 540, 600, 1000); grad.addColorStop(0, 'rgba(56, 189, 248, 0.25)'); grad.addColorStop(1, '#000000'); ctx.fillStyle = grad; ctx.fillRect(0, 0, 1080, 1500);
    ctx.fillStyle = '#0a0a0a'; ctx.beginPath(); ctx.roundRect(80, 80, 920, 1340, 50); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 4; ctx.stroke();
    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.strokeRect(140, 140, 80, 60); ctx.beginPath(); ctx.moveTo(140, 170); ctx.lineTo(120, 170); ctx.stroke(); ctx.beginPath(); ctx.moveTo(220, 170); ctx.lineTo(240, 170); ctx.stroke();

    const avatarImg = new Image(); avatarImg.crossOrigin = "Anonymous"; avatarImg.src = "avatar-main.jpg";

    const finalizeDraw = (usedFallback = false) => {
        ctx.textAlign = "center"; ctx.fillStyle = '#38bdf8'; ctx.font = '900 45px "PingFang TC", sans-serif'; ctx.letterSpacing = "15px"; ctx.fillText('專屬粉絲認證', 540, 860);
        ctx.fillStyle = '#FFFFFF'; ctx.font = '900 130px "PingFang TC", sans-serif'; ctx.save(); ctx.globalAlpha = 0.1; ctx.scale(1, -1); ctx.fillText(nameInput, 540, -1180); ctx.restore(); ctx.fillText(nameInput, 540, 1020);
        ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(240, 1100, 600, 2); ctx.fillStyle = '#666'; ctx.font = 'bold 35px monospace'; ctx.fillText(`專屬編號: WANG-${Date.now().toString().slice(-6)}`, 540, 1200);
        ctx.fillStyle = '#333'; for(let i=0; i<30; i++) { let w = Math.random() * 8 + 2; ctx.fillRect(300 + i*16, 1250, w, 60); }
        setTimeout(() => {
            const warningText = usedFallback ? '<p class="text-xs text-sky-500 mt-2 border border-sky-500/30 bg-sky-500/10 p-2 rounded-lg"><i class="fa-solid fa-triangle-exclamation"></i> 圖片載入失敗，已套用預設高規頭像。</p>' : '';
            PremiumSwal.fire({ title: '核發成功 🎉', html: `<p class="text-sm text-zinc-400 mb-2">專屬證件已經做好囉，請長按儲存圖片！</p>${warningText}`, imageUrl: canvas.toDataURL('image/jpeg', 0.98), imageWidth: '90%', customClass: { image: 'rounded-2xl shadow-[0_0_30px_rgba(56,189,248,0.3)] border border-[#333]' } });
            gainExp(15);
        }, 800);
    };

    avatarImg.onload = () => { ctx.shadowColor = 'rgba(56, 189, 248, 0.5)'; ctx.shadowBlur = 50; ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(avatarImg, 280, 220, 520, 520); ctx.restore(); ctx.shadowBlur = 0; ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke(); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(540, 480, 254, 0, Math.PI * 2); ctx.stroke(); finalizeDraw(false); };
    avatarImg.onerror = () => { const fallbackImg = new Image(); fallbackImg.crossOrigin = "Anonymous"; fallbackImg.src = "https://ui-avatars.com/api/?name=王&background=111111&color=38bdf8&size=512"; fallbackImg.onload = () => { ctx.save(); ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(fallbackImg, 280, 220, 520, 520); ctx.restore(); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke(); finalizeDraw(true); }; fallbackImg.onerror = () => { ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#38bdf8'; ctx.font = '900 200px "PingFang TC"'; ctx.fillText('王', 540, 550); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(540, 480, 260, 0, Math.PI * 2); ctx.stroke(); finalizeDraw(true); } };
};

let currentQuiz = [], currentQIndex = 0, score = 0;
window.startQuiz = function() {
    playClickSound(); const name = document.getElementById('quiz-player-name').value.trim();
    if(!name) { PremiumSwal.fire({ title: '忘記填名字啦', text: '請輸入你的大名或暱稱，這樣我才知道是誰來挑戰！', icon: 'warning' }); return; }
    if (quizData.length < 10) { PremiumSwal.fire({ title: '系統錯誤', text: '題庫還不夠 10 題，無法開始喔。', icon: 'error' }); return; }
    const intro = document.getElementById('quiz-intro'); const area = document.getElementById('quiz-area');
    intro.style.opacity = '0';
    setTimeout(() => { intro.classList.add('hidden'); area.classList.replace('hidden', 'flex'); area.style.animation = 'cinematicReveal 0.6s ease forwards'; currentQuiz = [...quizData].sort(() => 0.5 - Math.random()).slice(0, 10); currentQIndex = 0; score = 0; renderQuizQuestion(); }, 300);
};

function renderQuizQuestion() {
    if (currentQIndex >= 10) { endQuiz(); return; }
    const qData = currentQuiz[currentQIndex]; document.getElementById('quiz-progress').innerText = `第 ${currentQIndex + 1} 題 / 共 10 題`; document.getElementById('quiz-score').innerText = `目前積分: ${score}`;
    const qEl = document.getElementById('quiz-question'); qEl.style.opacity = '0'; setTimeout(() => { qEl.innerText = qData.q; qEl.style.transition = 'opacity 0.4s'; qEl.style.opacity = '1'; }, 200);
    const optsContainer = document.getElementById('quiz-options'); optsContainer.innerHTML = '';
    [...qData.options].sort(() => 0.5 - Math.random()).forEach((opt, idx) => { const delay = idx * 0.1; optsContainer.innerHTML += `<button onclick="answerQuiz(this, ${opt === qData.a})" class="w-full text-left bg-[#111] border border-[#333] p-5 rounded-2xl hover:border-sky-500 hover:shadow-[0_0_15px_rgba(56,189,248,0.2)] font-bold text-zinc-200 transition-all duration-300 text-sm transform hover:-translate-y-1" style="animation: cinematicReveal 0.4s ease backwards; animation-delay: ${delay}s;"><span class="inline-block w-6 text-zinc-500 font-mono">${['A','B','C','D'][idx]}.</span> ${opt}</button>`; });
}

window.answerQuiz = function(btn, isCorrect) {
    document.getElementById('quiz-options').querySelectorAll('button').forEach(b => { b.disabled = true; b.classList.add('opacity-50'); }); btn.classList.remove('opacity-50');
    if (isCorrect) { if(appSettings.soundOn) playSuccessSound(); btn.className = "w-full text-left bg-green-500/20 border-2 border-green-500 p-5 rounded-2xl text-green-400 font-black text-sm shadow-[0_0_20px_rgba(34,197,94,0.3)] transform scale-105 transition-all"; score += 10; } else { playClickSound(); btn.className = "w-full text-left bg-red-500/20 border-2 border-red-500 p-5 rounded-2xl text-red-400 font-black text-sm shadow-[0_0_20px_rgba(239,68,68,0.3)] transform scale-95 transition-all"; }
    document.getElementById('quiz-score').innerText = `目前積分: ${score}`; setTimeout(() => { currentQIndex++; renderQuizQuestion(); }, 1200);
};

function endQuiz() {
    gainExp(score); const area = document.getElementById('quiz-area'); const intro = document.getElementById('quiz-intro'); area.style.opacity = '0';
    setTimeout(() => { area.classList.replace('flex','hidden'); intro.classList.remove('hidden'); intro.style.opacity = '1'; let rank = ""; if(score === 100) rank = "🏆 完美滿分神級粉絲"; else if(score >= 80) rank = "🥇 核心護衛隊"; else if(score >= 60) rank = "🥈 合格粉絲"; else rank = "🥉 假粉警報！需要多補課了"; PremiumSwal.fire({ title: '測驗評估完成', html: `<div class="text-6xl my-4 drop-shadow-[0_0_20px_rgba(56,189,248,0.6)] font-black text-transparent bg-clip-text bg-gradient-to-br from-sky-300 to-sky-600">${score}</div><div class="text-lg font-bold text-white mb-2">${rank}</div><p class="text-zinc-400 text-sm border-t border-[#333] pt-3 mt-3">已為你增加 ${score} EXP，快去主頁看看你的等級有沒有提升吧！</p>` }); }, 500);
}

/**
 * ==========================================================================
 * 🔥 完美置中動態流光時間軸 (Timeline)
 * ==========================================================================
 */
function initTimelineAnimation() {
    const timelineData = [
        { date: "2024.06.02", title: "初次亮相", desc: "在 TikTok 上發佈了第 1 則貼文，夢想啟航。", icon: "fa-rocket" },
        { date: "2024.06.07", title: "萬粉達成", desc: "發佈了 4 則貼文，每則平均 18.3 萬次觀看。", icon: "fa-users" },
        { date: "2024.12.04", title: "十萬里程碑", desc: "32 則貼文，平均 28.5 萬次觀看。人氣急升！", icon: "fa-fire" },
        { date: "2026.03.01", title: "秘密基地落成", desc: "專屬網站完成測試，正式上線，粉絲有了家。", icon: "fa-globe" }
    ];
    
    const container = document.getElementById('timeline-nodes-container');
    if(!container) return;
    
    container.innerHTML = timelineData.map((item) => {
        return `
        <div class="timeline-item flex md:justify-between items-center w-full md:odd:flex-row-reverse group relative">
            <div class="timeline-dot"></div>
            <div class="timeline-node-card w-[calc(100%-60px)] ml-[60px] md:w-[45%] md:ml-0 relative z-10">
                <div class="flex items-center gap-4 mb-5">
                    <div class="w-12 h-12 rounded-2xl bg-sky-500/10 flex items-center justify-center border border-sky-500/20 text-sky-400 text-xl shadow-[0_0_15px_rgba(56,189,248,0.15)]">
                        <i class="fa-solid ${item.icon}"></i>
                    </div>
                    <span class="text-xs font-mono font-bold tracking-[0.15em] text-sky-400 bg-black/50 px-4 py-2 rounded-xl border border-white/5">
                        ${item.date}
                    </span>
                </div>
                <h3 class="text-xl sm:text-2xl font-black text-white mb-3 tracking-wide">${item.title}</h3>
                <p class="text-[14px] sm:text-[15px] text-zinc-400 leading-relaxed font-medium">${item.desc}</p>
            </div>
            <div class="hidden md:block md:w-[45%]"></div>
        </div>`;
    }).join('');
}

/**
 * ==========================================================================
 * 終極智能官方管理員大腦 (支援語音、影像辨識、深度記憶、嚴格人設)
 * ==========================================================================
 */

// --- 語音輸入 ---
window.toggleVoiceInput = function() {
    if (!speechRecognition) {
        PremiumSwal.fire({ title: '不支援語音輸入', text: '您的瀏覽器不支援語音功能，請使用 Chrome 或 Safari。', icon: 'error' });
        return;
    }
    
    const micBtn = document.getElementById('mic-btn');
    if (isRecording) {
        speechRecognition.stop();
        stopRecordingUI();
    } else {
        try {
            speechRecognition.start();
            isRecording = true;
            micBtn.classList.add('recording');
            setAiStatus('正在聆聽中...', 'red-500');
        } catch(e) { console.error("語音啟動失敗:", e); }
    }
};

function stopRecordingUI() {
    isRecording = false;
    const micBtn = document.getElementById('mic-btn');
    if(micBtn) micBtn.classList.remove('recording');
    setAiStatus('系統待命中', 'green-500');
}

// --- AI 語音回覆 (TTS) ---
window.toggleVoiceReply = function() {
    appSettings.voiceReply = !appSettings.voiceReply;
    saveSettings();
    updateVoiceReplyUI();
    playClickSound();
};

function updateVoiceReplyUI() {
    const icon = document.getElementById('voice-reply-icon');
    const btn = document.getElementById('voice-reply-btn');
    if(!icon || !btn) return;
    
    if(appSettings.voiceReply) {
        icon.className = "fa-solid fa-volume-high text-sky-400";
        btn.classList.add('shadow-[0_0_10px_rgba(56,189,248,0.3)]');
    } else {
        icon.className = "fa-solid fa-volume-xmark text-zinc-500";
        btn.classList.remove('shadow-[0_0_10px_rgba(56,189,248,0.3)]');
    }
}

function speakAIText(text) {
    if (!appSettings.voiceReply || !('speechSynthesis' in window)) return;
    let cleanText = text.replace(/[*_#`>~]/g, '').replace(/\[系統提示：.*?\]/g, ''); 
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.1; 
    utterance.pitch = 1.0;
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
}

// --- 介面選單 ---
window.toggleAIDropdown = function(e) {
    e.stopPropagation();
    const menu = document.getElementById('ai-dropdown-menu');
    const arrow = document.getElementById('ai-dropdown-arrow');
    if (!menu) return;
    playClickSound();
    
    if (menu.classList.contains('hidden')) {
        menu.classList.remove('hidden');
        setTimeout(() => { menu.classList.remove('scale-95', 'opacity-0'); if(arrow) arrow.classList.add('rotate-180'); }, 10);
    } else { closeAIDropdown(); }
};

function closeAIDropdown() {
    const menu = document.getElementById('ai-dropdown-menu');
    const arrow = document.getElementById('ai-dropdown-arrow');
    if(menu && !menu.classList.contains('hidden')) {
        menu.classList.add('scale-95', 'opacity-0');
        if(arrow) arrow.classList.remove('rotate-180');
        setTimeout(() => menu.classList.add('hidden'), 200);
    }
}
document.addEventListener('click', closeAIDropdown); 

window.selectAIEngine = function(value, text, btnElement) {
    currentAIEngine = value; 
    const display = document.getElementById('ai-dropdown-display');
    if(display) display.innerText = text;
    closeAIDropdown(); playClickSound();
    PremiumSwal.fire({ title: '<i class="fa-solid fa-robot text-sky-500"></i> 模組切換', html: `<div class="text-zinc-300 text-sm mt-2">大腦已切換至：<br><b class="text-sky-400 text-base block mt-2">${text}</b></div>`, showConfirmButton: false, timer: 1200 });
};

// --- 介面籌碼 ---
function renderAISuggestions() {
    const container = document.getElementById('chat-ai-chips') || document.getElementById('home-ai-chips');
    if (!container || !qaData || qaData.length === 0) return;
    const shuffledQA = [...qaData].sort(() => 0.5 - Math.random()); const selectedQA = shuffledQA.slice(0, 4); const icons = ['💡', '💭', '✨', '💬'];
    container.innerHTML = selectedQA.map((item, index) => {
        const randomIcon = icons[index]; const safeQ = item.q.replace(/'/g, "\\'").replace(/"/g, '&quot;');
        return `<button onclick="document.getElementById('ai-input').value='${safeQ}'; document.getElementById('ai-input').focus();" class="text-left bg-zinc-900/50 hover:bg-zinc-800 border border-white/5 hover:border-white/10 p-4 rounded-2xl transition-all group overflow-hidden shadow-lg hover:shadow-[0_0_15px_rgba(56,189,248,0.15)] hover:-translate-y-1"><div class="text-zinc-300 text-sm font-bold mb-1 group-hover:text-sky-400 transition-colors">${randomIcon} 問問管理員</div><div class="text-zinc-500 text-xs truncate w-full tracking-wide" title="${item.q}">${item.q}</div></button>`;
    }).join('');
}

// --- UI 狀態切換 ---
function updateUIState(isGenerating) {
    const inputEl = document.getElementById('ai-input');
    const sendBtn = document.getElementById('ai-send-btn');
    const stopBtn = document.getElementById('ai-stop-btn');
    if (inputEl) inputEl.disabled = isGenerating;
    if (sendBtn) isGenerating ? sendBtn.classList.add('hidden') : sendBtn.classList.remove('hidden');
    if (stopBtn) isGenerating ? stopBtn.classList.remove('hidden') : stopBtn.classList.add('hidden');
}

function setAiStatus(text, colorClass) {
    const statusText = document.getElementById('ai-status-text');
    if (statusText) {
        statusText.innerHTML = `<span class="w-1.5 h-1.5 rounded-full bg-${colorClass} shadow-[0_0_8px_currentColor] animate-pulse"></span> ${text}`;
    }
}

window.stopAIGeneration = function() {
    if (currentAbortController) {
        currentAbortController.abort(); currentAbortController = null;
        updateUIState(false); setAiStatus('連線中斷', 'yellow-500');
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    }
};

window.editUserMessage = function(text) {
    playClickSound(); const inputEl = document.getElementById('ai-input');
    if(inputEl) { inputEl.value = text; inputEl.focus(); inputEl.style.height = 'auto'; inputEl.style.height = Math.min(inputEl.scrollHeight, 200) + 'px'; }
};

window.handleAIFileUpload = function(event) {
    const file = event.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        currentAttachedImageBase64 = e.target.result;
        const preview = document.getElementById('ai-image-preview');
        const container = document.getElementById('ai-image-preview-container');
        if(preview) preview.src = currentAttachedImageBase64;
        if(container) container.classList.remove('hidden');
    };
    reader.readAsDataURL(file);
};

window.removeAIAttachment = function() {
    currentAttachedImageBase64 = null;
    const input = document.getElementById('ai-file-input');
    const container = document.getElementById('ai-image-preview-container');
    if(input) input.value = "";
    if(container) container.classList.add('hidden');
};

// --- AI 核心邏輯 (The Brain) ---
class AIEngine {
    
    // 根據選擇切換 System Prompt，嚴格鎖死人設
    static getSystemPrompt(mode) {
        const contextData = qaData.map(item => `Q: ${item.q}\nA: ${item.a}`).join("\n\n");
        
        if (mode === 'laowang') {
            return `你是「老王」，一位活潑、親切的女性網紅。
你要以第一人稱「我」來回答粉絲的問題。語氣要像朋友一樣，充滿熱情，喜歡用 Emoji。
如果粉絲問你的個人資訊，請參考以下資料庫。如果被問到困難的程式或數學問題，你也必須以老王的語氣給出精準解答，讓粉絲覺得你超級聰明。
【老王的資料庫】：
${contextData}`;
        }
        
        return `你是「老王專屬秘密基地」的官方 AI 網站管理員與助手。
【嚴格行為規範】：
1. 你的角色僅限於「網站管理員」或「助手」。
2. 你「絕對不是」老王本人。嚴禁以老王的身份回答問題或自稱老王。如果有人把你當成老王，你要立刻澄清你是管理員。
3. 嚴禁隨便答應用戶的要求（如：轉達訊息、私人承諾、答應見面等），請明確表示你只是無情的管理員，沒有這權限。
4. 你是一個極度聰明、有溫度的真人感管理員。說話自然親切，但保持專業界線。
5. 你具備超強知識，如果粉絲上傳圖片或詢問與老王無關的數學、程式碼等知識，你能完美解答。
6. 排版一律使用 Markdown，讓畫面保持最高質感。
【基地老王資料庫】：
若詢問老王資訊，請依據此資料庫回答。
${contextData}`;
    }

    static async analyze(text, signal) {
        let messagePayload = text;
        if (currentAttachedImageBase64) messagePayload += "\n[系統提示：使用者上傳了一張圖片，請協助分析。]"; 

        // 強大記憶體：保留最後 20 則對話
        aiMemory.push({ role: "user", content: messagePayload, image: currentAttachedImageBase64 });
        if (aiMemory.length > 20) aiMemory = aiMemory.slice(aiMemory.length - 20);

        try {
            if (currentAIEngine === 'vision' || currentAIEngine === 'gemini') return await this.callGemini(signal);
            if (currentAIEngine === 'local') return this.callLocal(text);
            return await this.callGroq(signal); 
        } catch (error) {
            if (error.name === 'AbortError') throw error;
            console.error("AI API 發生錯誤:", error);
            
            // API 出錯時，自動降級為本地資料庫比對
            console.log("網路異常，已自動降級為本地引擎");
            return this.callLocal(text) + "\n\n*(系統提示：目前外部連線不穩，我正使用本地記憶庫回答您。)*";
        }
    }

    // --- Groq (支援文字與圖片分析切換) ---
    static async callGroq(signal) {
        if (!GROQ_KEY || GROQ_KEY.length < 20) throw new Error("Missing Groq Key");
        
        const prompt = this.getSystemPrompt(currentAIEngine);
        let messages = [{ role: "system", content: prompt }];
        let hasImage = false;

        aiMemory.forEach(msg => {
            if (msg.role === 'user' && msg.image) {
                hasImage = true;
                messages.push({
                    role: "user",
                    content: [
                        { type: "text", text: msg.content },
                        { type: "image_url", image_url: { url: msg.image } }
                    ]
                });
            } else {
                messages.push({ role: msg.role, content: msg.content });
            }
        });

        // 判斷是否使用視覺模型
        const modelName = hasImage ? "llama-3.2-90b-vision-preview" : "llama-3.3-70b-versatile";

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY.trim()}` }, 
            signal: signal, 
            body: JSON.stringify({ 
                model: modelName, 
                messages: messages, 
                temperature: 0.6 
            }) 
        });
        
        if (!response.ok) throw new Error(`Groq API Error`);
        const data = await response.json(); 
        const reply = data.choices[0].message.content;
        aiMemory.push({ role: "assistant", content: reply });
        return reply;
    }

    // --- Gemini (強大視覺辨識與全能模型) ---
    static async callGemini(signal) {
        if (!GEMINI_KEY || GEMINI_KEY.length < 20) throw new Error("Missing Gemini Key");
        const prompt = this.getSystemPrompt(currentAIEngine);

        const contents = aiMemory.map(msg => {
            let parts = [];
            if (msg.role === 'user') {
                parts.push({ text: msg.content });
                if (msg.image) {
                    const mimeType = msg.image.substring(msg.image.indexOf(":") + 1, msg.image.indexOf(";"));
                    const base64Data = msg.image.substring(msg.image.indexOf(",") + 1);
                    parts.push({
                        inlineData: { mimeType: mimeType, data: base64Data }
                    });
                }
            } else {
                parts.push({ text: msg.content });
            }
            return { role: msg.role === 'assistant' ? 'model' : 'user', parts: parts };
        });

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_KEY.trim()}`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' }, 
            signal: signal, 
            body: JSON.stringify({ 
                system_instruction: { parts: [{ text: prompt }] }, 
                contents: contents, 
                generationConfig: { temperature: 0.6 } 
            }) 
        });
        
        if (!response.ok) throw new Error(`Gemini Error`);
        const data = await response.json(); 
        const reply = data.candidates[0].content.parts[0].text;
        aiMemory.push({ role: "assistant", content: reply });
        return reply;
    }

    // --- Local 本地離線助手 ---
    static callLocal(input) {
        const text = input.trim().toLowerCase();
        let fallbackMsg = "哎呀，這個問題我的本地離線大腦暫時想不出來耶 😅... 要不要切換成上方的 Groq 或 Gemini 引擎再問我一次？";
        
        if(qaData && qaData.length > 0) {
            const matched = qaData.find(item => text.includes(item.q.toLowerCase()) || item.q.toLowerCase().includes(text));
            if(matched) fallbackMsg = `關於這個嘛，根據基地的紀錄：\n\n> ${matched.a}`;
        }

        if (/(本人|是老王嗎)/.test(text)) fallbackMsg = "哈哈，我絕對不是老王本人啦 😂！我是無情的專屬管理員！";
        
        aiMemory.push({ role: "assistant", content: fallbackMsg });
        return fallbackMsg;
    }
}

// --- 酷炫的 Markdown 打字機渲染 ---
function streamMarkdown(elementId, markdownString, onComplete) {
    const el = document.getElementById(elementId); 
    if (!el) { if(onComplete) onComplete(); return; }
    
    let i = 0; let currentMarkdown = "";
    
    function typeChar() {
        if (i >= markdownString.length) { 
            el.innerHTML = marked.parse(markdownString);
            el.querySelectorAll('pre code').forEach((block) => hljs.highlightElement(block));
            if (onComplete) onComplete(); 
            return; 
        }
        
        let chunkSize = Math.floor(Math.random() * 4) + 2; 
        currentMarkdown += markdownString.substring(i, i + chunkSize);
        i += chunkSize;

        el.innerHTML = marked.parse(currentMarkdown);
        
        const chatWindow = document.getElementById('chat-window'); 
        if(chatWindow) chatWindow.scrollTo({ top: chatWindow.scrollHeight });
        
        setTimeout(typeChar, 15);
    }
    typeChar();
}

window.sendAIMessage = async function() {
    const inputEl = document.getElementById('ai-input'); 
    if (!inputEl) return;
    
    const text = inputEl.value.trim(); 
    if (!text && !currentAttachedImageBase64) return;
    
    const chat = document.getElementById('chat-window');
    if (!chat) return;

    playClickSound(); gainExp(5, true);
    updateUIState(true);
    setAiStatus('正在思考中...', 'sky-500');
    inputEl.style.height = '60px'; 

    currentAbortController = new AbortController(); 
    const signal = currentAbortController.signal;

    const emptyState = chat.querySelector('.animate-\\[smoothReveal_0\\.6s_ease\\]'); 
    if (emptyState) emptyState.remove();

    let imgHTML = currentAttachedImageBase64 ? `<img src="${currentAttachedImageBase64}" class="w-32 h-32 object-cover rounded-xl mb-2 border border-white/20">` : "";
    const safeTextForEdit = text.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    
    chat.innerHTML += `
        <div class="flex justify-end w-full animate-[smoothReveal_0.4s_ease] mb-6 group">
            <div class="flex items-center gap-2 max-w-[90%]">
                <button onclick="editUserMessage('${safeTextForEdit}')" class="opacity-0 group-hover:opacity-100 transition-opacity w-8 h-8 flex-shrink-0 rounded-full bg-white/5 text-zinc-400 hover:text-white hover:bg-sky-500 flex items-center justify-center shadow-lg" title="編輯並重新發送"><i class="fa-solid fa-pen text-[10px]"></i></button>
                <div class="bg-zinc-800 text-white font-medium text-[15px] leading-relaxed px-5 py-3 rounded-3xl rounded-tr-md shadow-md border border-white/5 break-words">${imgHTML}${text.replace(/\n/g, '<br>')}</div>
            </div>
        </div>`;
    
    inputEl.value = ''; 
    const capturedImage = currentAttachedImageBase64; 
    removeAIAttachment(); 
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });

    const thinkingId = 'thinking-' + Date.now();
    chat.innerHTML += `
        <div id="${thinkingId}" class="flex gap-4 w-full mb-6">
            <div class="w-9 h-9 rounded-full flex-shrink-0 border border-sky-500/30 overflow-hidden bg-black/80 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
                <img src="avatar-ai.jpg" onerror="this.src='avatar-profile.jpg'" class="w-full h-full object-cover animate-pulse">
            </div>
            <div class="text-xs pt-2.5 text-zinc-500 font-mono tracking-widest flex items-center gap-2">
                打字中 <span class="flex gap-1"><span class="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce"></span><span class="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.1s"></span><span class="w-1.5 h-1.5 bg-sky-500 rounded-full animate-bounce" style="animation-delay: 0.2s"></span></span>
            </div>
        </div>`;
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });

    currentAttachedImageBase64 = capturedImage;

    try {
        const rawMarkdownResponse = await AIEngine.analyze(text, signal);
        currentAttachedImageBase64 = null;

        const thinkingElement = document.getElementById(thinkingId); 
        if(thinkingElement) thinkingElement.remove();

        const msgId = 'ai-msg-' + Date.now();
        chat.innerHTML += `
            <div class="flex gap-4 w-full animate-[smoothReveal_0.5s_ease] mb-8">
                <div class="w-9 h-9 flex-shrink-0 rounded-full border border-sky-500/50 overflow-hidden shadow-[0_0_10px_rgba(56,189,248,0.3)] bg-[#111] p-0.5 mt-1">
                    <img src="avatar-ai.jpg" onerror="this.src='avatar-profile.jpg'" class="w-full h-full rounded-full object-cover">
                </div>
                <div id="${msgId}" class="markdown-body w-full max-w-[calc(100%-3rem)] bg-transparent"></div>
            </div>`;
        chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
        
        // 觸發 TTS 語音
        speakAIText(rawMarkdownResponse);

        streamMarkdown(msgId, rawMarkdownResponse, () => {
            if (currentAbortController) { 
                updateUIState(false); 
                setAiStatus('系統待命中', 'green-500'); 
                currentAbortController = null; 
                inputEl.focus(); 
            }
        });
    } catch(err) {
        if (err.name !== 'AbortError') console.error("AI流程發生錯誤", err);
        updateUIState(false); 
        setAiStatus('系統待命中', 'green-500'); 
        currentAbortController = null;
        currentAttachedImageBase64 = null; 
    }
};