// 1. ตั้งค่าการเชื่อมต่อ Supabase
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. ดึงอีเมลที่บันทึกไว้ชั่วคราวจากหน้าลงทะเบียน
const userEmail = localStorage.getItem('userEmail');

// 🛡️ ป้องกันการเข้าหน้านี้โดยตรงหากยังไม่ได้ลงทะเบียน
if (!userEmail) {
    alert('❌ ไม่พบข้อมูลการลงทะเบียน กรุณาลงทะเบียนก่อนครับ');
    window.location.href = 'register.html';
}

const aliasForm = document.getElementById('aliasForm');
const aliasInput = document.getElementById('aliasname');
const clearBtn = document.getElementById('clearBtn');
const charCounter = document.getElementById('charCounter');

// ตรวจจับการพิมพ์ข้อความ
aliasInput.addEventListener('input', () => {
    const currentLength = aliasInput.value.length;

    if (currentLength > 0) {
        // 1. อัปเดตตัวเลข และแสดงตัวนับ
        charCounter.textContent = `${currentLength}/20`;
        charCounter.classList.remove('hidden');

        // 2. แสดงปุ่มล้างข้อความ (X)
        clearBtn.classList.remove('hidden');
    } else {
        // 3. ซ่อนตัวนับและปุ่ม X เมื่อช่องพิมพ์ว่างเปล่า
        charCounter.classList.add('hidden');
        clearBtn.classList.add('hidden');
    }
});

// กดปุ่ม X เพื่อล้างข้อความ
clearBtn.addEventListener('click', () => {
    aliasInput.value = '';
    charCounter.classList.add('hidden');
    clearBtn.classList.add('hidden');
    aliasInput.focus();
});

// ส่งข้อมูลลง Supabase เมื่อกดปุ่ม Next
aliasForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const aliasName = aliasInput.value.trim();

    if (aliasName === "") {
        alert('❌ กรุณากรอกชื่อนามแฝงของคุณด้วยครับ');
        return;
    }

    try {
        // อัปเดต alias_name ลงตาราง User โดยใช้อีเมลเป็นตัวอ้างอิง
        const { data, error } = await supabaseClient
            .from('User')
            .update({ alias_name: aliasName })
            .eq('email', userEmail);

        if (error) throw error;

        alert('✅ บันทึกนามแฝงเรียบร้อยแล้ว!');

        // เปลี่ยนไปยังหน้าถัดไป (เช่น หน้าหลัก หรือหน้าถัดไปในโฟลว์)
        window.location.href = 'nextpage.html'; 

    } catch (error) {
        console.error('Update Error:', error.message);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    }
});