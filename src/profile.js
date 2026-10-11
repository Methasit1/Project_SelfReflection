// profile.js
const supabaseClient = window.supabaseClient;

document.addEventListener('DOMContentLoaded', async () => {
    // ----------------------------------------------------
    // 1. อ้างอิง Element ต่างๆ จาก HTML ID
    // ----------------------------------------------------
    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const historyBtn = document.getElementById('historyBtn');

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

    // ปุ่ม History of Emotions -> ไปหน้าประวัติการบันทึกอารมณ์ (history.html)
    if (historyBtn) {
        historyBtn.style.cursor = 'pointer';
        historyBtn.classList.add('hover:opacity-80', 'transition-all', 'active:scale-95');
        historyBtn.addEventListener('click', () => {
            window.location.href = './history.html';
        });
    }

    // ปุ่ม Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('คุณต้องการออกจากระบบหรือไม่?')) {
                try {
                    await supabaseClient.auth.signOut();
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = './login.html';
                } catch (err) {
                    console.error('Error logging out:', err);
                    alert('เกิดข้อผิดพลาดในการออกจากระบบ');
                }
            }
        });
    }

    // ----------------------------------------------------
    // 3. ดึงข้อมูล User & สถิติอารมณ์จาก Supabase
    // ----------------------------------------------------
    async function loadUserProfile() {
        try {
            const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

            if (authError || !user) {
                alert('❌ กรุณาเข้าสู่ระบบก่อนใช้งาน');
                window.location.href = './login.html';
                return;
            }

            // แสดง Email
            if (emailText) emailText.textContent = user.email || '-';

            // ดึงข้อมูลจากตาราง users
            const { data: userData, error: dbError } = await supabaseClient
                .from('users')
                .select('nickname, gender, hobbies')
                .eq('user_id', user.id)
                .maybeSingle();

            if (!dbError && userData) {
                if (userAlias) userAlias.textContent = userData.nickname || 'Alias';
                if (genderText) genderText.textContent = userData.gender || '-';
                if (hobbyText) hobbyText.textContent = userData.hobbies || '-';

                // เซฟลง localStorage สำรอง
                if (userData.nickname) localStorage.setItem('userAlias', userData.nickname);
                if (userData.gender) localStorage.setItem('userGender', userData.gender);
                if (userData.hobbies) localStorage.setItem('userHobby', userData.hobbies);
            } else {
                // ดึงจาก localStorage สำรองหาก DB มีปัญหา
                if (userAlias) userAlias.textContent = localStorage.getItem('userAlias') || 'Alias';
                if (genderText) genderText.textContent = localStorage.getItem('userGender') || '-';
                if (hobbyText) hobbyText.textContent = localStorage.getItem('userHobby') || '-';
            }

            // โหลดสถิติการบันทึกอารมณ์
            await loadMoodStats(user.id);

        } catch (err) {
            console.error('Error loading profile:', err);
        }
    }

    async function loadMoodStats(userId) {
        try {
            // นับจำนวนอารมณ์ทั้งหมดที่เคยบันทึก
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
            
            // 🟢 กำหนดรูปแบบวันที่เป็น YYYY-MM-01 โดยตรงเพื่อป้องกันปัญหาโซนเวลา UTC
            const firstDayOfMonth = `${year}-${String(month + 1).padStart(2, '0')}-01`;
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

    loadUserProfile();
});