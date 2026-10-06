// dashboard.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    const userAlias = document.getElementById('userAlias');
    const userAvatar = document.getElementById('userAvatar');
    const startBtn = document.getElementById('startBtn');
    const prevDayBtn = document.getElementById('prevDayBtn');
    const todayBtn = document.getElementById('todayBtn');
    const historyBtn = document.getElementById('historyBtn');
    const dateChoiceCard = document.getElementById('dateChoiceCard');

    // ตัวแปรเช็กสถานะการแสดงผลกล่องคำถาม และตัวเลือกวัน
    let isCardVisible = false;
    let selectedType = 'today';

    // Class สไตล์ของปุ่ม ( Active = ดำ / Inactive = ขาว )
    const activeClass = "bg-black text-white font-bold text-2xl py-6 px-6 rounded-full w-1/2 hover:scale-105 active:scale-95 transition-all cursor-pointer";
    const inactiveClass = "bg-white text-black border border-gray-200 figma-shadow font-bold text-2xl py-6 px-6 rounded-full w-1/2 hover:scale-105 active:scale-95 transition-all cursor-pointer";

    // ฟังก์ชันตรวจสอบว่าเป็นช่วงเวลา 00:01 - 05:00 น. หรือไม่
    function isLateNightWindow() {
        const now = new Date();
        const totalMinutes = now.getHours() * 60 + now.getMinutes();
        // 00:01 = 1 นาที, 05:00 = 300 นาที
        return totalMinutes >= 1 && totalMinutes <= 300;
    }

    // 1. ตรวจสอบ Auth และดึงข้อมูลผู้ใช้จาก Supabase
    async function fetchUserData() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert('❌ ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
                window.location.href = 'login.html';
                return;
            }

            // แสดงชื่อจาก localStorage ก่อนเพื่อความรวดเร็ว
            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) {
                userAlias.textContent = cachedAlias;
            }

            // ดึงข้อมูลจริงจากตาราง users (คอลัมน์ nickname) ผ่าน user_id
            const { data: userData } = await supabaseClient
                .from('users')
                .select('nickname')
                .eq('user_id', user.id)
                .maybeSingle();

            if (userData && userData.nickname) {
                if (userAlias) userAlias.textContent = userData.nickname;
                localStorage.setItem('userAlias', userData.nickname);
            }
        } catch (err) {
            console.error('Error fetching user data:', err);
        }
    }

    // 2. ฟังก์ชันสลับดีไซน์ปุ่มเมื่อคลิกเลือกวัน
    function updateSelection(type) {
        selectedType = type;
        if (type === 'today') {
            if (todayBtn) todayBtn.className = activeClass;
            if (prevDayBtn) prevDayBtn.className = inactiveClass;
        } else if (type === 'previous') {
            if (prevDayBtn) prevDayBtn.className = activeClass;
            if (todayBtn) todayBtn.className = inactiveClass;
        }
    }

    // 3. Event Listeners สำหรับการสลับเลือกปุ่มวัน
    if (todayBtn) {
        todayBtn.addEventListener('click', () => updateSelection('today'));
    }

    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => updateSelection('previous'));
    }

    // 4. Event Listener สำหรับปุ่ม Start
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            const lateNight = isLateNightWindow();

            // หากอยู่นอกช่วงเวลา 00:01 - 05:00 น. ให้ถือเป็นวันนี้เสมอ และข้ามไปหน้า selectmood.html ทันที
            if (!lateNight) {
                sessionStorage.setItem('record_type', 'today');
                window.location.href = './selectmood.html';
                return;
            }

            // หากอยู่ในช่วงเวลา 00:01 - 05:00 น. ให้แสดงกล่องเลือกวันก่อน
            if (!isCardVisible) {
                dateChoiceCard.classList.remove('hidden');
                dateChoiceCard.classList.add('flex');

                dateChoiceCard.animate(
                    [
                        { opacity: 0, transform: 'translateY(24px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ],
                    {
                        duration: 400,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        fill: 'forwards'
                    }
                );

                isCardVisible = true;
            } else {
                // กดครั้งที่สองหลังจากเลือกวันแล้ว
                sessionStorage.setItem('record_type', selectedType);
                window.location.href = './selectmood.html';
            }
        });
    }

    // 5. ปุ่ม History
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = './history.html';
        });
    }

    fetchUserData();
});