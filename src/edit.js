// edit.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const monthNamesTh = [
    'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
    'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

const moodMap = {
    '1': { img: './image/mood01.png', en: '“ Very Sad ”', th: 'เศร้ามาก', color: '#8D99AE' },
    '2': { img: './image/mood02.png', en: '“ Sad ”', th: 'เศร้า', color: '#E07A5F' },
    '3': { img: './image/mood03.png', en: '“ Neutral ”', th: 'ปานกลาง', color: '#D4A373' },
    '4': { img: './image/mood04.png', en: '“ Good ”', th: 'อารมณ์ดี', color: '#A4D1B6' },
    '5': { img: './image/mood05.png', en: '“ Very Good ”', th: 'อารมณ์ดีมาก', color: '#2A9D8F' }
};

// ตรวจสอบเงื่อนไข 30 นาที (BR-05)
function isWithin30Minutes(updatedAtOrCreatedAt) {
    if (!updatedAtOrCreatedAt) return false;
    const recordTime = new Date(updatedAtOrCreatedAt).getTime();
    const currentTime = new Date().getTime();
    const diffMinutes = (currentTime - recordTime) / (1000 * 60);
    return diffMinutes <= 30;
}

// ฟังก์ชันแปลง YYYY-MM-DD เป็น "21 สิงหาคม 2569"
function formatThaiDateStr(dateStr) {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    const year = parseInt(parts[0], 10) + 543;
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return `${day} ${monthNamesTh[month]} ${year}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const entryId = urlParams.get('entry_id');

    // Element References
    const backBtn = document.getElementById('backBtn');
    const moodimg = document.getElementById('moodimg');
    const moodname_en = document.getElementById('moodname_en');
    const moodname_th = document.getElementById('moodname_th');
    const entryDateTitle = document.getElementById('entryDateTitle');
    const userAlias = document.getElementById('userAlias');
    const question_en = document.getElementById('question_en');
    const question_th = document.getElementById('question_th');
    const entryTextarea = document.getElementById('entryTextarea');

    const prevStepBtn = document.getElementById('prevStepBtn');
    const nextStepBtn = document.getElementById('nextStepBtn');
    const editBtn = document.getElementById('editBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const sumitBtn = document.getElementById('sumitBtn');

    // States
    let currentUser = null;
    let entryRecord = null;
    let reflectionRecord = null;

    let currentStep = 0; // 0 = Trigger, 1 = Reaction, 2 = Reflection
    let isEditing = false;

    // ข้อมูลข้อความในแต่ละ Step
    let originalData = { trigger: '', reaction: '', reflection: '' };
    let currentData = { trigger: '', reaction: '', reflection: '' };

    // คำถามประจำแต่ละ Step
    let stepQuestions = [
        {
            en: "What was the small trigger that shifted your mood today?",
            th: "อะไรคือสาเหตุที่ทำให้ mood คุณเปลี่ยนไปวันนี้?"
        },
        {
            en: "How do we deal with that feeling immediately?",
            th: "เราจัดการกับความรู้สึกนั้นทันทีด้วยวิธีไหน?"
        },
        {
            en: "What did you learn about yourself today?",
            th: "วันนี้คุณได้เรียนรู้อะไรเกี่ยวกับตัวเองบ้าง?"
        }
    ];

    if (!entryId) {
        alert('❌ ไม่พบข้อมูลบันทึกที่ต้องการแก้ไข');
        window.location.href = './history.html';
        return;
    }

    // 1. โหลดข้อมูลจาก Supabase
    async function loadData() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }
            currentUser = user;

            // แสดง Alias
            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) userAlias.textContent = cachedAlias;

            // ดึงข้อมูล daily_entries
            const { data: entry, error: entryErr } = await supabaseClient
                .from('daily_entries')
                .select('*')
                .eq('daily_entry_id', entryId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (entryErr || !entry) {
                alert('❌ ไม่พบบันทึก หรือคุณไม่มีสิทธิ์เข้าถึง');
                window.location.href = './history.html';
                return;
            }

            // เช็กเวลา 30 นาที (BR-05)
            const lastUpdated = entry.updated_at || entry.created_at;
            if (!isWithin30Minutes(lastUpdated)) {
                alert('⏱️ บันทึกนี้เกินกำหนดเวลา 30 นาทีแล้ว ไม่สามารถแก้ไขได้ ระบบจะนำคุณไปที่หน้าดูประวัติ');
                window.location.href = `./view.html?entry_id=${entryId}`;
                return;
            }

            entryRecord = entry;

            // 🟢 ดึงข้อมูล reflection_logs พร้อม JOIN ตาราง questions เพื่อเอาคำถามที่สุ่มได้จริง
            const { data: refLog } = await supabaseClient
                .from('reflection_logs')
                .select('*, questions(question_text, question_text_en)')
                .eq('daily_entry_id', entryId)
                .maybeSingle();

            if (refLog) {
                reflectionRecord = refLog;
                
                // ดึงข้อความคำถามจริงจาก DB
                const qTh = refLog.questions?.question_text || refLog.question_snapshot || "วันนี้คุณได้เรียนรู้อะไรเกี่ยวกับตัวเองบ้าง?";
                const qEn = refLog.questions?.question_text_en || "What did you learn about yourself today?";

                stepQuestions[2] = {
                    th: qTh,
                    en: qEn
                };
            }

            // กำหนดค่าตั้งต้น
            originalData = {
                trigger: entry.trigger_text || '',
                reaction: entry.reaction_text || '',
                reflection: reflectionRecord ? (reflectionRecord.reflection_text || '') : ''
            };
            currentData = { ...originalData };

            // แสดงผล UI
            renderHeaderAndMood();
            renderStepUI();

        } catch (err) {
            console.error('Error loading edit data:', err);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
            window.location.href = './history.html';
        }
    }

    // 2. แสดงรูปภาพอารมณ์และวันที่
    function renderHeaderAndMood() {
        if (!entryRecord) return;

        if (entryDateTitle) {
            entryDateTitle.textContent = formatThaiDateStr(entryRecord.entry_date);
        }

        const moodConfig = moodMap[String(entryRecord.emotion_level)] || moodMap['3'];
        if (moodimg) moodimg.src = moodConfig.img;

        if (moodname_en) {
            moodname_en.firstChild.textContent = moodConfig.en + ' ';
            moodname_en.style.color = moodConfig.color;
        }
        if (moodname_th) {
            moodname_th.textContent = moodConfig.th;
        }
    }

    // 3. แสดงผลข้อมูลตาม Step ปัจจุบัน
    function renderStepUI() {
        const q = stepQuestions[currentStep];
        if (question_en) question_en.textContent = q.en;
        if (question_th) question_th.textContent = q.th;

        let textVal = '';
        if (currentStep === 0) textVal = currentData.trigger;
        else if (currentStep === 1) textVal = currentData.reaction;
        else if (currentStep === 2) textVal = currentData.reflection;

        if (entryTextarea) {
            entryTextarea.value = textVal;
            entryTextarea.readOnly = !isEditing;
            if (isEditing) {
                entryTextarea.classList.remove('bg-transparent');
                entryTextarea.classList.add('bg-white');
            } else {
                entryTextarea.classList.add('bg-transparent');
                entryTextarea.classList.remove('bg-white');
            }
        }

        if (prevStepBtn) prevStepBtn.disabled = (currentStep === 0);
        
        const maxStep = reflectionRecord ? 2 : 1;
        if (nextStepBtn) nextStepBtn.disabled = (currentStep >= maxStep);
    }

    if (entryTextarea) {
        entryTextarea.addEventListener('input', () => {
            if (!isEditing) return;
            const val = entryTextarea.value;
            if (currentStep === 0) currentData.trigger = val;
            else if (currentStep === 1) currentData.reaction = val;
            else if (currentStep === 2) currentData.reflection = val;
        });
    }

    if (prevStepBtn) {
        prevStepBtn.onclick = () => {
            if (currentStep > 0) {
                currentStep--;
                renderStepUI();
            }
        };
    }

    if (nextStepBtn) {
        nextStepBtn.onclick = () => {
            const maxStep = reflectionRecord ? 2 : 1;
            if (currentStep < maxStep) {
                currentStep++;
                renderStepUI();
            }
        };
    }

    if (editBtn) {
        editBtn.onclick = () => {
            isEditing = true;
            editBtn.classList.add('hidden');
            cancelBtn.classList.remove('hidden');
            sumitBtn.classList.remove('hidden');

            renderStepUI();
            if (entryTextarea) entryTextarea.focus();
        };
    }

    if (cancelBtn) {
        cancelBtn.onclick = () => {
            currentData = { ...originalData };
            isEditing = false;

            cancelBtn.classList.add('hidden');
            sumitBtn.classList.add('hidden');
            editBtn.classList.remove('hidden');

            renderStepUI();
        };
    }

    if (sumitBtn) {
        sumitBtn.onclick = async () => {
            if (!entryRecord || !currentUser) return;

            const lastUpdated = entryRecord.updated_at || entryRecord.created_at;
            if (!isWithin30Minutes(lastUpdated)) {
                alert('⏱️ บันทึกนี้เกินกำหนดเวลา 30 นาทีแล้ว ไม่สามารถบันทึกการแก้ไขได้');
                window.location.href = './history.html';
                return;
            }

            sumitBtn.disabled = true;

            try {
                const nowIso = new Date().toISOString();

                const { error: entryErr } = await supabaseClient
                    .from('daily_entries')
                    .update({
                        trigger_text: currentData.trigger,
                        reaction_text: currentData.reaction,
                        updated_at: nowIso
                    })
                    .eq('daily_entry_id', entryRecord.daily_entry_id)
                    .eq('user_id', currentUser.id);

                if (entryErr) throw entryErr;

                if (reflectionRecord) {
                    const { error: refErr } = await supabaseClient
                        .from('reflection_logs')
                        .update({
                            reflection_text: currentData.reflection,
                            updated_at: nowIso
                        })
                        .eq('reflection_id', reflectionRecord.reflection_id);

                    if (refErr) throw refErr;
                }

                originalData = { ...currentData };
                entryRecord.updated_at = nowIso;

                isEditing = false;
                cancelBtn.classList.add('hidden');
                sumitBtn.classList.add('hidden');
                editBtn.classList.remove('hidden');
                sumitBtn.disabled = false;

                renderStepUI();
                alert('✅ บันทึกการแก้ไขเรียบร้อยแล้ว');

            } catch (err) {
                console.error('Error saving edits:', err);
                alert('เกิดข้อผิดพลาดในการบันทึก: ' + err.message);
                sumitBtn.disabled = false;
            }
        };
    }

    if (backBtn) {
        backBtn.onclick = () => window.location.href = './history.html';
    }

    loadData();
});