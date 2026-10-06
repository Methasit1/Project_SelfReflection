// profile.js

const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // 1. อ้างอิง Element ต่างๆ จาก HTML ID
    // ----------------------------------------------------
    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const avatarImg = document.getElementById('avatarImg');
    const userAlias = document.getElementById('userAlias');
    const emailText = document.getElementById('emailText');
    const genderText = document.getElementById('genderText');
    const hobbyText = document.getElementById('hobbyText');
    const totalMood = document.getElementById('totalMood');
    const monthlyCount = document.getElementById('monthlyCount');

    // ----------------------------------------------------
    // 2. Event Listeners
    // ----------------------------------------------------

    // ปุ่มย้อนกลับ
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // ปุ่มออกจากระบบ
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
    // 3. ฟังก์ชันดึงและแสดงผลข้อมูลผู้ใช้จาก Supabase
    // ----------------------------------------------------
    async function loadUserProfile() {
        try {
            // 3.1 ตรวจสอบสิทธิ์การเข้าสู่ระบบ
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert('กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            // แสดงอีเมลจาก Supabase Auth
            if (emailText) emailText.textContent = user.email;

            // 3.2 ดึงข้อมูลส่วนตัวจากตาราง 'users' โดยใช้ user_id
            const { data: userData, error: dbError } = await supabaseClient
                .from('users')
                .select('nickname, gender, hobbies')
                .eq('user_id', user.id)
                .maybeSingle();

            if (dbError) {
                console.error('Error fetching user details:', dbError.message);
            }

            if (userData) {
                if (userAlias) userAlias.textContent = userData.nickname || 'ไม่ได้ตั้งชื่อนามแฝง';
                if (genderText) genderText.textContent = userData.gender || 'ไม่ระบุ';
                if (hobbyText) hobbyText.textContent = userData.hobbies || 'ไม่มี';
            }

            // 3.3 ดึงสถิติจำนวน Mood จากตาราง 'daily_entries'
            await loadMoodStats(user.id);

        } catch (err) {
            console.error('Unexpected error loading profile:', err);
        }
    }

    // ----------------------------------------------------
    // 4. ฟังก์ชันนับจำนวนการบันทึก Mood ทั้งหมด และประจำเดือน
    // ----------------------------------------------------
    async function loadMoodStats(userId) {
        try {
            // นับจำนวน Mood ทั้งหมดจาก daily_entries
            const { count: totalCount, error: totalError } = await supabaseClient
                .from('daily_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId);

            if (!totalError && totalCount !== null) {
                if (totalMood) totalMood.textContent = totalCount;
            } else {
                if (totalMood) totalMood.textContent = '0';
            }

            // คำนวณวันแรกของเดือน และจำนวนวันทั้งหมดในเดือนปัจจุบัน
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            
            // Format วันแรกของเดือน YYYY-MM-01
            const firstDayOfMonth = new Date(year, month, 1).toISOString().split('T')[0];
            const lastDayOfCurrentMonth = new Date(year, month + 1, 0).getDate();

            // นับจำนวนวันที่บันทึกในเดือนนี้
            const { count: monthCount, error: monthError } = await supabaseClient
                .from('daily_entries')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', userId)
                .gte('entry_date', firstDayOfMonth);

            if (!monthError && monthCount !== null) {
                if (monthlyCount) monthlyCount.textContent = `${monthCount}/${lastDayOfCurrentMonth}`;
            } else {
                if (monthlyCount) monthlyCount.textContent = `0/${lastDayOfCurrentMonth}`;
            }

        } catch (err) {
            console.error('Error loading mood stats:', err);
            if (totalMood) totalMood.textContent = '0';
            if (monthlyCount) monthlyCount.textContent = '0/30';
        }
    }

    // เริ่มทำงานเมื่อโหลดหน้าเว็บ
    loadUserProfile();
});