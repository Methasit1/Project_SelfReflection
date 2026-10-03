// selectmood.js

// 1. ตั้งค่า Supabase Client
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // 2. Element Reference
    // ----------------------------------------------------
    const userAlias = document.getElementById('userAlias');
    const userAvatar = document.getElementById('userAvatar');
    const backBtn = document.getElementById('backBtn');
    const continueBtn = document.getElementById('continueBtn');
    const moodItems = document.querySelectorAll('.mood-item');

    let selectedMoodLevel = null;

    // ----------------------------------------------------
    // 3. ดึงข้อมูลผู้ใช้จาก Supabase (ปรับปรุงให้ปลอดภัยขึ้น)
    // ----------------------------------------------------
    async function fetchUserData() {
        try {
            // เช็ค Session ปัจจุบันก่อน
            const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

            if (sessionError || !sessionData?.session) {
                console.warn('ไม่พบ Session หรือผู้ใช้ยังไม่ได้เข้าสู่ระบบ');
                return;
            }

            const user = sessionData.session.user;
            if (!user || !user.email) {
                console.warn('ไม่พบข้อมูล Email ของผู้ใช้');
                return;
            }

            // ดึงข้อมูล profile จากตาราง User
            const { data: userData, error: dbError } = await supabaseClient
                .from('User')
                .select('alias_name, avatar_url')
                .eq('email', user.email)
                .maybeSingle();

            if (dbError) {
                console.error('Error fetching user profile:', dbError.message);
                return;
            }

            if (userData) {
                if (userAlias && userData.alias_name) {
                    userAlias.textContent = userData.alias_name;
                }
                if (userAvatar && userData.avatar_url) {
                    userAvatar.src = userData.avatar_url;
                }
            }
        } catch (err) {
            console.error('Unexpected error in fetchUserData:', err);
        }
    }

    // ----------------------------------------------------
    // 4. ระบบเลือก Mood
    // ----------------------------------------------------
    moodItems.forEach(item => {
        item.addEventListener('click', () => {
            // ถอนคลาส selected จากรูปอื่น
            moodItems.forEach(m => m.classList.remove('selected'));

            // เพิ่มคลาส selected ให้รูปที่กดเลือก
            item.classList.add('selected');

            // บันทึกระดับอารมณ์ (1-5)
            selectedMoodLevel = item.getAttribute('data-level');

            // เปิดการใช้งานปุ่ม Continue สีดำ
            if (continueBtn) {
                continueBtn.disabled = false;
                continueBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                continueBtn.classList.add('opacity-100', 'cursor-pointer');
            }
        });
    });

    // ----------------------------------------------------
    // 5. Navigation Events
    // ----------------------------------------------------
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = './dashboard.html';
        });
    }

    if (continueBtn) {
        continueBtn.addEventListener('click', () => {
            if (!selectedMoodLevel) return;

            // บันทึกอารมณ์ลง SessionStorage
            sessionStorage.setItem('selected_mood_level', selectedMoodLevel);

            // ไปยังหน้าถัดไป
            window.location.href = './trigger.html';
        });
    }

    // เรียกทำงานฟังก์ชัน
    fetchUserData();
});