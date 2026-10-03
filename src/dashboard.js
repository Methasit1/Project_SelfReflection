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

    // 1. ดึงข้อมูลผู้ใช้จาก Supabase
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
            console.error('Error fetching user data:', err);
        }
    }

    // 2. ฟังก์ชันสลับดีไซน์ปุ่มเมื่อคลิกเลือกวัน
    function updateSelection(type) {
        selectedType = type;
        if (type === 'today') {
            todayBtn.className = activeClass;
            prevDayBtn.className = inactiveClass;
        } else if (type === 'previous') {
            prevDayBtn.className = activeClass;
            todayBtn.className = inactiveClass;
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
            if (!isCardVisible) {
                // กดครั้งแรก: แสดงกล่องคำถาม + เล่น Animation ค่อยๆ ลอยขึ้นมา
                dateChoiceCard.classList.remove('hidden');
                dateChoiceCard.classList.add('flex');

                dateChoiceCard.animate(
                    [
                        { opacity: 0, transform: 'translateY(24px)' },
                        { opacity: 1, transform: 'translateY(0)' }
                    ],
                    {
                        duration: 1000,
                        easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
                        fill: 'forwards'
                    }
                );

                isCardVisible = true;
            } else {
                // กดครั้งที่สอง (หลังเลือกว่าจะเอาวันไหนแล้ว): บันทึกค่า และเปลี่ยนหน้าไป selectmood.html
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