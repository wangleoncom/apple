/* ==========================================================================
   鹿🦌 QA 粉絲站 v8.1 - 終極防禦核心邏輯 (app.js)
   依賴：ld_qa.js, ld_quiz.js
   ========================================================================== */

const CURRENT_APP_VERSION = "8.1"; // ⚠️ 版本號控制，用於清除舊快取

// 資料庫防呆讀取
const qaData = window.QA_DB || [];
const quizData = window.QUIZ_DB || [];

// 系統設定狀態管理
let appSettings = {
    version: CURRENT_APP_VERSION,
    qaPerPage: 8,
    soundOn: true,
    powerSave: false
};

/* ================== 1. 版本控制與系統初始化 ================== */
document.addEventListener('DOMContentLoaded', async () => {
    checkVersionAndClearCache(); // 核心：檢查並清除舊版本
    loadSettings();
    
    document.getElementById('loading-text').innerText = "SCANNING ASSETS...";
    await detectAvatars();
    
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                initQA(); 
            }, 500);
        } else {
            initQA();
        }
    }, 800);
});

// 強制清除舊快取的函數
function checkVersionAndClearCache() {
    const saved = localStorage.getItem('deerAppSettings');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // 如果版本號不存在或低於當前版本，直接核彈級清空
            if (!parsed.version || parsed.version !== CURRENT_APP_VERSION) {
                console.log("偵測到舊版本資料，執行系統重置...");
                localStorage.removeItem('deerAppSettings');
            }
        } catch(e) {
            localStorage.removeItem('deerAppSettings');
        }
    }
}

// 供「重置系統緩存」按鈕使用
window.nukeAndReload = function() {
    localStorage.clear(); // 清空所有本地儲存
    sessionStorage.clear(); // 清空會話儲存
    // 強制瀏覽器從伺服器重新抓取網頁，忽略快取
    window.location.reload(true); 
};

// 底部導航切換
window.switchTab = function(tabId, btn) {
    if(appSettings.soundOn) playClickSound();
    
    // 再次確認強制隱藏所有頁面
    document.querySelectorAll('.page-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    // 顯示目標
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 音效
function playClickSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = 'sine'; osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.05);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.05);
    } catch(e) {}
}

/* ================== 2. 系統設定與儲存 ================== */
window.toggleSettings = function() {
    if(appSettings.soundOn) playClickSound();
    const modal = document.getElementById('settings-modal');
    const content = document.getElementById('settings-content');
    
    if (modal.classList.contains('hidden')) {
        modal.classList.remove('hidden');
        void modal.offsetWidth; 
        modal.classList.remove('opacity-0');
        content.classList.remove('scale-95');
    } else {
        modal.classList.add('opacity-0');
        content.classList.add('scale-95');
        setTimeout(() => modal.classList.add('hidden'), 300);
    }
};

function loadSettings() {
    const saved = localStorage.getItem('deerAppSettings');
    if (saved) {
        appSettings = JSON.parse(saved);
        document.getElementById('qa-per-page-slider').value = appSettings.qaPerPage;
        document.getElementById('qa-count-display').innerText = `${appSettings.qaPerPage} 題`;
        document.getElementById('sound-toggle').checked = appSettings.soundOn;
        document.getElementById('power-toggle').checked = appSettings.powerSave;
        applyPowerSave();
    }
}

window.saveSettings = function() {
    appSettings.soundOn = document.getElementById('sound-toggle').checked;
    appSettings.powerSave = document.getElementById('power-toggle').checked;
    localStorage.setItem('deerAppSettings', JSON.stringify(appSettings));
    applyPowerSave();
};

window.updateQASetting = function(val) {
    appSettings.qaPerPage = parseInt(val);
    document.getElementById('qa-count-display').innerText = `${val} 題`;
    localStorage.setItem('deerAppSettings', JSON.stringify(appSettings));
    currentPage = 1;
    renderQA(1);
};

function applyPowerSave() {
    if(appSettings.powerSave) {
        document.body.classList.remove('animate__animated');
    } else {
        document.body.classList.add('animate__animated');
    }
}

/* ================== 3. 首頁 QA 渲染 ================== */
let currentPage = 1;
let filteredQA = [...qaData];

function initQA() {
    if (qaData.length > 0) renderQA(1);
    else document.getElementById('qa-list').innerHTML = '<p class="col-span-full text-center text-red-400 font-bold p-6 bg-red-500/10 rounded-xl border border-red-500/20">無法載入資料庫，請檢查 ld_qa.js</p>';
}

window.filterQA = function() {
    const term = document.getElementById('qa-search').value.toLowerCase();
    if (!term) filteredQA = [...qaData];
    else filteredQA = qaData.filter(item => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term));
    currentPage = 1;
    renderQA(currentPage);
};

function renderQA(page) {
    const list = document.getElementById('qa-list');
    const controls = document.getElementById('pagination-controls');
    list.innerHTML = '';
    
    if (filteredQA.length === 0) {
        list.innerHTML = '<div class="col-span-full text-center text-slate-500 py-16 font-bold text-sm"><i class="fas fa-box-open mb-3 text-2xl"></i><br>找不到相關問題</div>';
        controls.innerHTML = ''; return;
    }

    const totalPages = Math.ceil(filteredQA.length / appSettings.qaPerPage);
    const start = (page - 1) * appSettings.qaPerPage;
    const currentItems = filteredQA.slice(start, start + appSettings.qaPerPage);

    currentItems.forEach((item, index) => {
        const num = String(start + index + 1).padStart(2, '0');
        list.innerHTML += `
            <div class="glass-panel hover-glass p-5 flex flex-col justify-between min-h-[160px] cursor-pointer group" onclick="if(appSettings.soundOn) playClickSound(); Swal.fire({title:'解答', text:'${item.a}', background:'#18181b', color:'#fff', confirmButtonColor:'#ec4899', customClass:{title:'text-pink-500', popup:'rounded-3xl border border-slate-700'}})">
                <div class="flex justify-between items-start mb-3">
                   <div class="w-8 h-8 rounded-full bg-pink-500/20 border border-pink-500/30 text-pink-400 flex items-center justify-center font-black text-sm">Q</div>
                   <div class="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-slate-400 text-[10px] font-black tracking-widest">#${num}</div>
                </div>
                <h3 class="text-[15px] font-bold text-white mb-3 line-clamp-2 leading-relaxed">${item.q}</h3>
                <div class="text-right mt-auto transition-transform group-hover:translate-x-1">
                   <span class="text-[10px] font-bold text-slate-500 tracking-widest">點擊翻看答案 <i class="fas fa-sync-alt ml-1"></i></span>
                </div>
            </div>
        `;
    });

    controls.innerHTML = `
        <button onclick="changePage(-1)" class="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 text-white rounded-full hover:bg-pink-500 transition disabled:opacity-20 disabled:hover:bg-white/5" ${page === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left text-xs"></i></button>
        <span class="text-slate-400 font-black text-[10px] tracking-[0.2em]">PAGE ${page} / ${totalPages}</span>
        <button onclick="changePage(1)" class="w-9 h-9 flex items-center justify-center bg-white/5 border border-white/10 text-white rounded-full hover:bg-pink-500 transition disabled:opacity-20 disabled:hover:bg-white/5" ${page === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right text-xs"></i></button>
    `;
}

window.changePage = function(delta) {
    if(appSettings.soundOn) playClickSound();
    currentPage += delta;
    renderQA(currentPage);
    document.getElementById('page-home').scrollIntoView({ behavior: 'smooth' });
};

/* ================== 4. AI 麋鹿 ================== */
window.handleAIKeyPress = function(e) { if (e.key === 'Enter') sendAIMessage(); };

window.sendAIMessage = function() {
    if(appSettings.soundOn) playClickSound();
    const inputEl = document.getElementById('ai-input');
    const text = inputEl.value.trim();
    if (!text) return;

    const chat = document.getElementById('chat-window');
    chat.innerHTML += `
        <div class="max-w-[85%] md:max-w-[70%] glass-panel p-4 shadow-lg text-sm leading-relaxed border border-pink-500/30 bg-[#2d1b2e] ml-auto text-right mb-4">
            ${text}
        </div>`;
    inputEl.value = '';
    chat.scrollTop = chat.scrollHeight;

    const bestMatch = findBestMatch(text);
    
    setTimeout(() => {
        let reply = "";
        if (bestMatch.score > 0.15) { 
            reply = `根據我的搜尋：<br><b class="text-pink-400 mt-2 block text-base">${bestMatch.item.a}</b>`;
        } else {
            const fallbacks = ["這個問題超出了我的資料庫範圍喔！下次直播問鹿吧🦌", "咦？這個我還沒學習到呢。", "這題太難了啦！(咬草) 🍃"];
            reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
        chat.innerHTML += `
            <div class="max-w-[85%] md:max-w-[70%] glass-panel p-4 shadow-lg text-sm leading-relaxed border border-white/5 bg-white/5 animate__animated animate__fadeInUp mb-4">
                ${reply}
            </div>`;
        chat.scrollTop = chat.scrollHeight;
        if(appSettings.soundOn) playClickSound();
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

/* ================== 5. 照片自動探測與認證卡 ================== */
let detectedAvatars = [];
let selectedAvatarId = 0;

async function detectAvatars() {
    const maxScan = 15; 
    const grid = document.getElementById('avatar-selection-grid');
    
    for (let i = 1; i <= maxScan; i++) {
        let url = `avatar-card${i}.jpg`;
        let exists = await new Promise((resolve) => {
            let img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });

        if (exists) detectedAvatars.push(url);
        else break; 
    }

    grid.innerHTML = '';
    if (detectedAvatars.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-slate-400 text-xs py-4 border border-dashed border-slate-600 rounded-lg">等待照片庫載入 (需放置 avatar-card1.jpg)</p>';
        return;
    }

    detectedAvatars.forEach((url, index) => {
        let isSelected = index === 0;
        grid.innerHTML += `
            <div class="avatar-option aspect-[3/4] rounded-xl cursor-pointer border-2 ${isSelected ? 'border-pink-500 scale-105 opacity-100' : 'border-transparent opacity-40 hover:opacity-80'} overflow-hidden relative transition transform shadow-md" onclick="selectAvatar(this, ${index})">
                <img src="${url}" class="w-full h-full object-cover pointer-events-none">
                <div class="icon-check absolute inset-0 bg-black/30 ${isSelected ? 'flex' : 'hidden'} items-center justify-center"><i class="fas fa-check-circle text-white text-3xl drop-shadow-md"></i></div>
            </div>
        `;
    });
}

window.selectAvatar = function(el, index) {
    if(appSettings.soundOn) playClickSound();
    selectedAvatarId = index;
    const parent = document.getElementById('avatar-selection-grid');
    parent.querySelectorAll('.avatar-option').forEach(d => {
        d.classList.remove('border-pink-500', 'opacity-100', 'scale-105');
        d.classList.add('border-transparent', 'opacity-40');
        d.querySelector('.icon-check').classList.add('hidden');
        d.querySelector('.icon-check').classList.remove('flex');
    });
    el.classList.remove('border-transparent', 'opacity-40');
    el.classList.add('border-pink-500', 'opacity-100', 'scale-105');
    el.querySelector('.icon-check').classList.remove('hidden');
    el.querySelector('.icon-check').classList.add('flex');
};

window.generateIDCard = function() {
    if(appSettings.soundOn) playClickSound();
    if(detectedAvatars.length === 0) {
        Swal.fire('錯誤', '沒有找到照片，無法生成！請放入 avatar-card1.jpg', 'error');
        return;
    }

    const nameInput = document.getElementById('id-name').value.trim() || "神秘麋鹿";
    const canvas = document.getElementById('id-canvas');
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 1000);
    gradient.addColorStop(0, '#09090b'); gradient.addColorStop(1, '#27192a'); 
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 1000);

    ctx.strokeStyle = 'rgba(236, 72, 153, 0.3)'; ctx.lineWidth = 4; ctx.strokeRect(40, 40, 720, 920);

    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = detectedAvatars[selectedAvatarId];
    
    img.onload = () => {
        ctx.save();
        roundedRect(ctx, 100, 100, 600, 560, 40);
        ctx.clip();
        ctx.drawImage(img, 100, 100, 600, 560);
        ctx.restore();

        ctx.textAlign = "center";
        ctx.fillStyle = '#ec4899'; ctx.font = '900 32px "Segoe UI", sans-serif';
        ctx.fillText('OFFICIAL DEER FAN', 400, 730);
        
        ctx.fillStyle = '#ffffff'; ctx.font = '900 60px "Segoe UI", "PingFang TC", sans-serif';
        ctx.fillText(nameInput, 400, 830);

        const dateStr = new Date().toISOString().split('T')[0];
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 20px monospace';
        ctx.fillText(`ID: ${Date.now().toString().slice(-6)} | DATE: ${dateStr}`, 400, 910);

        document.getElementById('id-result-img').src = canvas.toDataURL('image/jpeg', 0.9);
        document.getElementById('id-result-area').classList.remove('hidden');
    };
};

/* ================== 6. 麋鹿大會考 ================== */
let currentQuiz = [], currentQIndex = 0, score = 0;
let quizPlayerName = "";

window.startQuiz = function() {
    if(appSettings.soundOn) playClickSound();
    quizPlayerName = document.getElementById('quiz-player-name').value.trim();
    if(!quizPlayerName) { Swal.fire('提示', '請先輸入名字喔！', 'warning'); return; }
    if (quizData.length < 10) { Swal.fire('錯誤', '題庫不足 10 題！', 'error'); return; }

    document.getElementById('quiz-intro').classList.add('hidden');
    document.getElementById('quiz-area').classList.remove('hidden');
    
    currentQuiz = [...quizData].sort(() => 0.5 - Math.random()).slice(0, 10);
    currentQIndex = 0; score = 0;
    renderQuizQuestion();
};

function renderQuizQuestion() {
    if (currentQIndex >= 10) { endQuiz(); return; }

    const qData = currentQuiz[currentQIndex];
    document.getElementById('quiz-progress').innerText = `Q ${currentQIndex + 1}/10`;
    document.getElementById('quiz-score').innerText = `SCORE: ${score}`;
    document.getElementById('quiz-question').innerText = `Q: ${qData.q}`;

    const optsContainer = document.getElementById('quiz-options');
    optsContainer.innerHTML = '';
    
    [...qData.options].sort(() => 0.5 - Math.random()).forEach(opt => {
        const isCorrect = (opt === qData.a);
        optsContainer.innerHTML += `
            <button onclick="answerQuiz(this, ${isCorrect})" class="w-full text-left bg-white/5 hover:bg-white/10 p-4 rounded-xl border border-white/10 transition font-bold text-sm text-slate-200">
                ${opt}
            </button>
        `;
    });
}

window.answerQuiz = function(btn, isCorrect) {
    if(appSettings.soundOn) playClickSound();
    const btns = document.getElementById('quiz-options').querySelectorAll('button');
    btns.forEach(b => b.disabled = true);

    if (isCorrect) {
        btn.classList.replace('bg-white/5', 'bg-green-600/30');
        btn.classList.replace('border-white/10', 'border-green-500');
        btn.classList.add('text-green-400');
        score += 10;
    } else {
        btn.classList.replace('bg-white/5', 'bg-red-600/30');
        btn.classList.replace('border-white/10', 'border-red-500');
        btn.classList.add('text-red-400');
        btns.forEach(b => {
            if (b.innerText.trim() === currentQuiz[currentQIndex].a) {
                b.classList.replace('bg-white/5', 'bg-green-600/30');
                b.classList.replace('border-white/10', 'border-green-500');
                b.classList.add('text-green-400');
            }
        });
    }

    document.getElementById('quiz-score').innerText = `SCORE: ${score}`;
    setTimeout(() => { currentQIndex++; renderQuizQuestion(); }, 1200);
};

function endQuiz() {
    let title = score >= 90 ? "🏆 鹿的終極守護者" : score >= 60 ? "🌟 鐵桿麋鹿" : "🦌 新手麋鹿";
    generateQuizResultImage(title);

    Swal.fire({
        title: '測驗完成！',
        html: `<p class="text-slate-400 text-sm">正在繪製戰績圖...</p>`,
        background: '#18181b', color: '#fff', timer: 1500, showConfirmButton: false,
        customClass: { popup: 'rounded-3xl border border-slate-700' }
    }).then(() => {
        document.getElementById('quiz-area').classList.add('hidden');
    });
}

function generateQuizResultImage(title) {
    const canvas = document.getElementById('quiz-canvas');
    const ctx = canvas.getContext('2d');
    
    const gradient = ctx.createLinearGradient(0, 0, 800, 1000);
    gradient.addColorStop(0, '#0f172a'); gradient.addColorStop(1, '#09090b'); 
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 1000);

    ctx.fillStyle = 'rgba(59, 130, 246, 0.05)';
    ctx.beginPath(); ctx.arc(400, 300, 300, 0, Math.PI * 2); ctx.fill();

    ctx.textAlign = "center";
    ctx.fillStyle = '#fff'; ctx.font = '900 48px "Segoe UI", sans-serif';
    ctx.fillText('麋鹿大會考 官方戰績', 400, 160);
    
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 26px "Segoe UI", sans-serif';
    ctx.fillText(`挑戰者：${quizPlayerName}`, 400, 230);

    ctx.fillStyle = '#e879f9'; ctx.font = '900 220px "Segoe UI", sans-serif';
    ctx.fillText(`${score}`, 400, 500);
    
    ctx.fillStyle = '#fff'; ctx.font = 'bold 36px "Segoe UI", sans-serif';
    ctx.fillText(`獲得稱號`, 400, 680);
    
    ctx.fillStyle = '#3b82f6'; ctx.font = '900 56px "Segoe UI", sans-serif';
    ctx.fillText(`${title}`, 400, 760);

    const dateStr = new Date().toISOString().split('T')[0];
    ctx.fillStyle = '#475569'; ctx.font = 'bold 20px monospace';
    ctx.fillText(`ISSUED: ${dateStr} | 鹿 QA v8.1`, 400, 920);

    // 輸出 JPEG 減少體積並避免透明底色問題
    document.getElementById('quiz-result-img').src = canvas.toDataURL('image/jpeg', 0.9);
    document.getElementById('quiz-result-area').classList.remove('hidden');
}

function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}