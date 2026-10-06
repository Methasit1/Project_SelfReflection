// welcome.js
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 1. ตรวจสอบ Auth Session และดึงชื่อผู้ใช้มาแสดง
async function initWelcomePage() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) {
            alert('❌ ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนดำเนินการต่อ');
            window.location.href = 'login.html';
            return;
        }

        const aliasElem = document.getElementById('userAlias');
        let userAlias = localStorage.getItem('userAlias');

        if (userAlias && aliasElem) {
            aliasElem.textContent = userAlias;
            aliasElem.title = userAlias;
        } else if (aliasElem) {
            // หากใน localStorage ไม่มี ให้ดึงจากตาราง users ใน Supabase DB
            const { data } = await supabaseClient
                .from('users')
                .select('nickname')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data && data.nickname) {
                aliasElem.textContent = data.nickname;
                aliasElem.title = data.nickname;
                localStorage.setItem('userAlias', data.nickname);
            }
        }
    } catch (err) {
        console.error('Welcome Page Init Error:', err);
    }
}

// 2. ปุ่มกดเริ่มใช้งาน (เปลี่ยนหน้าไป Dashboard)
const startBtn = document.getElementById('startBtn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}

// เริ่มทำงานเมื่อโหลด DOM
document.addEventListener('DOMContentLoaded', () => {
    initWelcomePage();
});