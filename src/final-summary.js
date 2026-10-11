// final-summary.js
const supabaseClient = window.supabaseClient;

// Mapping อารมณ์ (รูปภาพ และสีข้อความ)
const moodMap = {
    '1': { img: './image/mood01.png', en: '“ Very Sad ”', th: 'เศร้ามาก', color: '#8D99AE' },
    '2': { img: './image/mood02.png', en: '“ Sad ”', th: 'เศร้า', color: '#E07A5F' },
    '3': { img: './image/mood03.png', en: '“ Neutral ”', th: 'ปานกลาง', color: '#D4A373' },
    '4': { img: './image/mood04.png', en: '“ Good ”', th: 'อารมณ์ดี', color: '#A4D1B6' },
    '5': { img: './image/mood05.png', en: '“ Very Good ”', th: 'อารมณ์ดีมาก', color: '#2A9D8F' }
};

// ฟังก์ชันคำนวณวันที่บันทึก (วันนี้ หรือ วันก่อนหน้า)
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
    const selectmoodImg = document.getElementById('selectmood');
    const moodTitleEn = document.getElementById('moodTitleEn');
    const moodTitleTh = document.getElementById('moodTitleTh');
    const historyBtn = document.getElementById('historyBtn');

    // ฟังก์ชันอัปเดต UI หน้าจอตามระดับอารมณ์
    function updateMoodUI(level) {
        const currentMood = moodMap[String(level)] || moodMap['3'];
        if (selectmoodImg) selectmoodImg.src = currentMood.img;
        if (moodTitleEn) {
            moodTitleEn.textContent = currentMood.en;
            moodTitleEn.style.color = currentMood.color;
        }
        if (moodTitleTh) {
            moodTitleTh.textContent = currentMood.th;
            moodTitleTh.style.color = currentMood.color;
        }
    }

    // 1. แสดงจาก sessionStorage ก่อนเพื่อความเร็ว (ถ้ามี)
    const cachedLevel = sessionStorage.getItem('selected_mood_level');
    if (cachedLevel && moodMap[cachedLevel]) {
        updateMoodUI(cachedLevel);
    }

    // 2. ดึงระดับอารมณ์จริงจากตาราง daily_entries ใน Supabase
    async function checkAuthAndFetchData() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            // แสดง Alias
            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) userAlias.textContent = cachedAlias;

            const { data: userData } = await supabaseClient
                .from('users')
                .select('nickname')
                .eq('user_id', user.id)
                .maybeSingle();

            if (userData?.nickname) {
                if (userAlias) userAlias.textContent = userData.nickname;
                localStorage.setItem('userAlias', userData.nickname);
            }

            // ดึงข้อมูลการบันทึกอารมณ์ตามวันที่บันทึก
            const entryDate = getEntryDate();
            let { data: entryData } = await supabaseClient
                .from('daily_entries')
                .select('emotion_level')
                .eq('user_id', user.id)
                .eq('entry_date', entryDate)
                .maybeSingle();

            // หากหาตาม entryDate ไม่เจอ ให้ลองดึงของวันปัจจุบันเป็นสำรอง
            if (!entryData) {
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
                const { data: todayEntry } = await supabaseClient
                    .from('daily_entries')
                    .select('emotion_level')
                    .eq('user_id', user.id)
                    .eq('entry_date', todayStr)
                    .maybeSingle();
                entryData = todayEntry;
            }

            // อัปเดต UI เมื่อได้ข้อมูลระดับอารมณ์จริงจากฐานข้อมูล
            if (entryData && entryData.emotion_level) {
                sessionStorage.setItem('selected_mood_level', String(entryData.emotion_level));
                updateMoodUI(entryData.emotion_level);
            }
        } catch (err) {
            console.error('Error in checkAuthAndFetchData:', err);
        }
    }

    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = './history.html';
        });
    }

    checkAuthAndFetchData();
});