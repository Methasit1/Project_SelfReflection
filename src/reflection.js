// reflection.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function getTodayDate() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // Element References
    // ----------------------------------------------------
    const userAlias = document.getElementById('userAlias');
    const questionEn = document.getElementById('question_en');
    const questionTh = document.getElementById('question_th');
    const finishBtn = document.getElementById('finishBtn');
    const reflectionInput = document.getElementById('reactionInput'); // ใช้ id reactionInput จาก HTML
    const charCounter = document.getElementById('charCounter');

    const MAX_CHARS = 200;
    let currentUser = null;
    let currentQuestion = null; // เก็บข้อมูลคำถามที่สุ่มได้

    // ----------------------------------------------------
    // 1. ตรวจสอบการเข้าสู่ระบบ & ดึงข้อมูลผู้ใช้
    // ----------------------------------------------------
    async function checkAuthAndFetchUser() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            currentUser = user;

            // แสดง Alias จาก LocalStorage เพื่อความเร็ว
            const cachedAlias = localStorage.getItem('userAlias');
            if (cachedAlias && userAlias) userAlias.textContent = cachedAlias;

            // ดึงข้อมูลผู้ใช้จากตาราง users
            const { data: userData } = await supabaseClient
                .from('users')
                .select('nickname')
                .eq('user_id', user.id)
                .maybeSingle();

            if (userData?.nickname) {
                if (userAlias) userAlias.textContent = userData.nickname;
                localStorage.setItem('userAlias', userData.nickname);
            }

            // เมื่อยืนยันตัวตนสำเร็จ ให้ทำการสุ่มคำถาม
            await getRandomQuestion();

        } catch (err) {
            console.error('Error in checkAuthAndFetchUser:', err);
        }
    }

    // ----------------------------------------------------
    // 2. เรียกใช้ Database Function สุ่มคำถามจิตวิทยา (PBI-007 / BR-03)
    // ----------------------------------------------------
    async function getRandomQuestion() {
        try {
            const emotionLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);

            // เรียกใช้ RPC Function: get_random_reflection_question
            const { data, error } = await supabaseClient.rpc('get_random_reflection_question', {
                p_user_id: currentUser.id,
                p_emotion_level: emotionLevel
            });

            if (error) throw error;

            if (data && data.length > 0) {
                currentQuestion = data[0];
                
                // แสดงคำถามบนหน้าจอ
                if (questionEn) questionEn.textContent = currentQuestion.question_text_en || 'Reflect on your day';
                if (questionTh) questionTh.textContent = currentQuestion.question_text || 'ถอดบทเรียนจากเหตุการณ์ในวันนี้';
            } else {
                // Fallback กรณีไม่มีคำถามส่งกลับมา
                if (questionEn) questionEn.textContent = 'What did today teach you about yourself?';
                if (questionTh) questionTh.textContent = 'บทเรียนสำคัญที่คุณได้เรียนรู้จากวันนี้คืออะไร?';
            }
        } catch (err) {
            console.error('Error fetching random question:', err.message);
            if (questionEn) questionEn.textContent = 'What did today teach you about yourself?';
            if (questionTh) questionTh.textContent = 'บทเรียนสำคัญที่คุณได้เรียนรู้จากวันนี้คืออะไร?';
        }
    }

    // ----------------------------------------------------
    // 3. ตรวจจับการพิมพ์ข้อความใน Textarea
    // ----------------------------------------------------
    if (reflectionInput) {
        reflectionInput.addEventListener('input', () => {
            const textLength = reflectionInput.value.length;
            if (charCounter) charCounter.textContent = `${textLength}/${MAX_CHARS}`;

            if (textLength > 0) {
                finishBtn.disabled = false;
                finishBtn.classList.remove('opacity-40', 'cursor-not-allowed');
                finishBtn.classList.add('opacity-100', 'cursor-pointer');
            } else {
                finishBtn.disabled = true;
                finishBtn.classList.add('opacity-40', 'cursor-not-allowed');
                finishBtn.classList.remove('opacity-100', 'cursor-pointer');
            }
        });
    }

    // ----------------------------------------------------
    // 4. บันทึกข้อมูล Step 4 ผ่าน Stored Procedure (save_complete_reflection)
    // ----------------------------------------------------
    if (finishBtn) {
        finishBtn.addEventListener('click', async () => {
            const reflectionText = reflectionInput.value.trim();
            if (!reflectionText || !currentUser) return;

            finishBtn.disabled = true;
            finishBtn.textContent = 'Saving...';

            try {
                const today = getTodayDate();
                const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);
                const triggerText = sessionStorage.getItem('trigger_text') || '';
                const reactionText = sessionStorage.getItem('reaction_text') || '';

                const questionId = currentQuestion?.question_id || null;
                const questionSnapshot = currentQuestion?.question_text || 'คำถามสะท้อนคิดประจำวัน';

                // เรียกใช้ Stored Procedure: save_complete_reflection
                const { error } = await supabaseClient.rpc('save_complete_reflection', {
                    p_user_id: currentUser.id,
                    p_entry_date: today,
                    p_emotion_level: moodLevel,
                    p_trigger_text: triggerText,
                    p_reaction_text: reactionText,
                    p_question_id: questionId,
                    p_question_snapshot: questionSnapshot,
                    p_reflection_text: reflectionText
                });

                if (error) throw error;

                // เมื่อสำเร็จ บันทึกสถานะว่าทำ Step 4 แล้ว เคลียร์ร่างชั่วคราว
                sessionStorage.setItem('reflection_text', reflectionText);

                // ย้ายไปหน้าสรุปสุดท้าย
                window.location.href = './final-summary.html';

            } catch (err) {
                console.error('Error saving reflection:', err.message);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + err.message);
                finishBtn.disabled = false;
                finishBtn.textContent = 'Finish';
            }
        });
    }

    checkAuthAndFetchUser();
});