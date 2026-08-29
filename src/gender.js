// 1. ตั้งค่า Supabase
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. ดึงข้อมูลผู้ใช้จาก localStorage
const userEmail = localStorage.getItem('userEmail');
const userAlias = localStorage.getItem('userAlias');

// ป้องกันกรณีเข้าหน้านี้โดยไม่ได้ผ่านขั้นตอนก่อนหน้า
if (!userEmail) {
    alert('❌ ไม่พบข้อมูลการลงทะเบียน กรุณาเริ่มต้นใหม่');
    window.location.href = 'register.html';
}

// แสดงชื่อ Alias ที่ดึงมาจากขั้นตอนก่อนหน้า
if (userAlias) {
    document.getElementById('userAlias').textContent = userAlias;
}

// 3. จัดการระบบเลือกเพศ
let selectedGender = null;
const genderButtons = document.querySelectorAll('.gender-btn');
const submitBtn = document.getElementById('submitbtn');

genderButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
        // ล้างสไตล์การเลือกของปุ่มทั้งหมดก่อน
        genderButtons.forEach((b) => {
            b.classList.remove('border-black', 'scale-105');
            b.classList.add('border-transparent');
        });

        // เน้นปุ่มที่ถูกเลือกด้วยขอบสีดำและขยายขนาดเล็กน้อย
        btn.classList.remove('border-transparent');
        btn.classList.add('border-black', 'scale-105');

        // บันทึกค่าเพศที่เลือกไว้ในตัวแปร
        selectedGender = btn.getAttribute('data-gender');
    });
});

// 4. บันทึกข้อมูลลง Supabase เมื่อกด Next
submitBtn.addEventListener('click', async () => {
    if (!selectedGender) {
        alert('❌ กรุณาเลือกเพศของคุณก่อนดำเนินการต่อครับ');
        return;
    }

    try {
        // อัปเดตเพศลงฐานข้อมูล Supabase
        const { error } = await supabaseClient
            .from('User')
            .update({ gender: selectedGender })
            .eq('email', userEmail);

        if (error) throw error;
        alert('✅ บันทึกเพศเรียบร้อยแล้ว!');

        // บันทึกเพศลง localStorage ชั่วคราว
        localStorage.setItem('userGender', selectedGender);

        // ไปยังหน้าถัดไป
        window.location.href = 'hobby.html';

    } catch (error) {
        console.error('Update Gender Error:', error.message);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    }
});