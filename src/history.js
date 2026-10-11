// history.js

let currentDate = new Date(); // เดือนที่กำลังแสดงผล
let selectedDateStr = null;  // วันที่ผู้ใช้คลิกเลือก (รูปแบบ YYYY-MM-DD)
let monthlyRecords = {};     // เก็บข้อมูลบันทึกของเดือนนั้น {"YYYY-MM-DD": recordData}

const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const dayNamesEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ข้อมูล Mapping อารมณ์ (รูปภาพ ชื่ออารมณ์ และสีข้อความ)
const moodMap = {
    '1': { img: './image/mood01.png', en: 'Very Sad', th: 'เศร้ามาก', color: '#8D99AE' },
    '2': { img: './image/mood02.png', en: 'Sad', th: 'เศร้า', color: '#E07A5F' },
    '3': { img: './image/mood03.png', en: 'Neutral', th: 'ปานกลาง', color: '#D4A373' },
    '4': { img: './image/mood04.png', en: 'Good', th: 'อารมณ์ดี', color: '#A4D1B6' },
    '5': { img: './image/mood05.png', en: 'Very Good', th: 'อารมณ์ดีมาก', color: '#2A9D8F' }
};

// แปลงวันที่เป็น String รูปแบบ YYYY-MM-DD
function formatDateStr(year, month, day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

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
        
        if (window.supabase) {
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
        console.warn('เกิดข้อผิดพลาดในการดึงข้อมูลจาก Supabase:', err);
    }

    // กำหนดค่าเริ่มต้นของวันที่เลือก
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    if (!selectedDateStr || !selectedDateStr.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`)) {
        if (year === today.getFullYear() && month === today.getMonth()) {
            selectedDateStr = formatDateStr(year, month, today.getDate());
        } else {
            selectedDateStr = formatDateStr(year, month, 1);
        }
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
        const dateStr = formatDateStr(year, month, day);
        const record = monthlyRecords[dateStr];

        const thisCellDate = new Date(year, month, day);
        const isToday = thisCellDate.getTime() === today.getTime();
        const isFuture = thisCellDate.getTime() > today.getTime();
        const isSelected = dateStr === selectedDateStr;

        const dayCard = document.createElement('div');
        dayCard.id = `day_${day}`;

        let cardClasses = 'flex flex-col items-center justify-center p-2 gap-y-2 rounded-2xl transition-all duration-200 ';

        if (isFuture) {
            cardClasses += 'text-gray-300 opacity-50 pointer-events-none';
        } else {
            cardClasses += 'cursor-pointer hover:scale-95 text-gray-800';

            if (isSelected) {
                cardClasses += ' ring-2 ring-black/20 bg-gray-100/80 font-bold';
            } else if (isToday) {
                cardClasses += ' bg-gray-200/40 font-extrabold';
            }
        }

        dayCard.className = cardClasses;

        let moodContentHtml = '';

        if (record && record.emotion_level && !isFuture) {
            const config = moodMap[String(record.emotion_level)] || moodMap['5'];
            moodContentHtml = `
                <div class="bg-gray-100 rounded-full size-16 overflow-hidden shadow-sm">
                    <img id="moodimg" alt="moodimg" src="${config.img}" class="w-full h-full object-cover"/>
                </div>
            `;
        } else {
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

    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const dateObj = new Date(year, month, day);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (dateObj.getTime() > today.getTime()) return;

    const dayNameElem = document.getElementById('dayname');
    if (dayNameElem && dayNameElem.parentElement) {
        const dayNameEn = dayNamesEn[dateObj.getDay()];
        dayNameElem.parentElement.innerHTML = `
            ${day}
            <div id="dayname" class="text-4xl">${dayNameEn}</div>
        `;
    }

    const sideMoodImg = document.getElementById('sideMoodImg');
    const timeElem = document.getElementById('time');
    const moodNameElem = document.getElementById('moodname');
    const sideActionBtns = document.getElementById('sideActionBtns');

    const record = monthlyRecords[dateStr];

    if (record && record.emotion_level) {
        const config = moodMap[String(record.emotion_level)] || moodMap['5'];

        if (sideMoodImg) {
            sideMoodImg.src = config.img;
            sideMoodImg.classList.remove('hidden');

            // 🟢 เพิ่มการคลิกรูปภาพอารมณ์เพื่อเปิดดูหน้า view.html
            const imgContainer = sideMoodImg.parentElement;
            if (imgContainer) {
                imgContainer.style.cursor = 'pointer';
                imgContainer.title = 'คลิกเพื่อดูรายละเอียดบันทึก';
                imgContainer.onclick = () => {
                    window.location.href = `./view.html?entry_id=${record.daily_entry_id}`;
                };
            }
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
            moodNameElem.innerText = config.en;
            moodNameElem.style.color = config.color;
            moodNameElem.className = 'text-6xl font-extrabold mt-8';
        }

        if (sideActionBtns) sideActionBtns.classList.remove('hidden');

    } else {
        if (sideMoodImg) {
            sideMoodImg.classList.add('hidden');
            sideMoodImg.src = '';
            const imgContainer = sideMoodImg.parentElement;
            if (imgContainer) {
                imgContainer.style.cursor = 'default';
                imgContainer.onclick = null;
            }
        }
        
        if (timeElem) timeElem.innerText = '00:00 น.';
        if (moodNameElem) {
            moodNameElem.innerText = 'Mood';
            moodNameElem.style.color = '';
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
            const selectedYear = parseInt(yearSelect.value, 10);
            const selectedMonth = parseInt(monthSelect.value, 10);

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

    // ปุ่มย้อนกลับกลับหน้า Dashboard
    if (backBtn) {
        backBtn.onclick = () => {
            window.location.href = './dashboard.html';
        };
    }

    // ปุ่มเลื่อนเดือนย้อนหลัง
    if (prevBtn) {
        prevBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            fetchAndRenderCalendar();
        };
    }

    // ปุ่มเลื่อนเดือนถัดไป
    if (nextBtn) {
        nextBtn.onclick = () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            fetchAndRenderCalendar();
        };
    }

    // ปุ่มแก้ไข -> ย้ายไปหน้า edit.html พร้อมส่ง entry_id
    if (editBtn) {
        editBtn.onclick = () => {
            if (selectedDateStr && monthlyRecords[selectedDateStr]) {
                const record = monthlyRecords[selectedDateStr];

                // ตรวจสอบเงื่อนไข 30 นาทีเบื้องต้น (BR-05)
                const now = new Date();
                const recordTime = record.updated_at ? new Date(record.updated_at).getTime() : new Date(record.created_at).getTime();
                const diffMinutes = Math.floor((now.getTime() - recordTime) / (1000 * 60));

                if (diffMinutes > 30) {
                    alert('⏱️ ไม่สามารถแก้ไขบันทึกนี้ได้ เนื่องจากล่วงเลยกำหนดเวลา 30 นาทีแล้ว ระบบจะนำคุณไปที่หน้าดูรายละเอียด');
                    window.location.href = `./view.html?entry_id=${record.daily_entry_id}`;
                    return;
                }

                // ย้ายหน้าไปยัง edit.html
                window.location.href = `./edit.html?entry_id=${record.daily_entry_id}`;
            }
        };
    }

    // ปุ่มลบรายการบันทึก (พร้อมตัวดักจับ 24 ชม. / วันก่อนหน้า BR-05)
    if (deleteBtn) {
        deleteBtn.onclick = async () => {
            if (selectedDateStr && monthlyRecords[selectedDateStr]) {
                const record = monthlyRecords[selectedDateStr];

                // 🟢 1. ตรวจสอบเงื่อนไขวันบันทึกย้อนหลัง (BR-05)
                const now = new Date();
                const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

                const createdTime = record.created_at ? new Date(record.created_at).getTime() : new Date(record.entry_date).getTime();
                const diffHours = (now.getTime() - createdTime) / (1000 * 60 * 60);

                if (record.entry_date < todayStr || diffHours > 24) {
                    alert('⏱️ ไม่สามารถลบบันทึกย้อนหลังได้ เนื่องจากผ่านไปแล้ว 1 วัน (เกินกำหนด 24 ชั่วโมง)');
                    return;
                }

                if (confirm(`คุณต้องการลบบันทึกของวันที่ ${selectedDateStr} ใช่หรือไม่?`)) {
                    try {
                        const SUPABASE_URL = 'https://srwjzmtulcuneuqinpgx.supabase.co';
                        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
                        const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                        
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;

                        const { error } = await supabase.rpc('run_delete_daily_entry_with_cooldown', {
                            p_user_id: user.id,
                            p_daily_entry_id: record.daily_entry_id
                        });

                        if (!error) {
                            delete monthlyRecords[selectedDateStr];
                            renderCalendar();
                            updateSideDetail(selectedDateStr);
                            alert('ลบบันทึกเรียบร้อยแล้ว');
                        } else {
                            alert('ไม่สามารถลบบันทึกได้: ' + error.message);
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