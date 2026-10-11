// view.js
const supabaseClient = window.supabaseClient;

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

    let currentUser = null;
    let entryRecord = null;
    let reflectionRecord = null;
    let currentStep = 0;

    let dataMap = { trigger: '', reaction: '', reflection: '' };

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
        alert('❌ ไม่พบข้อมูลบันทึก');
        window.location.href = './history.html';
        return;
    }

    async function loadData() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }
            currentUser = user;

            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) userAlias.textContent = cachedAlias;

            const { data: entry, error: entryErr } = await supabaseClient
                .from('daily_entries')
                .select('*')
                .eq('daily_entry_id', entryId)
                .eq('user_id', user.id)
                .maybeSingle();

            if (entryErr || !entry) {
                alert('❌ ไม่พบบันทึก');
                window.location.href = './history.html';
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

            dataMap = {
                trigger: entry.trigger_text || '',
                reaction: entry.reaction_text || '',
                reflection: reflectionRecord ? (reflectionRecord.reflection_text || '') : ''
            };

            renderHeaderAndMood();
            renderStepUI();

        } catch (err) {
            console.error('Error loading view data:', err);
            alert('เกิดข้อผิดพลาดในการดึงข้อมูล');
            window.location.href = './history.html';
        }
    }

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

    function renderStepUI() {
        const q = stepQuestions[currentStep];
        if (question_en) question_en.textContent = q.en;
        if (question_th) question_th.textContent = q.th;

        let textVal = '';
        if (currentStep === 0) textVal = dataMap.trigger;
        else if (currentStep === 1) textVal = dataMap.reaction;
        else if (currentStep === 2) textVal = dataMap.reflection;

        if (entryTextarea) {
            entryTextarea.value = textVal;
        }

        if (prevStepBtn) prevStepBtn.disabled = (currentStep === 0);
        
        const maxStep = reflectionRecord ? 2 : 1;
        if (nextStepBtn) nextStepBtn.disabled = (currentStep >= maxStep);
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

    if (backBtn) {
        backBtn.onclick = () => window.location.href = './history.html';
    }

    loadData();
});