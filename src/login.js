// 1. ตั้งค่า Supabase Client
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI'; // ใส่ Anon Key ของคุณ
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const signupBtn = document.getElementById('Signupbtn');

const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// ฟังก์ชันล้างสถานะ Error (รีเซ็ตสีเส้นใต้เป็นสีดำ และซ่อนข้อความ Error)
function clearErrors() {
    // ล้าง Email Error
    emailError.textContent = '';
    emailError.classList.add('hidden');
    emailInput.classList.remove('border-red-500');
    emailInput.classList.add('border-black');

    // ล้าง Password Error
    passwordError.textContent = '';
    passwordError.classList.add('hidden');
    passwordInput.classList.remove('border-red-500');
    passwordInput.classList.add('border-black');
}

// ฟังก์ชันแสดง Error (เปลี่ยนเส้นใต้เป็นสีแดง และแสดงข้อความเตือน)
function showError(inputElement, errorElement, message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    inputElement.classList.remove('border-black');
    inputElement.classList.add('border-red-500');
}

// ล้าง Error ทันทีที่ผู้ใช้เริ่มพิมพ์ใหม่ในช่อง Input
emailInput.addEventListener('input', () => {
    emailError.classList.add('hidden');
    emailInput.classList.remove('border-red-500');
    emailInput.classList.add('border-black');
});

passwordInput.addEventListener('input', () => {
    passwordError.classList.add('hidden');
    passwordInput.classList.remove('border-red-500');
    passwordInput.classList.add('border-black');
});

// ตรวจสอบเมื่อกด Submit Form
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let hasError = false;

    // 1. ตรวจสอบ Format
    if (!email) {
        showError(emailInput, emailError, 'กรุณากรอกอีเมล');
        hasError = true;
    } else if (!emailRegex.test(email)) {
        showError(emailInput, emailError, 'รูปแบบอีเมลไม่ถูกต้อง');
        hasError = true;
    }

    if (!password) {
        showError(passwordInput, passwordError, 'กรุณากรอกรหัสผ่าน');
        hasError = true;
    }

    if (hasError) return;

    try {
        // 2. ตรวจสอบว่ามี Email นี้ในระบบหรือไม่
        const { data: user, error: userError } = await supabaseClient
            .from('User')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (userError) throw userError;

        if (!user) {
            showError(emailInput, emailError, 'ไม่พบบัญชีผู้ใช้');
            return;
        }

        // 3. ตรวจสอบ รหัสผ่าน กับ Supabase Auth
        const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (authError) {
            showError(passwordInput, passwordError, 'รหัสผ่านไม่ถูกต้อง');
            return;
        }

        // เข้าสู่ระบบสำเร็จ
        alert('✅ เข้าสู่ระบบสำเร็จ!');
        window.location.href = './profile.html';

    } catch (err) {
        console.error('Login System Error:', err.message);
        alert('เกิดข้อผิดพลาดทางเทคนิค: ' + err.message);
    }
});

// เปลี่ยนหน้าไป Sign up
signupBtn.addEventListener('click', () => {
    window.location.href = './register.html';
});