// register.js
const supabaseClient = window.supabaseClient;

const registerForm = document.getElementById('registerForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const submitBtn = document.getElementById('submitBtn');
const backBtn = document.getElementById('backBtn');

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

if (emailInput) emailInput.addEventListener('input', clearErrors);
if (passwordInput) passwordInput.addEventListener('input', clearErrors);

if (registerForm) {
    registerForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        clearErrors();

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        let hasError = false;

        // Validation 1: ตรวจสอบอีเมล
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email) {
            showError(emailInput, emailError, 'กรุณากรอกอีเมล');
            hasError = true;
        } else if (!emailRegex.test(email)) {
            showError(emailInput, emailError, 'รูปแบบอีเมลไม่ถูกต้อง');
            hasError = true;
        }

        // Validation 2: ตรวจสอบรหัสผ่าน (อย่างน้อย 8 ตัวอักษร มีตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข)
        const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
        if (!password) {
            showError(passwordInput, passwordError, 'กรุณากรอกรหัสผ่าน');
            hasError = true;
        } else if (!passwordRegex.test(password)) {
            showError(passwordInput, passwordError, 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร มีตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลขอย่างละ 1 ตัว');
            hasError = true;
        }

        if (hasError) return;

        // ล็อกปุ่มกดระหว่างรอส่งข้อมูล
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังลงทะเบียน...';
        }

        try {
            // เรียกใช้เพียง supabase.auth.signUp() 
            // ตัว Database Trigger (handle_new_user) จะทำการ insert ลงตาราง public.users ให้อัตโนมัติฝั่ง DB
            const { data: authData, error: authError } = await supabaseClient.auth.signUp({
                email: email,
                password: password,
            });

            if (authError) {
                showError(emailInput, emailError, 'เกิดข้อผิดพลาด: ' + authError.message);
                return;
            }

            // ตรวจสอบกรณีอีเมลซ้ำ (Supabase จะไม่โยน Error แต่จะคืนค่า identities เป็น Array ว่าง)
            if (authData.user && authData.user.identities && authData.user.identities.length === 0) {
                showError(emailInput, emailError, 'อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่น');
                return;
            }

            // สมัครสมาชิกสำเร็จ เปลี่ยนหน้าไปยังการตั้งชื่อนามแฝง (aliasname.html)
            window.location.href = 'aliasname.html';

        } catch (error) {
            console.error('Registration Error:', error.message);
            showError(emailInput, emailError, 'เกิดข้อผิดพลาดทางเทคนิค กรุณาลองใหม่อีกครั้ง');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign up';
            }
        }
    });
}

if (backBtn) {
    backBtn.addEventListener('click', () => {
        window.location.href = 'login.html';
    });
}