// 1. ตั้งค่า Supabase (เปลี่ยน Key เป็นของคุณ)
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI'; // เปลี่ยนเป็น anon key ของคุณ
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 🔒 ฟังก์ชันสำหรับแปลงรหัสผ่าน (Hash เป็น SHA-256)
async function hashPassword(password) {
    if (!window.crypto || !window.crypto.subtle) {
        console.warn("⚠️ ไม่รองรับ crypto.subtle (ส่งรหัสผ่านปกติ)");
        return password;
    }
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // 1. ดักข้อมูลว่าง
    if (email === "" || password === "") {
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
        // เช็กอีเมลซ้ำใน Supabase
        const { data: existingUsers, error: checkError } = await supabaseClient
            .from('User')
            .select('email')
            .eq('email', email);

        if (checkError) throw checkError;

        if (existingUsers.length > 0) {
            alert('❌ อีเมลนี้ถูกใช้งานแล้ว กรุณาใช้อีเมลอื่นครับ');
            return;
        }

        // Hash รหัสผ่านก่อนบันทึก
        const hashedPassword = await hashPassword(password);

        // บันทึกลง Supabase
        const { data: insertData, error: insertError } = await supabaseClient
            .from('User')
            .insert([
                { email: email, password: hashedPassword }
            ]);

        if (insertError) throw insertError;

        // บันทึกอีเมลลง localStorage
        localStorage.setItem('userEmail', email);

        alert('✅ ลงทะเบียนเบื้องต้นสำเร็จ!');
        window.location.href = 'aliasname.html';

    } catch (error) {
        console.error('Supabase Error:', error.message);
        alert('เกิดข้อผิดพลาด: ' + error.message);
    }
});