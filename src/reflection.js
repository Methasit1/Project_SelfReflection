// reflection.js
const supabaseClient = window.supabaseClient;

const DRAFT_TIMEOUT_MS = 15 * 60 * 1000; // 15 นาที (BR-06)

function checkAndHandleDraftTimeout() {
    const draftTimestamp = sessionStorage.getItem('draft_timestamp');
    if (draftTimestamp) {
        const now = Date.now();
        if (now - parseInt(draftTimestamp, 10) > DRAFT_TIMEOUT_MS) {
            clearDraftStorage();
            alert('⏱️ เซสชันทบทวนตนเอง (Step 4) หมดอายุเนื่องจากค้างหน้านานเกิน 15 นาที ระบบได้บันทึกเฉพาะอารมณ์และเหตุการณ์ของคุณไว้แล้ว');
            window.location.href = './final-summary.html';
            return true;
        }
    }
    return false;
}

// 🟢 แก้ไข: ลบเฉพาะข้อความร่าง ไม่ลบ selected_mood_level
function clearDraftStorage() {
    sessionStorage.removeItem('trigger_text');
    sessionStorage.removeItem('reaction_text');
    sessionStorage.removeItem('draft_timestamp');
}

function updateDraftTimestamp() {
    sessionStorage.setItem('draft_timestamp', Date.now().toString());
}

function getEntryDate() {
    const d = new Date();
    const recordType = sessionStorage.getItem('record_type');
    if (recordType === 'previous') {
        d.setDate(d.getDate() - 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    if (checkAndHandleDraftTimeout()) return;

    const userAlias = document.getElementById('userAlias');
    const questionEn = document.getElementById('question_en');
    const questionTh = document.getElementById('question_th');
    const reactionInput = document.getElementById('reactionInput');
    const charCounter = document.getElementById('charCounter');
    const finishBtn = document.getElementById('finishBtn');

    const MAX_CHARS = 200;
    let currentUser = null;
    let currentQuestion = null;
    let crisisKeywordsList = [];
    let debounceTimer = null;

    async function fetchCrisisKeywords() {
        try {
            const { data } = await supabaseClient
                .from('crisis_keywords')
                .select('keyword')
                .eq('is_active', true);

            if (data) {
                crisisKeywordsList = data.map(k => k.keyword.toLowerCase());
            }
        } catch (err) {
            console.error('Error fetching crisis keywords:', err);
        }
    }

    function showCrisisSafetyBanner() {
        if (document.getElementById('crisisBanner')) return;

        const banner = document.createElement('div');
        banner.id = 'crisisBanner';
        banner.className = 'fixed bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-6 z-50 animate-bounce font-noto';
        banner.innerHTML = `
            <div class="flex items-center gap-4">
                <i class="fa-solid fa-heart-pulse text-4xl"></i>
                <div>
                    <h4 class="text-xl font-bold">เราห่วงใยคุณเสมอ</h4>
                    <p class="text-base">หากรู้สึกไม่ไหว หรือต้องการคนรับฟัง สามารถโทรปรึกษา <strong class="underline">สายด่วนสุขภาพจิต 1323</strong> ได้ฟรีตลอด 24 ชั่วโมง</p>
                </div>
            </div>
            <button type="button" onclick="document.getElementById('crisisBanner').remove()" class="bg-white/20 hover:bg-white/40 text-white px-4 py-2 rounded-full font-bold cursor-pointer transition shrink-0">
                รับทราบ
            </button>
        `;
        document.body.appendChild(banner);
    }

    function checkCrisisKeywords(text) {
        if (!text || crisisKeywordsList.length === 0) return;
        const lowerText = text.toLowerCase();
        const hasCrisisWord = crisisKeywordsList.some(kw => lowerText.includes(kw));

        if (hasCrisisWord) {
            showCrisisSafetyBanner();
        }
    }

    async function initPage() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }
            currentUser = user;

            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) userAlias.textContent = cachedAlias;

            await fetchCrisisKeywords();
            await fetchRandomQuestion();
        } catch (err) {
            console.error('Error initializing reflection page:', err);
        }
    }

    async function fetchRandomQuestion() {
        const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);
        
        try {
            const { data, error } = await supabaseClient.rpc('get_random_reflection_question', {
                p_user_id: currentUser.id,
                p_emotion_level: moodLevel
            });

            if (error) throw error;

            if (data && data.length > 0) {
                currentQuestion = data[0];
                if (questionEn) questionEn.textContent = currentQuestion.question_text_en || '';
                if (questionTh) questionTh.textContent = currentQuestion.question_text || '';
            } else {
                if (questionTh) questionTh.textContent = 'วันนี้คุณได้เรียนรู้อะไรเกี่ยวกับตัวเองบ้าง?';
                if (questionEn) questionEn.textContent = 'What did you learn about yourself today?';
            }
        } catch (err) {
            console.error('Error fetching question:', err);
            if (questionTh) questionTh.textContent = 'วันนี้คุณได้เรียนรู้อะไรเกี่ยวกับตัวเองบ้าง?';
        }
    }

    if (reactionInput) {
        reactionInput.addEventListener('input', () => {
            const text = reactionInput.value;
            const textLength = text.length;

            if (charCounter) charCounter.textContent = `${textLength}/${MAX_CHARS}`;

            if (textLength > 0) {
                finishBtn.disabled = false;
                finishBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                finishBtn.classList.add('opacity-100', 'cursor-pointer');
            } else {
                finishBtn.disabled = true;
                finishBtn.classList.add('opacity-40', 'cursor-not-allowed');
                finishBtn.classList.remove('opacity-100', 'cursor-pointer');
            }

            updateDraftTimestamp();

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                checkCrisisKeywords(text);
            }, 300);
        });
    }

    if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
            const reflectionText = reactionInput.value.trim();
            if (!reflectionText || !currentUser) return;

            finishBtn.disabled = true;
            finishBtn.textContent = 'Saving...';

            try {
                const entryDate = getEntryDate();
                const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);
                const triggerText = sessionStorage.getItem('trigger_text') || '';
                const reactionText = sessionStorage.getItem('reaction_text') || '';

                if (currentQuestion) {
                    const { error } = await supabaseClient.rpc('run_save_complete_reflection', {
                        p_user_id: currentUser.id,
                        p_entry_date: entryDate,
                        p_emotion_level: moodLevel,
                        p_trigger_text: triggerText,
                        p_reaction_text: reactionText,
                        p_question_id: currentQuestion.question_id,
                        p_question_snapshot: currentQuestion.question_text,
                        p_reflection_text: reflectionText
                    });

                    if (error) throw error;
                }

                clearDraftStorage();

                window.location.href = './final-summary.html';
            } catch (err) {
                console.error('Error saving reflection:', err.message);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
                finishBtn.disabled = false;
                finishBtn.textContent = 'Finish';
            }
        });
    }

    setInterval(checkAndHandleDraftTimeout, 10000);

    initPage();
});