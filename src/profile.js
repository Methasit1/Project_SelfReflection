// profile.js

// 1. ตั้งค่า Supabase Client
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // 2. อ้างอิง Element ต่างๆ จาก HTML ID
    // ----------------------------------------------------
    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const avatarImg = document.getElementById('avatarImg');
    const totalMoodImg = document.getElementById('totalMoodImg');
    
    const userAlias = document.getElementById('userAlias');
    const emailText = document.getElementById('emailText');
    const genderText = document.getElementById('genderText');
    const hobbyText = document.getElementById('hobbyText');
    const totalMood = document.getElementById('totalMood');
    const monthlyCount = document.getElementById('monthlyCount');

    // ----------------------------------------------------
    // 3. Event Listeners (การกดปุ่ม)
    // ----------------------------------------------------

    // ปุ่มย้อนกลับ
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // ปุ่มออกจากระบบ (Sign Out จาก Supabase Auth)
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            const confirmLogout = confirm('คุณต้องการออกจากระบบใช่หรือไม่?');
            if (confirmLogout) {
                try {
                    const { error } = await supabaseClient.auth.signOut();
                    if (error) throw error;

                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = './login.html';
                } catch (error) {
                    console.error('Error logging out:', error.message);
                    alert('เกิดข้อผิดพลาดในการออกจากระบบ: ' + error.message);
                }
            }
        });
    }

    // ----------------------------------------------------
    // 4. ฟังก์ชันดึงและแสดงผลข้อมูลผู้ใช้จาก Supabase
    // ----------------------------------------------------
    async function loadUserProfile() {
        try {
            // 4.1 ตรวจสอบว่าผู้ใช้ Login อยู่หรือไม่
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            // แสดงอีเมลจาก Supabase Auth
            if (emailText) emailText.textContent = user.email;

            // 4.2 ดึงข้อมูลเพิ่มเติมจากตาราง 'User'
            const { data: userData, error: dbError } = await supabaseClient
                .from('User')
                .select('*')
                .eq('email', user.email)
                .maybeSingle();

            if (dbError) {
                console.error('Error fetching user details:', dbError.message);
            }

            if (userData) {
                // แก้ไขเป็น userData.alias_name ให้ตรงกับชื่อคอลัมน์ใน Supabase
                if (userAlias) {
                    userAlias.textContent = userData.alias_name || 'ไม่ได้ตั้งชื่อนามแฝง';
                }
                if (genderText) genderText.textContent = userData.gender || 'ไม่ระบุ';
                if (hobbyText) hobbyText.textContent = userData.hobby || 'ไม่มี';
                if (avatarImg && userData.avatar_url) avatarImg.src = userData.avatar_url;
            }

            // 4.3 ดึงสถิติจำนวน Mood จากตารางบันทึกอารมณ์
            await loadMoodStats(user.email);

        } catch (err) {
            console.error('Unexpected error loading profile:', err);
        }
    }

    // ----------------------------------------------------
    // 5. ฟังก์ชันนับจำนวนการบันทึก Mood ทั้งหมด และประจำเดือน
    // ----------------------------------------------------
    async function loadMoodStats(userEmail) {
        try {
            // นับจำนวน Mood ทั้งหมด
            const { count: totalCount, error: totalError } = await supabaseClient
                .from('MoodLog')
                .select('*', { count: 'exact', head: true })
                .eq('email', userEmail);

            if (!totalError && totalCount !== null) {
                if (totalMood) totalMood.textContent = totalCount;
            } else {
                if (totalMood) totalMood.textContent = '0';
            }

            // คำนวณวันแรกและจำนวนวันของเดือนปัจจุบัน
            const now = new Date();
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
            const lastDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

            // นับจำนวนวันที่บันทึกในเดือนนี้
            const { count: monthCount, error: monthError } = await supabaseClient
                .from('MoodLog')
                .select('*', { count: 'exact', head: true })
                .eq('email', userEmail)
                .gte('created_at', firstDayOfMonth);

            if (!monthError && monthCount !== null) {
                if (monthlyCount) monthlyCount.textContent = `${monthCount}/${lastDayOfCurrentMonth}`;
            } else {
                if (monthlyCount) monthlyCount.textContent = `0/${lastDayOfCurrentMonth}`;
            }

        } catch (err) {
            console.warn('Mood stats table not ready or error:', err.message);
            if (totalMood) totalMood.textContent = '0';
            if (monthlyCount) monthlyCount.textContent = '0/30';
        }
    }

    // เรียกทำงานเมื่อเปิดหน้าเว็บ
    loadUserProfile();
});