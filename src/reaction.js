// reaction.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function getTodayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const userAlias = document.getElementById('userAlias');
    const finishBtn = document.getElementById('finishBtn');
    const reactionInput = document.getElementById('reactionInput');
    const charCounter = document.getElementById('charCounter');

    const MAX_CHARS = 200;
    let currentUser = null;

    // ----------------------------------------------------
    // ตรวจสอบการเข้าสู่ระบบ & ดึงข้อมูลผู้ใช้
    // ----------------------------------------------------
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
        } catch (err) {
            console.error('Error in checkAuthAndFetchUser:', err);
        }
    }

    // ----------------------------------------------------
    // ตรวจจับการพิมพ์ข้อความ
    // ----------------------------------------------------
    if (reactionInput) {
        reactionInput.addEventListener('input', () => {
            const textLength = reactionInput.value.length;
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
        });
    }

    // ----------------------------------------------------
    // Save to DB & Finish
    // ----------------------------------------------------
    if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
            const reactionText = reactionInput.value.trim();
            if (!reactionText || !currentUser) return;

            finishBtn.disabled = true;
            finishBtn.textContent = 'Finishing...';

            try {
                const today = getTodayDate();
                const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);
                const triggerText = sessionStorage.getItem('trigger_text') || '';

                // 1. เก็บลง SessionStorage
                sessionStorage.setItem('reaction_text', reactionText);

                // 2. อัปเดตข้อมูลฉบับสมบูรณ์ลงตาราง daily_entries
                const { error } = await supabaseClient
                    .from('daily_entries')
                    .upsert({
                        user_id: currentUser.id,
                        entry_date: today,
                        emotion_level: moodLevel,
                        trigger_text: triggerText,
                        reaction_text: reactionText,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, entry_date' });

                if (error) throw error;

                // ย้ายไปหน้าสรุป
                window.location.href = './summary.html';
            } catch (err) {
                console.error('Error saving reaction:', err.message);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
                finishBtn.disabled = false;
                finishBtn.textContent = 'Finish';
            }
        });
    }

    checkAuthAndFetchUser();
});