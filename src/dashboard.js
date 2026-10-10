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

    let isCardVisible = false;
    let currentUser = null;
    let lastEntryDeletedAt = null;

    // สถานะการบันทึกในฐานข้อมูล
    let hasTodayEntry = false;
    let hasPrevEntry = false;
    let selectedRecordType = 'today';

    // ฟังก์ชันช่วยคำนวณวันที่ในรูปแบบ YYYY-MM-DD
    function getFormattedDate(offsetDays = 0) {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ฟังก์ชันตรวจสอบช่วงเวลาตี 00:01 - 05:00 น. (ตาม BR-08)
    function isLateNightWindow() {
        const now = new Date();
        const totalMinutes = now.getHours() * 60 + now.getMinutes();
        return totalMinutes >= 1 && totalMinutes <= 300;
    }

    // ตรวจสอบ Spam Cooldown 1 นาทีหลังจากการลบบันทึก (BR-01)
    function checkSpamCooldown() {
        if (!lastEntryDeletedAt) return true;

        const deletedTime = new Date(lastEntryDeletedAt).getTime();
        const currentTime = new Date().getTime();
        const diffSeconds = Math.floor((currentTime - deletedTime) / 1000);

        if (diffSeconds < 60) {
            const remaining = 60 - diffSeconds;
            alert(`⏳ คุณเพิ่งลบบันทึกไป กรุณารอ ${remaining} วินาทีก่อนสร้างบันทึกใหม่ครับ`);
            return false;
        }
        return true;
    }

    // อัปเดตสถานะและการแสดงผลของปุ่มเลือกวัน (กรณีติด Late-Night Window)
    function updateDateButtonUI() {
        if (!todayBtn || !prevDayBtn) return;

        const activeClass = 'bg-black text-white font-bold text-2xl py-6 px-6 rounded-full w-1/2 hover:scale-105 active:scale-95 transition-all cursor-pointer';
        const inactiveClass = 'bg-white text-black border border-gray-200 figma-shadow font-bold text-2xl py-6 px-6 rounded-full w-1/2 hover:scale-105 active:scale-95 transition-all cursor-pointer';
        const disabledClass = 'bg-gray-100 text-gray-400 border border-gray-200 font-bold text-2xl py-6 px-6 rounded-full w-1/2 opacity-40 cursor-not-allowed pointer-events-none';

        // หากเมื่อวานบันทึกไปแล้ว ให้ปิดปุ่ม "วันก่อนหน้า" ไม่ให้เลือกซ้ำ
        if (hasPrevEntry) {
            prevDayBtn.className = disabledClass;
            todayBtn.className = activeClass;
            selectedRecordType = 'today';
        } else {
            if (selectedRecordType === 'today') {
                todayBtn.className = activeClass;
                prevDayBtn.className = inactiveClass;
            } else {
                prevDayBtn.className = activeClass;
                todayBtn.className = inactiveClass;
            }
        }
    }

    // 1. ตรวจสอบสิทธิ์ และเช็กสถานะการบันทึกอารมณ์จาก Supabase
    async function fetchUserDataAndCheckEntries() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert('❌ ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
                window.location.href = 'login.html';
                return;
            }

            currentUser = user;

            // ดึงข้อมูลส่วนตัวผู้ใช้
            const { data: userData } = await supabaseClient
                .from('users')
                .select('nickname, last_entry_deleted_at')
                .eq('user_id', user.id)
                .maybeSingle();

            if (userData) {
                if (userData.nickname) {
                    if (userAlias) userAlias.textContent = userData.nickname;
                    localStorage.setItem('userAlias', userData.nickname);
                }
                lastEntryDeletedAt = userData.last_entry_deleted_at;
            }

            // 2. ดึงประวัติการบันทึกของ "วันนี้" และ "เมื่อวาน"
            const todayStr = getFormattedDate(0);
            const prevStr = getFormattedDate(-1);

            const { data: entries } = await supabaseClient
                .from('daily_entries')
                .select('entry_date')
                .eq('user_id', user.id)
                .in('entry_date', [todayStr, prevStr]);

            if (entries && entries.length > 0) {
                hasTodayEntry = entries.some(e => e.entry_date === todayStr);
                hasPrevEntry = entries.some(e => e.entry_date === prevStr);
            }

            // 🟢 [เงื่อนไขหลัก]: หากวันนี้มีบันทึกอารมณ์แล้ว -> บังคับไปหน้า final-summary.html ทันที
            if (hasTodayEntry) {
                window.location.href = './final-summary.html';
                return;
            }

        } catch (err) {
            console.error('Error fetching user data and entries:', err);
        }
    }

    // 2. Event Listeners ปุ่มเลือกวัน
    if (todayBtn) {
        todayBtn.addEventListener('click', () => {
            selectedRecordType = 'today';
            updateDateButtonUI();
        });
    }

    if (prevDayBtn) {
        prevDayBtn.addEventListener('click', () => {
            if (hasPrevEntry) return; // ป้องกันการกดเมื่อวานซ้ำ
            selectedRecordType = 'previous';
            updateDateButtonUI();
        });
    }

    // 3. Event Listener สำหรับปุ่ม Start
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            if (!checkSpamCooldown()) return;

            // ป้องกันกรณีสลับแท็บ แล้ววันนี้บันทึกไปแล้ว
            if (hasTodayEntry) {
                window.location.href = './final-summary.html';
                return;
            }

            const lateNight = isLateNightWindow();

            // หากอยู่นอกช่วงเวลา 00:01 - 05:00 น. หรือเมื่อวานลงบันทึกเรียบร้อยแล้ว
            // ให้บันทึกเป็นของ "วันนี้" และเริ่มขั้นตอนถัดไปทันที
            if (!lateNight || hasPrevEntry) {
                sessionStorage.setItem('record_type', 'today');
                window.location.href = './selectmood.html';
                return;
            }

            // หากอยู่ในช่วงเวลา 00:01 - 05:00 น. และเมื่อวานยังไม่ได้บันทึก
            if (!isCardVisible) {
                // กด Start ครั้งแรก: แสดงกล่องป๊อปอัพให้เลือกวัน
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
                updateDateButtonUI();
            } else {
                // กด Start ครั้งที่สอง (หลังเลือกวันแล้ว): เซฟประเภทวันลง sessionStorage แล้วย้ายหน้า
                sessionStorage.setItem('record_type', selectedRecordType);
                window.location.href = './selectmood.html';
            }
        });
    }

    // 4. ปุ่ม History
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = './history.html';
        });
    }

    fetchUserDataAndCheckEntries();
});

// dashboard.js (เพิ่มต่อท้ายไฟล์)

// 🟢 ดักจับเมื่อผู้ใช้กดย้อนกลับมาจากปุ่มของ Browser
window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
        // หากเป็นการดึงหน้าเดิมมาจาก Cache ให้ดึงข้อมูลและเช็กการบันทึกใหม่ทันที
        fetchUserDataAndCheckEntries();
    }
});