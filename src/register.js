// 1. ตั้งค่า Supabase Client
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // 1. ดักข้อมูลว่าง
    if (!email || !password) {
        alert('❌ กรุณากรอกข้อมูลให้ครบถ้วน');
        return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;

    // 2. ดักรูปแบบอีเมล
    if (!emailRegex.test(email)) {
        alert('❌ กรุณากรอกรูปแบบอีเมลให้ถูกต้องครับ');
        return;
    }

    // 3. ดักรูปแบบรหัสผ่าน
    if (!passwordRegex.test(password)) {
        alert('❌ รหัสผ่านต้องมีความยาวอย่างน้อย 8 ตัวอักษร และต้องมีตัวพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลขอย่างน้อย 1 ตัวครับ');
        return;
    }

    try {
        // 4. สมัครสมาชิกผ่าน Supabase Auth (แปลงรหัสผ่านให้อัตโนมัติ)
        const { data: authData, error: authError } = await supabaseClient.auth.signUp({
            email: email,
            password: password,
        });

        if (authError) {
            if (authError.message.includes('User already registered')) {
                alert('❌ อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นครับ');
            } else {
                alert('เกิดข้อผิดพลาดในการลงทะเบียน: ' + authError.message);
            }
            return;
        }

        // 5. ดึง user_id ที่ Supabase Auth เจนให้ นำไปลงตาราง "User"
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

            if (profileError) throw profileError;
        }

        // บันทึกข้อมูลลง localStorage สำหรับใช้ในหน้าถัดไป (aliasname.html)
        localStorage.setItem('userEmail', email);
        localStorage.setItem('userId', userId);

        alert('✅ ลงทะเบียนเบื้องต้นสำเร็จ!');
        window.location.href = 'aliasname.html';

    } catch (error) {
        console.error('Registration Error:', error.message);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
});

//กลับไปหน้า login
const backBtn = document.getElementById('backBtn');

backBtn.addEventListener('click', () => {
    window.location.href = './login.html';

});