// summary.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ข้อมูล Mapping อารมณ์ (รูปภาพ และสีข้อความ)
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
    const backBtn = document.getElementById('backBtn');
    const userAlias = document.getElementById('userAlias');
    const selectmoodImg = document.getElementById('selectmood');
    const moodTitleEn = document.getElementById('moodTitleEn');
    const moodTitleTh = document.getElementById('moodTitleTh');
    const cancelBtn = document.getElementById('cancelBtn');
    const yesBtn = document.getElementById('yesBtn');
    const historyBtn = document.getElementById('historyBtn');

    // ----------------------------------------------------
    // 1. ดึงข้อมูลอารมณ์ที่เลือกจาก SessionStorage
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
    // 2. ตรวจสอบการเข้าสู่ระบบ และดึงข้อมูลผู้ใช้จาก Supabase
    // ----------------------------------------------------
    async function checkAuthAndFetchUser() {
        try {
            // ตรวจสอบ Auth Session ปัจจุบัน
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            // ป้องกันผู้ไม่มีบัญชี/ไม่ได้ล็อกอิน ให้ส่งกลับไปหน้า login.html
            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            // แสดง nickname จาก LocalStorage ก่อน
            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) {
                userAlias.textContent = cachedAlias;
            }

            // ดึงข้อมูลโปรไฟล์จากตาราง users โดยใช้ user_id
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
            console.error('Error in checkAuthAndFetchUser:', err);
        }
    }

    // ----------------------------------------------------
    // 3. Event Listeners
    // ----------------------------------------------------
    
    // ปุ่มย้อนกลับ -> กลับไปหน้า reaction.html
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.location.href = './reaction.html';
        });
    }

    // ปุ่ม "ไม่เป็นไร" -> ไปหน้า final-summary.html
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            window.location.href = './final-summary.html';
        });
    }

    // ปุ่ม "ตกลง" -> ไปหน้า reflection.html
    if (yesBtn) {
        yesBtn.addEventListener('click', () => {
            window.location.href = './reflection.html';
        });
    }

    // ปุ่ม "History of Emotions" -> ไปหน้า history.html
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = './history.html';
        });
    }

    checkAuthAndFetchUser();
});