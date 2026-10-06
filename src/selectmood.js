// selectmood.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ฟังก์ชันดึงวันที่ปัจจุบัน รูปแบบ YYYY-MM-DD (ตามเวลาท้องถิ่น)
function getTodayDate() {
    const d = new Date();
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

            // แสดง Alias จาก Cache เพื่อความเร็ว
            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) userAlias.textContent = cachedAlias;

            // ดึงข้อมูลจากตาราง users
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

            // ปิดปุ่มชั่วคราวขณะกำลังบันทึก
            continueBtn.disabled = true;
            continueBtn.textContent = 'Saving...';

            try {
                const today = getTodayDate();
                const moodVal = parseInt(selectedMoodLevel, 10);

                // 1. เก็บลง SessionStorage
                sessionStorage.setItem('selected_mood_level', selectedMoodLevel);

                // 2. บันทึกลงตาราง daily_entries ใน Supabase
                const { error } = await supabaseClient
                    .from('daily_entries')
                    .upsert({
                        user_id: currentUser.id,
                        entry_date: today,
                        emotion_level: moodVal,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'user_id, entry_date' });

                if (error) throw error;

                // ไปยัง Step 2
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