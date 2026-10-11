// selectmood.js
const supabaseClient = window.supabaseClient;

// 🟢 คำนวณวันที่บันทึกจริง โดยเช็กตัวเลือก "วันก่อนหน้า" หรือ "วันนี้"
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
    const userAlias = document.getElementById('userAlias');
    const backBtn = document.getElementById('backBtn');
    const continueBtn = document.getElementById('continueBtn');
    const moodItems = document.querySelectorAll('.mood-item');

    let selectedMoodLevel = null;
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
    // เลือก Mood
    // ----------------------------------------------------
    moodItems.forEach(item => {
        item.addEventListener('click', () => {
            moodItems.forEach(m => m.classList.remove('selected'));
            item.classList.add('selected');

            selectedMoodLevel = item.getAttribute('data-level');

            if (continueBtn) {
                continueBtn.disabled = false;
                continueBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                continueBtn.classList.add('opacity-100', 'cursor-pointer');
            }
        });
    });

    // ----------------------------------------------------
    // Navigation & Save to DB
    // ----------------------------------------------------
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = './dashboard.html';
        });
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', async () => {
            if (!selectedMoodLevel || !currentUser) return;

            continueBtn.disabled = true;
            continueBtn.textContent = 'Saving...';

            try {
                // 🟢 ดึงวันที่ตามตัวเลือกของผู้ใช้ (วันก่อนหน้า หรือ วันนี้)
                const entryDate = getEntryDate();
                const moodVal = parseInt(selectedMoodLevel, 10);

                // 1. เก็บระดับอารมณ์ลง SessionStorage
                sessionStorage.setItem('selected_mood_level', selectedMoodLevel);

                // 2. บันทึกลงตาราง daily_entries ใน Supabase โดยใช้วันที่ entryDate ที่ถูกต้อง
                const { error } = await supabaseClient
                    .from('daily_entries')
                    .upsert({
                        user_id: currentUser.id,
                        entry_date: entryDate, // 🟢 ส่งวันที่ถูกต้องเข้า Database
                        emotion_level: moodVal,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, entry_date' });

                if (error) throw error;

                // ไปยัง Step 2 (trigger.html)
                window.location.href = './trigger.html';
            } catch (err) {
                console.error('Error saving mood:', err.message);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
                continueBtn.disabled = false;
                continueBtn.textContent = 'Continue';
            }
        });
    }

    checkAuthAndFetchUser();
});