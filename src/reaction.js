// reaction.js

// 1. ตั้งค่า Supabase Client
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // 2. Element References
    // ----------------------------------------------------
    const userAlias = document.getElementById('userAlias');
    const userAvatar = document.getElementById('userAvatar');
    const finishBtn = document.getElementById('finishBtn');
    const reactionInput = document.getElementById('reactionInput');
    const charCounter = document.getElementById('charCounter');

    const MAX_CHARS = 200;

    // ----------------------------------------------------
    // 3. ดึงข้อมูลผู้ใช้จาก Supabase
    // ----------------------------------------------------
    async function fetchUserData() {
        try {
            const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

            if (sessionError || !sessionData?.session) {
                console.warn('ไม่พบ Session หรือผู้ใช้ยังไม่ได้เข้าสู่ระบบ');
                return;
            }

            const user = sessionData.session.user;
            if (!user || !user.email) return;

            const { data: userData, error: dbError } = await supabaseClient
                .from('User')
                .select('alias_name, avatar_url')
                .eq('email', user.email)
                .maybeSingle();

            if (dbError) {
                console.error('Error fetching user profile:', dbError.message);
                return;
            }

            if (userData) {
                if (userAlias && userData.alias_name) {
                    userAlias.textContent = userData.alias_name;
                }
                if (userAvatar && userData.avatar_url) {
                    userAvatar.src = userData.avatar_url;
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    // ----------------------------------------------------
    // 4. ตรวจจับการพิมพ์ใน Textarea (สูงสุด 200 ตัวอักษร)
    // ----------------------------------------------------
    if (reactionInput) {
        reactionInput.addEventListener('input', () => {
            const textLength = reactionInput.value.length;
            
            // อัปเดตตัวนับตัวอักษร
            if (charCounter) {
                charCounter.textContent = `${textLength}/${MAX_CHARS}`;
            }

            // เปิดใช้งานปุ่มเมื่อพิมพ์อย่างน้อย 1 ตัวอักษร
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
    // 5. Navigation Event
    // ----------------------------------------------------
    if (finishBtn) {
        finishBtn.addEventListener('click', () => {
            const reactionText = reactionInput.value.trim();
            if (!reactionText) return;

            // บันทึก reaction_text ลง SessionStorage
            sessionStorage.setItem('reaction_text', reactionText);

            // ย้ายไปหน้าถัดไป (reflection.html)
            window.location.href = './summary.html';
        });
    }

    // เรียกทำงานฟังก์ชันดึงโปรไฟล์
    fetchUserData();
});