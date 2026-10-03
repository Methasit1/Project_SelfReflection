// 1. ตั้งค่า Supabase Client
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const backBtn = document.getElementById('backBtn');

// ฟังก์ชันล้างข้อความแจ้งเตือน
function clearErrors() {
    emailError.textContent = '';
    emailError.classList.add('hidden');
    passwordError.textContent = '';
    passwordError.classList.add('hidden');
}

// ฟังก์ชันแสดงข้อความแจ้งเตือนสีแดง
function showError(element, message) {
    element.textContent = message;
    element.classList.remove('hidden');
}

// ล้างข้อความแจ้งเตือนอัตโนมัติเมื่อผู้ใช้พิมพ์แก้ไข
emailInput.addEventListener('input', () => {
    emailError.textContent = '';
    emailError.classList.add('hidden');
});

passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
    passwordError.classList.add('hidden');
});

registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let hasError = false;

    // 1. ตรวจสอบ Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        showError(emailError, 'กรุณากรอกอีเมล');
        hasError = true;
    } else if (!emailRegex.test(email)) {
        showError(emailError, 'รูปแบบอีเมลไม่ถูกต้อง');
        hasError = true;
    }

    // 2. ตรวจสอบ Password (อย่างน้อย 8 ตัวอักษร, มี a-z, A-Z, 0-9)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!password) {
        showError(passwordError, 'กรุณากรอกรหัสผ่าน');
        hasError = true;
    } else if (!passwordRegex.test(password)) {
        showError(passwordError, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร และมีตัวพิมพ์เล็ก (a-z) พิมพ์ใหญ่ (A-Z) และตัวเลข (0-9) อย่างละ 1 ตัว');
        hasError = true;
    }

    if (hasError) return;

    try {
        // 3. สมัครสมาชิกผ่าน Supabase Auth
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            if (authError.message.includes('User already registered') || authError.message.includes('already exists')) {
                showError(emailError, 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น');
            } else {
                showError(emailError, 'เกิดข้อผิดพลาดในการลงทะเบียน: ' + authError.message);
            }
            return;
        }

        // 4. ดึง user_id ไปบันทึกลงตาราง "User"
        const userId = authData.user?.id;

        if (userId) {
            const { error: profileError } = await supabaseClient
                .from('User')
                .insert([
                    { 
                        user_id: userId, 
                        email: email 
                    }
                ]);

            if (profileError) {
                showError(emailError, 'เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + profileError.message);
                return;
            }
        }

        // บันทึกข้อมูลลง localStorage สำหรับใช้ในหน้า aliasname.html
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', userId);

        // ย้ายหน้าไปยัง aliasname.html
        window.location.href = 'aliasname.html';

    } catch (error) {
        console.error('Registration Error:', error.message);
        showError(emailError, 'เกิดข้อผิดพลาด: ' + error.message);
    }
});

// กลับไปหน้า login
if (backBtn) {
    backBtn.addEventListener('click', () => {
        window.location.href = './login.html';
    });
}