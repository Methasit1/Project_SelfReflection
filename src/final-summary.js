// final-summary.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Mapping อารมณ์ (รูปภาพ และสีข้อความ)
const moodMap = {
    '1': { img: './image/mood01.png', en: '“ Very Sad ”', th: 'เศร้ามาก', color: '#8D99AE' },
    '2': { img: './image/mood02.png', en: '“ Sad ”', th: 'เศร้า', color: '#E07A5F' },
    '3': { img: './image/mood03.png', en: '“ Neutral ”', th: 'ปานกลาง', color: '#D4A373' },
    '4': { img: './image/mood04.png', en: '“ Good ”', th: 'อารมณ์ดี', color: '#A4D1B6' },
    '5': { img: './image/mood05.png', en: '“ Very Good ”', th: 'อารมณ์ดีมาก', color: '#2A9D8F' }
};

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // Element References
    // ----------------------------------------------------
    const userAlias = document.getElementById('userAlias');
    const selectmoodImg = document.getElementById('selectmood');
    const moodTitleEn = document.getElementById('moodTitleEn');
    const moodTitleTh = document.getElementById('moodTitleTh');
    const historyBtn = document.getElementById('historyBtn');

    // ----------------------------------------------------
    // 1. ดึงข้อมูลอารมณ์ที่บันทึกไว้ใน SessionStorage
    // ----------------------------------------------------
    const selectedLevel = sessionStorage.getItem('selected_mood_level') || '4';
    const currentMood = moodMap[selectedLevel] || moodMap['4'];

    if (selectmoodImg) selectmoodImg.src = currentMood.img;
    if (moodTitleEn) {
        moodTitleEn.textContent = currentMood.en;
        moodTitleEn.style.color = currentMood.color;
    }
    if (moodTitleTh) {
        moodTitleTh.textContent = currentMood.th;
        moodTitleTh.style.color = currentMood.color;
    }

    // ----------------------------------------------------
    // 2. ตรวจสอบ Auth และดึงข้อมูลจากตาราง users
    // ----------------------------------------------------
    async function checkAuthAndFetchUser() {
        try {
            // เช็ค Auth Session ปัจจุบัน
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            // หากยังไม่ได้เข้าสู่ระบบ / ไม่มีบัญชี ให้เด้งไปหน้า login.html
            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            // แสดง nickname จาก LocalStorage ก่อนเพื่อความรวดเร็ว
            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) {
                userAlias.textContent = cachedAlias;
            }

            // ดึงข้อมูลโปรไฟล์จากตาราง users ผ่าน user_id (ผ่านสิทธิ์ RLS)
            const { data: userData, error: dbError } = await supabaseClient
                .from('users')
                .select('nickname')
                .eq('user_id', user.id)
                .maybeSingle();

            if (dbError) {
                console.error('Error fetching user profile:', dbError.message);
                return;
            }

            if (userData && userData.nickname) {
                if (userAlias) userAlias.textContent = userData.nickname;
                localStorage.setItem('userAlias', userData.nickname);
            }
        } catch (err) {
            console.error('Unexpected error in checkAuthAndFetchUser:', err);
        }
    }

    // ----------------------------------------------------
    // 3. Navigation Event
    // ----------------------------------------------------
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = './history.html';
        });
    }

    checkAuthAndFetchUser();
});