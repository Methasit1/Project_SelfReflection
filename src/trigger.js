// trigger.js
const supabaseClient = window.supabaseClient;

const DRAFT_TIMEOUT_MS = 15 * 60 * 1000; // 15 นาที (BR-06)

function checkAndHandleDraftTimeout() {
    const draftTimestamp = sessionStorage.getItem('draft_timestamp');
    if (draftTimestamp) {
        const now = Date.now();
        if (now - parseInt(draftTimestamp, 10) > DRAFT_TIMEOUT_MS) {
            clearDraftStorage();
            alert('⏱️ เซสชันร่างข้อความหมดอายุเนื่องจากไม่มีการเคลื่อนไหวนานเกิน 15 นาที กรุณาเริ่มบันทึกใหม่อีกครั้ง');
            window.location.href = './dashboard.html';
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
    const continueBtn = document.getElementById('continueBtn');
    const triggerInput = document.getElementById('triggerInput');
    const charCounter = document.getElementById('charCounter');

    const MAX_CHARS = 200;
    let currentUser = null;
    let crisisKeywordsList = [];
    let debounceTimer = null;

    const savedDraft = sessionStorage.getItem('trigger_text');
    if (savedDraft && triggerInput) {
        triggerInput.value = savedDraft;
        if (charCounter) charCounter.textContent = `${savedDraft.length}/${MAX_CHARS}`;
        if (continueBtn && savedDraft.length > 0) {
            continueBtn.disabled = false;
            continueBtn.classList.remove('opacity-40', 'cursor-not-allowed');
            continueBtn.classList.add('opacity-100', 'cursor-pointer');
        }
    }

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

    async function checkAuthAndFetchUser() {
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

            const { data: userData, error: dbError } = await supabaseClient
                .from('users')
                .select('nickname')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!dbError && userData?.nickname) {
                if (userAlias) userAlias.textContent = userData.nickname;
                localStorage.setItem('userAlias', userData.nickname);
            }

            await fetchCrisisKeywords();
        } catch (err) {
            console.error('Error in checkAuthAndFetchUser:', err);
        }
    }

    if (triggerInput) {
        triggerInput.addEventListener('input', () => {
            const text = triggerInput.value;
            const textLength = text.length;

            if (charCounter) charCounter.textContent = `${textLength}/${MAX_CHARS}`;

            if (textLength > 0) {
                continueBtn.disabled = false;
                continueBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                continueBtn.classList.add('opacity-100', 'cursor-pointer');
            } else {
                continueBtn.disabled = true;
                continueBtn.classList.add('opacity-40', 'cursor-not-allowed');
                continueBtn.classList.remove('opacity-100', 'cursor-pointer');
            }

            sessionStorage.setItem('trigger_text', text);
            updateDraftTimestamp();

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                checkCrisisKeywords(text);
            }, 300);
        });
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', async () => {
            const triggerText = triggerInput.value.trim();
            if (!triggerText || !currentUser) return;

            continueBtn.disabled = true;
            continueBtn.textContent = 'Saving...';

            try {
                const entryDate = getEntryDate();
                const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);

                sessionStorage.setItem('trigger_text', triggerText);
                updateDraftTimestamp();

                const { error } = await supabaseClient
                    .from('daily_entries')
                    .upsert({
                        user_id: currentUser.id,
                        entry_date: entryDate,
                        emotion_level: moodLevel,
                        trigger_text: triggerText,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, entry_date' });

                if (error) throw error;

                window.location.href = './reaction.html';
            } catch (err) {
                console.error('Error saving trigger:', err.message);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
                continueBtn.disabled = false;
                continueBtn.textContent = 'Continue';
            }
        });
    }

    setInterval(checkAndHandleDraftTimeout, 10000);

    checkAuthAndFetchUser();
});