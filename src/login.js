// login.js

// 1. ตั้งค่า Supabase Client
const supabaseClient = window.supabaseClient;

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const signupBtn = document.getElementById('Signupbtn');
const loginBtn = document.getElementById('loginBtn');

const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

// ฟังก์ชันล้างสถานะ Error
function clearErrors() {
    if (emailError) {
        emailError.textContent = '';
        emailError.classList.add('hidden');
    }
    if (emailInput) {
        emailInput.classList.remove('border-red-500');
        emailInput.classList.add('border-black');
    }
    if (passwordError) {
        passwordError.textContent = '';
        passwordError.classList.add('hidden');
    }
    if (passwordInput) {
        passwordInput.classList.remove('border-red-500');
        passwordInput.classList.add('border-black');
    }
}

// ฟังก์ชันแสดง Error
function showError(inputElement, errorElement, message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
    if (inputElement) {
        inputElement.classList.remove('border-black');
        inputElement.classList.add('border-red-500');
    }
}

// ล้าง Error ทันทีที่ผู้ใช้เริ่มพิมพ์ใหม่
if (emailInput) {
    emailInput.addEventListener('input', () => {
        if (emailError) emailError.classList.add('hidden');
        emailInput.classList.remove('border-red-500');
        emailInput.classList.add('border-black');
    });
}

if (passwordInput) {
    passwordInput.addEventListener('input', () => {
        if (passwordError) passwordError.classList.add('hidden');
        passwordInput.classList.remove('border-red-500');
        passwordInput.classList.add('border-black');
    });
}

// ตรวจสอบเมื่อกด Submit Form
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearErrors();

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let hasError = false;

        // 1. ตรวจสอบ รูปแบบข้อมูลฝั่ง Client
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

        // เปลี่ยนสถานะปุ่มเพื่อป้องกันการกดซ้ำ
        if (loginBtn) {
            loginBtn.disabled = true;
            loginBtn.textContent = 'กำลังเข้าสู่ระบบ...';
        }

        try {
            // 2. ยืนยันตัวตนกับ Supabase Auth โดยตรง
            const { data, error: authError } = await supabaseClient.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (authError) {
                // แจ้งเตือนข้อผิดพลาดเมื่อเข้าสู่ระบบไม่สำเร็จ
                if (authError.message.includes('Invalid login credentials')) {
                    showError(passwordInput, passwordError, 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
                } else if (authError.message.includes('Email not confirmed')) {
                    showError(emailInput, emailError, 'กรุณายืนยันตัวตนผ่านอีเมลก่อนเข้าสู่ระบบ');
                } else {
                    showError(passwordInput, passwordError, authError.message);
                }
                return;
            }

            // 3. เมื่อล็อกอินสำเร็จ ดึง nickname มาเซ็ตใน localStorage (ใช้ user_id และ RLS ผ่านแล้ว)
            if (data?.user) {
                const { data: userData } = await supabaseClient
                    .from('users')
                    .select('nickname')
                    .eq('user_id', data.user.id)
                    .maybeSingle();

                if (userData && userData.nickname) {
                    localStorage.setItem('userAlias', userData.nickname);
                }
            }

            // เปลี่ยนหน้าไปยัง Dashboard
            window.location.href = './dashboard.html';

        } catch (err) {
            console.error('Login System Error:', err);
            alert('เกิดข้อผิดพลาดทางเทคนิค: ' + err.message);
        } finally {
            if (loginBtn) {
                loginBtn.disabled = false;
                loginBtn.textContent = 'Log in';
            }
        }
    });
}

// เปลี่ยนหน้าไป Sign up
if (signupBtn) {
    signupBtn.addEventListener('click', () => {
        window.location.href = './register.html';
    });
}