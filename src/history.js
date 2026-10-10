let currentDate = new Date(); // เดือนที่กำลังแสดงผล
let selectedDateStr = null;  // วันที่ผู้ใช้คลิกเลือก
let monthlyRecords = {};     // เก็บข้อมูลบันทึกของเดือนนั้น {"YYYY-MM-DD": recordData}

const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// การตั้งค่าชื่อสถานะอารมณ์และสีข้อความ
const moodConfig = {
    1: { name: 'Terrible', textClass: 'text-gray-500' },
    2: { name: 'Down', textClass: 'text-[#E09F67]' },
    3: { name: 'Neutral', textClass: 'text-[#B3A278]' },
    4: { name: 'Okay', textClass: 'text-[#68B984]' },
    5: { name: 'Good', textClass: 'text-[#52B788]' }
};

// ดึงข้อมูลจาก Supabase และ Render ปฏิทิน
async function fetchAndRenderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // 1. อัปเดตชื่อเดือนและปี (พ.ศ.) บน Header ปฏิทิน
    const titleElem = document.getElementById('monthYearTitle');
    if (titleElem) {
        titleElem.innerText = `${monthNamesTh[month]} ${year + 543}`;
    }

    // 2. ดึงข้อมูลบันทึกประจำเดือนจากตาราง daily_entries
    try {
        const SUPABASE_URL = 'https://srwjzmtulcuneuqinpgx.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
        
        if (window.supabase && SUPABASE_URL !== 'https://srwjzmtulcuneuqinpgx.supabase.co') {
            const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`;
            const lastDay = new Date(year, month + 1, 0).getDate();
            const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${lastDay}`;

            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: records, error } = await supabase
                    .from('daily_entries')
                    .select(`
                        daily_entry_id,
                        entry_date,
                        emotion_level,
                        trigger_text,
                        reaction_text,
                        created_at,
                        reflection_logs (
                            question_snapshot,
                            reflection_text
                        )
                    `)
                    .eq('user_id', user.id)
                    .gte('entry_date', startDate)
                    .lte('entry_date', endDate);

                if (error) {
                    console.error('Error fetching daily entries:', error);
                }

                monthlyRecords = {};
                if (records) {
                    records.forEach(r => {
                        monthlyRecords[r.entry_date] = r;
                    });
                }
            }
        }
    } catch (err) {
        console.warn('ระบบทำงานในโหมดออฟไลน์ หรือยังไม่ได้ระบุ Supabase URL/Key:', err);
    }

    // กำหนดวันที่เลือกเริ่มต้นเป็นวันนี้ (หากยังไม่ได้เลือกวัน)
    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    if (!selectedDateStr) {
        selectedDateStr = todayStr;
    }

    // 3. วาดตารางปฏิทินและอัปเดตการ์ดข้อมูลฝั่งขวา
    renderCalendar();
    updateSideDetail(selectedDateStr);
}

function renderCalendar() {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = อาทิตย์
    const totalDays = new Date(year, month + 1, 0).getDate();

    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    grid.innerHTML = '';

    // 1. ช่องว่างวันต้นเดือนเพื่อให้ตรงวัน Sun-Sat
    for (let i = 0; i < firstDayIndex; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'p-2';
        grid.appendChild(emptyDiv);
    }

    // 2. วนลูปสร้างการ์ดวันที่ 1 ถึง วันสุดท้ายของเดือน
    for (let day = 1; day <= totalDays; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = monthlyRecords[dateStr];

        const thisCellDate = new Date(year, month, day);
        const isToday = thisCellDate.getTime() === today.getTime();
        const isFuture = thisCellDate.getTime() > today.getTime();
        const isSelected = dateStr === selectedDateStr;

        const dayCard = document.createElement('div');
        dayCard.id = `day_${day}`;

        let cardClasses = 'flex flex-col items-center justify-center p-2 gap-y-2 rounded-2xl transition-all duration-200 ';

        if (isFuture) {
            // วันอนาคต: สีเทาอ่อน, ห้ามกด (pointer-events-none), ไม่ย่อขนาด, ไม่เปลี่ยน cursor
            cardClasses += 'text-gray-300 opacity-50 pointer-events-none';
        } else {
            // วันอดีต/ปัจจุบัน: กดได้ + มี hover scale
            cardClasses += 'cursor-pointer hover:scale-95 text-gray-1000';

            if (isSelected) {
                cardClasses += ' ring-2 ring-black/20 bg-gray-100/80';
            } else if (isToday) {
                cardClasses += ' bg-gray-200/40 font-extrabold';
            }
        }

        dayCard.className = cardClasses;

        let moodContentHtml = '';

        if (record && record.emotion_level && !isFuture) {
            // วันที่มีการบันทึกอารมณ์
            const moodImgNum = String(record.emotion_level).padStart(2, '0');
            moodContentHtml = `
                <div class="bg-gray-100 rounded-full size-16 overflow-hidden shadow-sm">
                    <img id="moodimg" alt="moodimg" src="./image/mood${moodImgNum}.png" class="w-full h-full object-cover"/>
                </div>
            `;
        } else {
            // วันที่ไม่มีการบันทึก หรือ วันในอนาคต: แสดงวงกลมเส้นประ
            const borderStyle = isFuture ? 'border-gray-200' : 'border-gray-300 hover:border-gray-400';
            moodContentHtml = `
                <div class="border-2 border-dashed ${borderStyle} rounded-full size-16 flex items-center justify-center text-gray-300 transition-colors">
                </div>
            `;
        }

        dayCard.innerHTML = `
            <div class="text-4xl font-bold">${day}</div>
            ${moodContentHtml}
        `;

        // ผูก Event คลิกเฉพาะวันในอดีตและวันปัจจุบันเท่านั้น (วันอนาคตจะไม่ให้คลิกได้)
        if (!isFuture) {
            dayCard.onclick = () => {
                selectedDateStr = dateStr;
                renderCalendar();
                updateSideDetail(dateStr);
            };
        }

        grid.appendChild(dayCard);
    }
}

// ==========================================
// อัปเดตข้อมูลการ์ดฝั่งขวา (Side Detail Panel)
// ==========================================
function updateSideDetail(dateStr) {
    if (!dateStr) return;

    // ตรวจสอบไม่ให้อัปเดตเป็นวันในอนาคต
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]) - 1;
    const day = parseInt(parts[2]);

    const dateObj = new Date(year, month, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateObj.getTime() > today.getTime()) {
        return; // ห้ามดูวันอนาคต
    }

    // 1. อัปเดตตัวเลขวันที่และชื่อวันในสัปดาห์ภาษาอังกฤษ (Sun - Sat)
    const dayNameElem = document.getElementById('dayname');
    if (dayNameElem && dayNameElem.parentElement) {
        const dayNameEn = dayNamesEn[dateObj.getDay()];
        dayNameElem.parentElement.innerHTML = `
            ${day}
            <div id="dayname" class="text-4xl">${dayNameEn}</div>
        `;
    }

    // 2. อัปเดตรายละเอียดการบันทึกอารมณ์
    const sideMoodImg = document.getElementById('sideMoodImg');
    const timeElem = document.getElementById('time');
    const moodNameElem = document.getElementById('moodname');
    const sideActionBtns = document.getElementById('sideActionBtns');

    const record = monthlyRecords[dateStr];

    if (record && record.emotion_level) {
        // มีข้อมูลบันทึกอารมณ์
        const config = moodConfig[record.emotion_level] || moodConfig[5];
        const moodImgNum = String(record.emotion_level).padStart(2, '0');

        if (sideMoodImg) {
            sideMoodImg.src = `./image/mood${moodImgNum}.png`;
            sideMoodImg.classList.remove('hidden');
        }

        let timeStr = '00:00 น.';
        if (record.created_at) {
            const t = new Date(record.created_at);
            const hours = String(t.getHours()).padStart(2, '0');
            const mins = String(t.getMinutes()).padStart(2, '0');
            timeStr = `${hours}:${mins} น.`;
        }
        if (timeElem) timeElem.innerText = timeStr;

        if (moodNameElem) {
            moodNameElem.innerText = config.name;
            moodNameElem.className = `text-6xl font-extrabold mt-8 ${config.textClass}`;
        }

        if (sideActionBtns) sideActionBtns.classList.remove('hidden');

    } else {
        // ไม่มีข้อมูลบันทึก
        if (sideMoodImg) sideMoodImg.classList.add('hidden');
        
        if (timeElem) timeElem.innerText = '00:00 น.';
        if (moodNameElem) {
            moodNameElem.innerText = 'Mood';
            moodNameElem.className = 'text-6xl font-extrabold mt-8 text-gray-300';
        }

        if (sideActionBtns) sideActionBtns.classList.add('hidden');
    }
}

// ==========================================
// ระบบ Modal เลือกเดือนและปี
// ==========================================
function setupMonthYearPicker() {
    const monthYearBtn = document.getElementById('monthYearBtn');
    const monthYearModal = document.getElementById('monthYearModal');
    const yearSelect = document.getElementById('yearSelect');
    const monthSelect = document.getElementById('monthSelect');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelModalBtn = document.getElementById('cancelModalBtn');
    const applyBtn = document.getElementById('applyMonthYearBtn');

    if (!monthYearBtn || !monthYearModal) return;

    monthYearBtn.onclick = () => {
        const curYear = currentDate.getFullYear();
        const curMonth = currentDate.getMonth();

        yearSelect.innerHTML = '';
        const nowYear = new Date().getFullYear();
        for (let y = nowYear - 5; y <= nowYear + 5; y++) {
            const opt = document.createElement('option');
            opt.value = y;
            opt.innerText = `${y + 543} (${y})`;
            if (y === curYear) opt.selected = true;
            yearSelect.appendChild(opt);
        }

        monthSelect.innerHTML = '';
        monthNamesTh.forEach((mName, idx) => {
            const opt = document.createElement('option');
            opt.value = idx;
            opt.innerText = mName;
            if (idx === curMonth) opt.selected = true;
            monthSelect.appendChild(opt);
        });

        monthYearModal.classList.remove('hidden');
    };

    const closeModal = () => monthYearModal.classList.add('hidden');
    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    if (cancelModalBtn) cancelModalBtn.onclick = closeModal;

    if (applyBtn) {
        applyBtn.onclick = () => {
            const selectedYear = parseInt(yearSelect.value);
            const selectedMonth = parseInt(monthSelect.value);

            currentDate.setFullYear(selectedYear);
            currentDate.setMonth(selectedMonth);

            closeModal();
            fetchAndRenderCalendar();
        };
    }

    monthYearModal.onclick = (e) => {
        if (e.target === monthYearModal) closeModal();
    };
}

// Event Listeners สำหรับปุ่มย้อนกลับ / เปลี่ยนเดือน / แก้ไข / ลบ
document.addEventListener('DOMContentLoaded', () => {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const backBtn = document.getElementById('backBtn');
    const editBtn = document.getElementById('editBtn');
    const deleteBtn = document.getElementById('deleteBtn');

    // ปุ่มย้อนกลับ
    if (backBtn) {
        backBtn.onclick = () => window.history.back();
    }

    // ปุ่มเลื่อนเดือน
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            fetchAndRenderCalendar();
        };
    }

    if (nextBtn) {
        nextBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            fetchAndRenderCalendar();
        };
    }

    // ปุ่มแก้ไข
    if (editBtn) {
        editBtn.onclick = () => {
            if (selectedDateStr && monthlyRecords[selectedDateStr]) {
                window.location.href = `./tracker.html?date=${selectedDateStr}&action=edit`;
            }
        };
    }

    // ปุ่มลบ
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (selectedDateStr && monthlyRecords[selectedDateStr]) {
                if (confirm(`คุณต้องการลบบันทึกของวันที่ ${selectedDateStr} ใช่หรือไม่?`)) {
                    const record = monthlyRecords[selectedDateStr];
                    try {
                        const SUPABASE_URL = 'https://srwjzmtulcuneuqinpgx.supabase.co';
                        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
                        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                        
                        const { error } = await supabase
                            .from('daily_entries')
                            .delete()
                            .eq('daily_entry_id', record.daily_entry_id);

                        if (!error) {
                            delete monthlyRecords[selectedDateStr];
                            renderCalendar();
                            updateSideDetail(selectedDateStr);
                        } else {
                            alert('เกิดข้อผิดพลาดในการลบบันทึก: ' + error.message);
                        }
                    } catch (err) {
                        console.error('Delete failed:', err);
                    }
                }
            }
        };
    }

    // เริ่มต้นระบบเลือกเดือนและโหลดข้อมูล
    setupMonthYearPicker();
    fetchAndRenderCalendar();
});