// 1. ดึงข้อมูล Session จาก localStorage
const userEmail = localStorage.getItem('userEmail');
const userAlias = localStorage.getItem('userAlias');

// 2. ดักทาง: ถ้าไม่มีข้อมูล ให้ส่งกลับไปหน้า Register / Login
if (!userEmail || !userAlias) {
    alert('❌ คุณยังไม่ได้ลงทะเบียน กรุณาเข้าสู่ระบบก่อนครับ');
    window.location.href = 'register.html';
} else {
    // 3. แสดงชื่อผู้ใช้ และใส่ Tooltip เมื่อเอาเมาส์ชี้
    const aliasElem = document.getElementById('userAlias');
    if (aliasElem) {
        aliasElem.textContent = userAlias;
        aliasElem.title = userAlias; // แสดงชื่อเต็มเมื่อเมาส์ชี้
    }
}

// 4. ปุ่มกดเริ่มใช้งาน
const startBtn = document.getElementById('startBtn');
if (startBtn) {
    startBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });
}