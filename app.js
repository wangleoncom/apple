/* ==========================================================================
   鹿🦌 QA 粉絲站 v8.0 - 終極核心邏輯 (app.js)
   依賴：ld_qa.js, ld_quiz.js
   ========================================================================== */

const qaData = window.QA_DB || [];
const quizData = window.QUIZ_DB || [];

// 系統設定狀態管理
let appSettings = {
    qaPerPage: 8,
    soundOn: true,
    powerSave: false
};

/* ================== 1. 系統初始化與自動探測 ================== */
document.addEventListener('DOMContentLoaded', async () => {
    loadSettings();
    
    // 智慧型自動探測照片數量 (從 avatar-card1.jpg 開始找)
    document.getElementById('loading-text').innerText = "SCANNING IMAGES...";
    await detectAvatars();
    
    // 關閉啟動畫面
    setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.opacity = '0';
            setTimeout(() => {
                splash.style.display = 'none';
                initQA(); 
            }, 600);
        } else {
            initQA();
        }
    }, 800);
});

// 底部導航切換
function switchTab(tabId, btn) {
    if(appSettings.soundOn) playClickSound();
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    btn.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// 簡單按鍵音效模擬
function playClickSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.1);
    } catch(e) {}
}

/* ================== 2. 系統設定與儲存 ================== */
function toggleSettings() {
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
}

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

function saveSettings() {
    appSettings.soundOn = document.getElementById('sound-toggle').checked;
    appSettings.powerSave = document.getElementById('power-toggle').checked;
    localStorage.setItem('deerAppSettings', JSON.stringify(appSettings));
    applyPowerSave();
}

function updateQASetting(val) {
    appSettings.qaPerPage = parseInt(val);
    document.getElementById('qa-count-display').innerText = `${val} 題`;
    localStorage.setItem('deerAppSettings', JSON.stringify(appSettings));
    currentPage = 1;
    renderQA(1);
}

function applyPowerSave() {
    if(appSettings.powerSave) {
        document.body.classList.remove('animate__animated');
    }
}

function resetSettings() {
    localStorage.removeItem('deerAppSettings');
    location.reload();
}

/* ================== 3. 首頁 QA 渲染與搜尋 ================== */
let currentPage = 1;
let filteredQA = [...qaData];

function initQA() {
    if (qaData.length > 0) renderQA(1);
    else document.getElementById('qa-list').innerHTML = '<p class="text-red-400 font-bold p-4">無法載入資料庫，請檢查 ld_qa.js 是否正確引入！</p>';
}

window.filterQA = function() {
    const term = document.getElementById('qa-search').value.toLowerCase();
    if (!term) {
        filteredQA = [...qaData];
    } else {
        filteredQA = qaData.filter(item => item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term));
    }
    currentPage = 1;
    renderQA(currentPage);
};

function renderQA(page) {
    const list = document.getElementById('qa-list');
    const controls = document.getElementById('pagination-controls');
    list.innerHTML = '';
    
    if (filteredQA.length === 0) {
        list.innerHTML = '<div class="col-span-full text-center text-slate-500 py-16 font-bold text-lg"><i class="fas fa-box-open mb-2 text-3xl"></i><br>找不到相關問題</div>';
        controls.innerHTML = '';
        return;
    }

    const totalPages = Math.ceil(filteredQA.length / appSettings.qaPerPage);
    const start = (page - 1) * appSettings.qaPerPage;
    const currentItems = filteredQA.slice(start, start + appSettings.qaPerPage);

    currentItems.forEach((item, index) => {
        const num = String(start + index + 1).padStart(2, '0');
        list.innerHTML += `
            <div class="glass-panel hover-glass p-6 md:p-8 flex flex-col justify-between min-h-[180px] cursor-pointer group" onclick="if(appSettings.soundOn) playClickSound(); Swal.fire({title:'解答', text:'${item.a}', background:'#1e2030', color:'#fff', confirmButtonColor:'#ec4899', customClass:{title:'text-pink-400'}})">
                <div class="flex justify-between items-start mb-4">
                   <div class="w-10 h-10 rounded-full bg-pink-500 text-white flex items-center justify-center font-black text-lg shadow-[0_5px_15px_rgba(236,72,153,0.4)]">Q</div>
                   <div class="px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-400 text-xs font-black tracking-widest">#${num}</div>
                </div>
                <h3 class="text-[17px] font-bold text-white mb-4 line-clamp-2 leading-relaxed">${item.q}</h3>
                <div class="text-right mt-auto transition-transform group-hover:translate-x-1">
                   <span class="text-xs font-bold text-slate-500 tracking-widest">點擊翻看答案 <i class="fas fa-sync-alt ml-1"></i></span>
                </div>
            </div>
        `;
    });

    controls.innerHTML = `
        <button onclick="changePage(-1)" class="w-10 h-10 flex items-center justify-center bg-slate-800 text-white rounded-full hover:bg-pink-500 transition disabled:opacity-30 disabled:hover:bg-slate-800 shadow-lg" ${page === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
        <span class="text-slate-300 font-black text-xs tracking-[0.2em] bg-slate-800/50 px-4 py-2 rounded-full">PAGE ${page} / ${totalPages}</span>
        <button onclick="changePage(1)" class="w-10 h-10 flex items-center justify-center bg-slate-800 text-white rounded-full hover:bg-pink-500 transition disabled:opacity-30 disabled:hover:bg-slate-800 shadow-lg" ${page === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
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
        <div class="max-w-[85%] md:max-w-[70%] glass-panel p-4 shadow-lg text-[15px] leading-relaxed border border-pink-500/30 bg-[#341a2f] ml-auto text-right mb-4">
            ${text}
        </div>`;
    inputEl.value = '';
    chat.scrollTop = chat.scrollHeight;

    const bestMatch = findBestMatch(text);
    
    setTimeout(() => {
        let reply = "";
        if (bestMatch.score > 0.15) { 
            reply = `根據我的搜尋：<br><b class="text-pink-400 mt-2 block text-lg">${bestMatch.item.a}</b>`;
        } else {
            const fallbacks = ["這個問題超出了我的資料庫範圍喔！下次直播問鹿吧🦌", "咦？這個我還沒學習到呢。", "這題太難了啦！(咬草) 🍃"];
            reply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
        }
        chat.innerHTML += `
            <div class="max-w-[85%] md:max-w-[70%] glass-panel p-5 shadow-lg text-[15px] leading-relaxed border border-slate-700/50 bg-[#24273c] animate__animated animate__fadeInUp mb-4">
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

/* ================== 5. 照片自動探測與認證卡渲染 ================== */
let detectedAvatars = [];
let selectedAvatarId = 0;

// 自動探測照片演算法
async function detectAvatars() {
    const maxScan = 15; // 最多掃描到 avatar-card15.jpg
    const grid = document.getElementById('avatar-selection-grid');
    
    for (let i = 1; i <= maxScan; i++) {
        let url = `avatar-card${i}.jpg`;
        let exists = await new Promise((resolve) => {
            let img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = url;
        });

        if (exists) {
            detectedAvatars.push(url);
        } else {
            break; // 一旦找不到就停止掃描
        }
    }

    // 生成 UI
    grid.innerHTML = '';
    if (detectedAvatars.length === 0) {
        grid.innerHTML = '<p class="col-span-full text-red-400 text-sm">找不到照片。請將照片命名為 avatar-card1.jpg 放在同一資料夾內。</p>';
        return;
    }

    detectedAvatars.forEach((url, index) => {
        let isSelected = index === 0;
        grid.innerHTML += `
            <div class="avatar-option aspect-[3/4] rounded-2xl cursor-pointer border-2 ${isSelected ? 'border-pink-500 scale-105 opacity-100' : 'border-transparent opacity-40 hover:opacity-80'} overflow-hidden relative transition transform" onclick="selectAvatar(this, ${index})">
                <img src="${url}" class="w-full h-full object-cover pointer-events-none">
                <div class="icon-check absolute inset-0 bg-black/20 ${isSelected ? 'flex' : 'hidden'} items-center justify-center"><i class="fas fa-check-circle text-white text-4xl drop-shadow-lg"></i></div>
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
        Swal.fire('錯誤', '沒有可用照片，無法生成！', 'error');
        return;
    }

    const nameInput = document.getElementById('id-name').value.trim() || "神秘麋鹿";
    const canvas = document.getElementById('id-canvas');
    const ctx = canvas.getContext('2d');
    
    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 0, 1000);
    gradient.addColorStop(0, '#151828'); gradient.addColorStop(1, '#2d1b36'); 
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 1000);

    // 外框
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.4)'; ctx.lineWidth = 6; ctx.strokeRect(40, 40, 720, 920);

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
        ctx.fillStyle = '#ec4899'; ctx.font = '900 36px "Segoe UI", sans-serif';
        ctx.fillText('OFFICIAL DEER FAN', 400, 730);
        
        ctx.fillStyle = '#ffffff'; ctx.font = '900 70px "Segoe UI", "PingFang TC", sans-serif';
        ctx.fillText(nameInput, 400, 830);

        const dateStr = new Date().toISOString().split('T')[0];
        ctx.fillStyle = '#64748b'; ctx.font = 'bold 24px monospace';
        ctx.fillText(`ID: ${Date.now().toString().slice(-6)} | DATE: ${dateStr}`, 400, 910);

        document.getElementById('id-result-img').src = canvas.toDataURL('image/png', 1.0);
        document.getElementById('id-result-area').classList.remove('hidden');
    };
};

/* ================== 6. 麋鹿大會考與戰績生成 ================== */
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
    document.getElementById('quiz-progress').innerText = `QUESTION ${currentQIndex + 1} / 10`;
    document.getElementById('quiz-score').innerText = `SCORE: ${score}`;
    document.getElementById('quiz-question').innerText = `Q: ${qData.q}`;

    const optsContainer = document.getElementById('quiz-options');
    optsContainer.innerHTML = '';
    
    [...qData.options].sort(() => 0.5 - Math.random()).forEach(opt => {
        const isCorrect = (opt === qData.a);
        optsContainer.innerHTML += `
            <button onclick="answerQuiz(this, ${isCorrect})" class="w-full text-left bg-[#151828] hover:bg-slate-700 p-5 rounded-2xl border border-slate-600 transition font-medium text-[16px]">
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
        btn.classList.replace('bg-[#151828]', 'bg-green-600/30');
        btn.classList.add('border-green-500', 'text-green-400', 'font-black');
        score += 10;
    } else {
        btn.classList.replace('bg-[#151828]', 'bg-red-600/30');
        btn.classList.add('border-red-500', 'text-red-400', 'font-bold');
        btns.forEach(b => {
            if (b.innerText.trim() === currentQuiz[currentQIndex].a) {
                b.classList.replace('bg-[#151828]', 'bg-green-600/30');
                b.classList.add('border-green-500', 'text-green-400');
            }
        });
    }

    document.getElementById('quiz-score').innerText = `SCORE: ${score}`;
    setTimeout(() => { currentQIndex++; renderQuizQuestion(); }, 1200);
};

function endQuiz() {
    let title = score >= 90 ? "🏆 鹿的終極守護者" : score >= 60 ? "🌟 鐵桿麋鹿" : "🦌 新手麋鹿";
    
    // 生成美美的戰績圖片
    generateQuizResultImage(title);

    Swal.fire({
        title: '測驗完成！',
        html: `<p class="text-slate-300">正在為你生成專屬戰績圖...</p>`,
        background: '#1e2030', color: '#fff', timer: 1500, showConfirmButton: false,
        customClass: { popup: 'rounded-3xl border border-slate-600' }
    }).then(() => {
        document.getElementById('quiz-area').classList.add('hidden');
    });
}

function generateQuizResultImage(title) {
    const canvas = document.getElementById('quiz-canvas');
    const ctx = canvas.getContext('2d');
    
    // 背景
    const gradient = ctx.createLinearGradient(0, 0, 800, 1000);
    gradient.addColorStop(0, '#1a1b35'); gradient.addColorStop(1, '#0f111a'); 
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, 800, 1000);

    // 裝飾圖形
    ctx.fillStyle = 'rgba(59, 130, 246, 0.1)';
    ctx.beginPath(); ctx.arc(400, 300, 250, 0, Math.PI * 2); ctx.fill();

    // 繪製文字
    ctx.textAlign = "center";
    ctx.fillStyle = '#fff'; ctx.font = '900 50px "Segoe UI", sans-serif';
    ctx.fillText('麋鹿大會考 官方戰績', 400, 150);
    
    ctx.fillStyle = '#94a3b8'; ctx.font = 'bold 30px "Segoe UI", sans-serif';
    ctx.fillText(`挑戰者：${quizPlayerName}`, 400, 220);

    ctx.fillStyle = '#e879f9'; ctx.font = '900 200px "Segoe UI", sans-serif';
    ctx.fillText(`${score}`, 400, 480);
    
    ctx.fillStyle = '#fff'; ctx.font = 'bold 40px "Segoe UI", sans-serif';
    ctx.fillText(`獲得稱號`, 400, 650);
    
    ctx.fillStyle = '#3b82f6'; ctx.font = '900 60px "Segoe UI", sans-serif';
    ctx.fillText(`${title}`, 400, 740);

    const dateStr = new Date().toISOString().split('T')[0];
    ctx.fillStyle = '#475569'; ctx.font = 'bold 20px monospace';
    ctx.fillText(`ISSUED: ${dateStr} | 鹿 QA v8.0`, 400, 900);

    document.getElementById('quiz-result-img').src = canvas.toDataURL('image/png', 1.0);
    document.getElementById('quiz-result-area').classList.remove('hidden');
}

// Canvas 共用圓角函數
function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y); ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius); ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height); ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius); ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y); ctx.closePath();
}