// aliasname.js
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const aliasForm = document.getElementById('aliasForm');
const aliasInput = document.getElementById('aliasInput');
const clearBtn = document.getElementById('clearBtn');
const charCounter = document.getElementById('charCounter');
const submitBtn = document.getElementById('submitBtn');

let currentUser = null;

// 1. ตรวจสอบว่าผู้ใช้มี Session การเข้าสู่ระบบหรือไม่
async function checkAuthSession() {
    const { data: { user }, error } = await supabaseClient.auth.getUser();

    if (error || !user) {
        alert('❌ ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบก่อนดำเนินการต่อ');
        window.location.href = 'login.html';
        return;
    }

    currentUser = user;
}

// ดึงชื่อเดิมจาก localStorage มาใส่ใน Input (ถ้ามี)
function loadSavedAlias() {
    const savedAlias = localStorage.getItem('userAlias');
    if (savedAlias && aliasInput) {
        aliasInput.value = savedAlias;
        updateInputStatus();
    }
}

checkAuthSession();

document.addEventListener('DOMContentLoaded', () => {
    loadSavedAlias();
});

// 2. ฟังก์ชันอัปเดตสถานะของ ปุ่ม (X) และ ตัวนับจำนวนอักขระ
function updateInputStatus() {
    if (!aliasInput) return;
    
    const currentLength = aliasInput.value.length;

    if (currentLength > 0) {
        if (charCounter) {
            charCounter.textContent = `${currentLength}/20`;
            charCounter.classList.remove('hidden');
        }
        if (clearBtn) clearBtn.classList.remove('hidden');
    } else {
        if (charCounter) charCounter.classList.add('hidden');
        if (clearBtn) clearBtn.classList.add('hidden');
    }
}

if (aliasInput) {
    aliasInput.addEventListener('input', updateInputStatus);
    aliasInput.addEventListener('keyup', updateInputStatus);
}

// 3. ปุ่มล้างข้อความ (X)
if (clearBtn) {
    clearBtn.addEventListener('click', () => {
        if (aliasInput) {
            aliasInput.value = '';
            aliasInput.focus();
            updateInputStatus();
        }
    });
}

// 4. บันทึกข้อมูล Nickname ลง Supabase และ localStorage
if (aliasForm) {
    aliasForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const aliasName = aliasInput ? aliasInput.value.trim() : '';

        if (!aliasName) {
            alert('❌ กรุณากรอกชื่อนามแฝงของคุณด้วยครับ');
            return;
        }

        if (!currentUser) {
            alert('❌ กรุณาเข้าสู่ระบบก่อนดำเนินการต่อ');
            window.location.href = 'login.html';
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังบันทึก...';
        }

        try {
            // 💡 [เพิ่มจุดนี้] บันทึกลง localStorage ทันที เพื่อให้หน้า gender.html นำไปแสดงผลได้เลย
            localStorage.setItem('userAlias', aliasName);

            // อัปเดตคอลัมน์ nickname ในตาราง users
            const { error } = await supabaseClient
                .from('users')
                .update({ nickname: aliasName })
                .eq('user_id', currentUser.id);

            if (error) throw error;

            // บันทึกสำเร็จ เปลี่ยนหน้าไปเลือกเพศ (gender.html)
            window.location.href = 'gender.html';

        } catch (error) {
            console.error('Update Nickname Error:', error.message);
            alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Next';
            }
        }
    });
}