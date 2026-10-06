// hobby.js
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const hobbyInput = document.getElementById('hobby');
const clearBtn = document.getElementById('clearBtn');
const charCounter = document.getElementById('charCounter');
const hobbyForm = document.getElementById('hobbyForm');
const backBtn = document.getElementById('backBtn');
const submitBtn = document.getElementById('submitbtn');

let currentUser = null;

// 1. ตรวจสอบ Auth Session และดึงชื่อ
async function initHobbyPage() {
    try {
        const { data: { user }, error } = await supabaseClient.auth.getUser();

        if (error || !user) {
            alert('❌ ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนดำเนินการต่อ');
            window.location.href = 'login.html';
            return;
        }

        currentUser = user;

        // แสดงชื่อผู้ใช้ (จาก localStorage หรือดึงจาก DB)
        const userAlias = localStorage.getItem('userAlias');
        const aliasElement = document.getElementById('userAlias');

        if (userAlias && aliasElement) {
            aliasElement.textContent = userAlias;
        } else if (aliasElement) {
            const { data } = await supabaseClient
                .from('users')
                .select('nickname')
                .eq('user_id', user.id)
                .maybeSingle();

            if (data && data.nickname) {
                aliasElement.textContent = data.nickname;
                localStorage.setItem('userAlias', data.nickname);
            }
        }
    } catch (err) {
        console.error('Init Hobby Page Error:', err);
    }
}

// 2. ปุ่มย้อนกลับ
if (backBtn) {
    backBtn.addEventListener('click', () => {
        window.history.back();
    });
}

// 3. จัดการระบบ Input (ปุ่ม X และ ตัวนับตัวอักษร)
if (hobbyInput) {
    hobbyInput.addEventListener('input', () => {
        const length = hobbyInput.value.length;
        
        if (length > 0) {
            if (clearBtn) clearBtn.classList.remove('hidden');
            if (charCounter) {
                charCounter.classList.remove('hidden');
                charCounter.textContent = `${length}/30`;
            }
        } else {
            if (clearBtn) clearBtn.classList.add('hidden');
            if (charCounter) charCounter.classList.add('hidden');
        }
    });
}

if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (hobbyInput) {
            hobbyInput.value = '';
            if (clearBtn) clearBtn.classList.add('hidden');
            if (charCounter) charCounter.classList.add('hidden');
            hobbyInput.focus();
        }
    });
}

// 4. บันทึกข้อมูลเข้า Supabase (ตาราง users คอลัมน์ hobbies)
if (hobbyForm) {
    hobbyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const hobbyValue = hobbyInput ? hobbyInput.value.trim() : '';

        if (!hobbyValue) {
            alert('❌ กรุณากรอกงานอดิเรกของคุณด้วยครับ');
            return;
        }

        if (!currentUser) {
            alert('❌ ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
            window.location.href = 'login.html';
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังบันทึก...';
        }

        try {
            // อัปเดตคอลัมน์ hobbies ในตาราง users โดยใช้ user_id ของ Logged-in User
            const { error } = await supabaseClient
                .from('users')
                .update({ hobbies: hobbyValue }) // คอลัมน์คือ hobbies (ตาม database.sql)
                .eq('user_id', currentUser.id);

            if (error) throw error;

            localStorage.setItem('userHobby', hobbyValue);
            window.location.href = 'welcome.html';

        } catch (error) {
            console.error('Update Hobby Error:', error.message);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Next';
            }
        }
    });
}

// เริ่มการทำงานเมื่อโหลดหน้า
document.addEventListener('DOMContentLoaded', () => {
    initHobbyPage();
});