// reflection.js
const supabaseClient = window.supabaseClient;

const DRAFT_TIMEOUT_MS = 15 * 60 * 1000; // 15 นาที (BR-06)

let currentUser = null;
let currentQuestion = null;
let isSubmitting = false;

// ฟังก์ชันล้าง Session ร่างข้อความเมื่อเสร็จสิ้นขั้นตอน
function clearDraftStorage() {
    sessionStorage.removeItem('selected_mood_level');
    sessionStorage.removeItem('record_type');
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

// 🟢 ฟังก์ชันบันทึกค่า Reflection เป็นข้อความว่างเมื่อหมดเวลา 15 นาที
async function autoSaveBlankAndTimeout() {
    if (isSubmitting) return;
    isSubmitting = true;

    try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (user) {
            const entryDate = getEntryDate();
            const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);
            const triggerText = sessionStorage.getItem('trigger_text') || '';
            const reactionText = sessionStorage.getItem('reaction_text') || '';

            const questionId = currentQuestion ? currentQuestion.question_id : null;
            const questionSnapshot = currentQuestion ? (currentQuestion.question_text || 'การสะท้อนความคิดเพิ่มเติม') : 'การสะท้อนความคิดเพิ่มเติม';

            await supabaseClient.rpc('run_save_complete_reflection', {
                p_user_id: user.id,
                p_entry_date: entryDate,
                p_emotion_level: moodLevel,
                p_trigger_text: triggerText,
                p_reaction_text: reactionText,
                p_question_id: questionId,
                p_question_snapshot: questionSnapshot,
                p_reflection_text: '' // บันทึกข้อความว่างเมื่อค้างหน้านานเกิน 15 นาที
            });
        }
    } catch (err) {
        console.error('Error in autoSaveBlankAndTimeout:', err);
    } finally {
        clearDraftStorage();
        alert('⏱️ เซสชันทบทวนตนเองหมดอายุเนื่องจากค้างหน้านานเกิน 15 นาที ระบบได้บันทึกอารมณ์และเหตุการณ์ของคุณไว้เรียบร้อยแล้ว คุณสามารถเพิ่มบทเรียนย้อนหลังได้ที่หน้าประวัติ');
        window.location.href = './final-summary.html';
    }
}

// ตรวจสอบระยะเวลาค้างหน้า
async function checkAndHandleDraftTimeout() {
    if (isSubmitting) return false;
    const draftTimestamp = sessionStorage.getItem('draft_timestamp');
    if (draftTimestamp) {
        const now = Date.now();
        if (now - parseInt(draftTimestamp, 10) > DRAFT_TIMEOUT_MS) {
            await autoSaveBlankAndTimeout();
            return true;
        }
    }
    return false;
}

document.addEventListener('DOMContentLoaded', async () => {
    // กำหนดเวลาเริ่มแรกหากยังไม่มี
    if (!sessionStorage.getItem('draft_timestamp')) {
        updateDraftTimestamp();
    }

    if (await checkAndHandleDraftTimeout()) return;

    const userAlias = document.getElementById('userAlias');
    const questionEn = document.getElementById('question_en');
    const questionTh = document.getElementById('question_th');
    const reactionInput = document.getElementById('reactionInput');
    const charCounter = document.getElementById('charCounter');
    const finishBtn = document.getElementById('finishBtn');

    const MAX_CHARS = 200;
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

    // Event listener เมื่อพิมพ์ในกล่องข้อความ
    if (reactionInput) {
        reactionInput.addEventListener('input', () => {
            const text = reactionInput.value;
            const textLength = text.length;

            if (charCounter) charCounter.textContent = `${String(textLength).padStart(2, '0')}/${MAX_CHARS}`;

            if (finishBtn) {
                if (textLength > 0) {
                    finishBtn.disabled = false;
                    finishBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                    finishBtn.classList.add('opacity-100', 'cursor-pointer');
                } else {
                    finishBtn.disabled = true;
                    finishBtn.classList.add('opacity-40', 'cursor-not-allowed');
                    finishBtn.classList.remove('opacity-100', 'cursor-pointer');
                }
            }

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                checkCrisisKeywords(text);
            }, 300);
        });
    }

    // Event listener เมื่อกดปุ่ม Finish (กรอกข้อมูลปกติ)
    if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
            if (isSubmitting) return;
            const reflectionText = reactionInput.value.trim();
            if (!reflectionText || !currentUser) return;

            isSubmitting = true;
            finishBtn.disabled = true;
            finishBtn.textContent = 'Saving...';

            try {
                const entryDate = getEntryDate();
                const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);
                const triggerText = sessionStorage.getItem('trigger_text') || '';
                const reactionText = sessionStorage.getItem('reaction_text') || '';

                const questionId = currentQuestion ? currentQuestion.question_id : null;
                const questionSnapshot = currentQuestion ? (currentQuestion.question_text || 'การสะท้อนความคิดเพิ่มเติม') : 'การสะท้อนความคิดเพิ่มเติม';

                const { error } = await supabaseClient.rpc('run_save_complete_reflection', {
                    p_user_id: currentUser.id,
                    p_entry_date: entryDate,
                    p_emotion_level: moodLevel,
                    p_trigger_text: triggerText,
                    p_reaction_text: reactionText,
                    p_question_id: questionId,
                    p_question_snapshot: questionSnapshot,
                    p_reflection_text: reflectionText
                });

                if (error) throw error;

                clearDraftStorage();
                window.location.href = './final-summary.html';

            } catch (err) {
                console.error('Error saving reflection:', err.message);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
                isSubmitting = false;
                finishBtn.disabled = false;
                finishBtn.textContent = 'Finish';
            }
        });
    }

    // ตรวจสอบ Timeout ทุกๆ 10 วินาที
    setInterval(checkAndHandleDraftTimeout, 10000);

    initPage();
});