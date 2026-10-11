// reflection.js
const supabaseClient = window.supabaseClient;

function clearDraftStorage() {
    sessionStorage.removeItem('selected_mood_level');
    sessionStorage.removeItem('record_type');
    sessionStorage.removeItem('trigger_text');
    sessionStorage.removeItem('reaction_text');
    sessionStorage.removeItem('draft_timestamp');
}

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
    // 🟢 บันทึกข้อมูล Reflection เป็นค่าว่างเปล่าอัตโนมัติ แล้วข้ามไป final-summary.html ทันที
    async function autoSaveBlankReflectionAndProceed() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            const entryDate = getEntryDate();
            const moodLevel = parseInt(sessionStorage.getItem('selected_mood_level') || '3', 10);
            const triggerText = sessionStorage.getItem('trigger_text') || '';
            const reactionText = sessionStorage.getItem('reaction_text') || '';

            // ดึงสแนปช็อตคำถามประจำอารมณ์
            let questionId = null;
            let questionSnapshot = 'การสะท้อนความคิดเพิ่มเติม';

            try {
                const { data } = await supabaseClient.rpc('get_random_reflection_question', {
                    p_user_id: user.id,
                    p_emotion_level: moodLevel
                });

                if (data && data.length > 0) {
                    questionId = data[0].question_id;
                    questionSnapshot = data[0].question_text || questionSnapshot;
                }
            } catch (qErr) {
                console.warn('Could not fetch reflection question snapshot:', qErr);
            }

            // บันทึกรายการลง DB พร้อมค่า Reflection ว่างเปล่า
            if (questionId) {
                await supabaseClient.rpc('run_save_complete_reflection', {
                    p_user_id: user.id,
                    p_entry_date: entryDate,
                    p_emotion_level: moodLevel,
                    p_trigger_text: triggerText,
                    p_reaction_text: reactionText,
                    p_question_id: questionId,
                    p_question_snapshot: questionSnapshot,
                    p_reflection_text: '' // 🟢 บันทึกข้อความเปล่า
                });
            }

            // ล้างข้อมูล Session
            clearDraftStorage();

            // ย้ายหน้าไปยัง final-summary.html ทันที
            window.location.href = './final-summary.html';

        } catch (err) {
            console.error('Error auto-saving blank reflection:', err);
            clearDraftStorage();
            window.location.href = './final-summary.html';
        }
    }

    autoSaveBlankReflectionAndProceed();
});