// summary.js (หรือ final-summary.js)

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// ข้อมูลรูปภาพและสีข้อความอารมณ์ (ระดับ 1-5)
const moodMap = {
    '1': { img: './image/mood01.png', en: '“ Very Sad ”', th: 'เศร้ามาก', color: '#8D99AE' },
    '2': { img: './image/mood02.png', en: '“ Sad ”', th: 'เศร้า', color: '#E07A5F' },
    '3': { img: './image/mood03.png', en: '“ Neutral ”', th: 'ปานกลาง', color: '#D4A373' },
    '4': { img: './image/mood04.png', en: '“ Good ”', th: 'อารมณ์ดี', color: '#A4D1B6' },
    '5': { img: './image/mood05.png', en: '“ Very Good ”', th: 'อารมณ์ดีมาก', color: '#2A9D8F' }
};

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // Element References (ตรงตาม ID ใน HTML)
    // ----------------------------------------------------
    const userAlias = document.getElementById('userAlias');
    const userAvatar = document.getElementById('userAvatar');
    const selectmoodImg = document.getElementById('selectmood');
    const moodTitleEn = document.getElementById('moodTitleEn');
    const moodTitleTh = document.getElementById('moodTitleTh');
    const historyBtn = document.getElementById('historyBtn');

    // ----------------------------------------------------
    // 1. แสดงข้อมูลอารมณ์จาก SessionStorage
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
    // 2. ดึงข้อมูลโปรไฟล์ผู้ใช้จาก Supabase
    // ----------------------------------------------------
    async function fetchUserData() {
        try {
            const { data: sessionData } = await supabaseClient.auth.getSession();
            if (!sessionData?.session?.user) return;

            const { data: userData } = await supabaseClient
                .from('User')
                .select('alias_name, avatar_url')
                .eq('email', sessionData.session.user.email)
                .maybeSingle();

            if (userData) {
                if (userAlias && userData.alias_name) userAlias.textContent = userData.alias_name;
                if (userAvatar && userData.avatar_url) userAvatar.src = userData.avatar_url;
            }
        } catch (err) {
            console.error('Error fetching user profile:', err);
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

    fetchUserData();
});