// 1. สร้าง Client และเก็บใส่ตัวแปรชื่อ supabaseClient
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey); // หรือ window.supabase.createClient

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const signupBtn = document.getElementById('Signupbtn');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        // ❌ ผิด: await supabase.from('User')...
        // ✅ ถูก: ต้องใช้ supabaseClient ที่เราสร้างไว้ข้างบน
        const { data: user, error: userError } = await supabaseClient
            .from('User')
            .select('email')
            .eq('email', email)
            .maybeSingle();

        if (!user) {
            alert('ไม่มีข้อมูลผู้ใช้ในระบบ');
            return;
        }

        // ✅ ถูก: ใช้ supabaseClient กับระบบ Auth เช่นกัน
        const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            alert('รหัสผ่านไม่ถูกต้อง');
            return;
        }

        alert('เข้าสู่ระบบสำเร็จ!');

    } catch (err) {
        console.error('System error:', err);
        alert('เกิดข้อผิดพลาดทางเทคนิค');
    }
});

// เปลี่ยนหน้าไป Sign up
signupBtn.addEventListener('click', () => {
    window.location.href = './register.html';
});