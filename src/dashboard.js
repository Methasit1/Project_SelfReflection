// dashboard.js

// 1. ตั้งค่า Supabase Client
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // 2. อ้างอิง Element จาก HTML
    // ----------------------------------------------------
    const userAlias = document.getElementById('userAlias');
    const userAvatar = document.getElementById('userAvatar');
    const startBtn = document.getElementById('startBtn');
    const historyBtn = document.getElementById('historyBtn');

    // ----------------------------------------------------
    // 3. ดึงข้อมูลผู้ใช้จาก Supabase
    // ----------------------------------------------------
    async function fetchUserData() {
        try {
            // ตรวจสอบการ Login
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                console.warn('ผู้ใช้ยังไม่ได้เข้าสู่ระบบ');
                return;
            }

            // ดึง alias_name และ avatar_url จากตาราง User
            const { data: userData, error: dbError } = await supabaseClient
                .from('User')
                .select('alias_name, avatar_url')
                .eq('email', user.email)
                .maybeSingle();

            if (dbError) {
                console.error('Error fetching user data:', dbError.message);
                return;
            }

            if (userData) {
                // อัปเดตนามแฝง
                if (userAlias && userData.alias_name) {
                    userAlias.textContent = userData.alias_name;
                }
                // อัปเดตรูปโปรไฟล์
                if (userAvatar && userData.avatar_url) {
                    userAvatar.src = userData.avatar_url;
                }
            }
        } catch (err) {
            console.error('Unexpected error:', err);
        }
    }

    // ----------------------------------------------------
    // 4. Event Listeners ปุ่มกดต่างๆ
    // ----------------------------------------------------

    // ปุ่ม Start -> ไปหน้าบันทึกอารมณ์
    if (startBtn) {
        startBtn.addEventListener('click', () => {
            window.location.href = './selectmood.html'; // เปลี่ยนเป็นชื่อไฟล์หน้าถัดไปของคุณ
        });
    }

    // ปุ่ม History of Emotions -> ไปหน้าประวัติ
    if (historyBtn) {
        historyBtn.addEventListener('click', () => {
            window.location.href = './history.html';
        });
    }

    // เรียกทำงานฟังก์ชันดึงข้อมูลผู้ใช้
    fetchUserData();
});