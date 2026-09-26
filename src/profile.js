// profile.js

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. อ้างอิง Element ต่างๆ จาก HTML ID
    // ----------------------------------------------------
    const backBtn = document.getElementById('backBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // แยก Element รูปภาพโปรไฟล์หลัก และ รูป Mood ในกล่องสถิติ
    const avatarImg = document.getElementById('avatarImg');         // รูป Profile
    const totalMoodImg = document.getElementById('totalMoodImg');   // รูป Mood ใน MoodLog
    
    const userAlias = document.getElementById('userAlias');
    const emailText = document.getElementById('emailText');
    const genderText = document.getElementById('genderText');
    const hobbyText = document.getElementById('hobbyText');
    const totalMood = document.getElementById('totalMood');
    const monthlyCount = document.getElementById('monthlyCount');

    // ----------------------------------------------------
    // 2. Event Listeners (การกดปุ่ม)
    // ----------------------------------------------------

    // ปุ่มย้อนกลับ
    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    // ปุ่มออกจากระบบ
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            const confirmLogout = confirm('คุณต้องการออกจากระบบใช่หรือไม่?');
            if (confirmLogout) {
                try {
                    localStorage.clear();
                    sessionStorage.clear();
                    window.location.href = './login.html';
                } catch (error) {
                    console.error('Error logging out:', error);
                }
            }
        });
    }

    // ----------------------------------------------------
    // 3. ฟังก์ชันโหลดและแสดงผลข้อมูลโปรไฟล์ (Mock Data / Dynamic Data)
    // ----------------------------------------------------
    function loadUserProfile() {
        // โครงสร้างข้อมูล (แยกรูปโปรไฟล์ และ รูป Mood ออกจากกัน)
        const userData = {
            alias: "Mo",
            email: "moooooooooood@gmail.com",
            gender: "ชาย",
            hobby: "ร้องเพลง เต้น ทำงาน",
            avatarUrl: "./image/avatar.png",       // Path รูปโปรไฟล์ผู้ใช้
            totalMoodImgUrl: "./image/mood03.png", // Path รูปไอคอน Mood ในกล่อง MoodLog
            totalMoodLogs: 365,
            monthlyLogs: "2/30"
        };

        // Render ข้อมูลข้อความลงหน้าเว็บ
        if (userAlias) userAlias.textContent = userData.alias;
        if (emailText) emailText.textContent = userData.email;
        if (genderText) genderText.textContent = userData.gender;
        if (hobbyText) hobbyText.textContent = userData.hobby;
        if (totalMood) totalMood.textContent = userData.totalMoodLogs;
        if (monthlyCount) monthlyCount.textContent = userData.monthlyLogs;

        // เปลี่ยนรูปภาพแยกกันตาม ID
        if (avatarImg && userData.avatarUrl) {
            avatarImg.src = userData.avatarUrl;
        }
        if (totalMoodImg && userData.totalMoodImgUrl) {
            totalMoodImg.src = userData.totalMoodImgUrl;
        }
    }

    // เรียกใช้งานฟังก์ชันโหลดข้อมูลเมื่อหน้าเว็บพร้อม
    loadUserProfile();
});