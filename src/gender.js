// gender.js
const supabaseClient = window.supabaseClient;

// ฟังก์ชันดึงและแสดงชื่อนามแฝงล่าสุด
async function renderUserAlias() {
    const aliasElement = document.getElementById('userAlias');
    if (!aliasElement) return;

    // 1. ดึงจาก localStorage ก่อน
    let userAlias = localStorage.getItem('userAlias');

    if (userAlias) {
        aliasElement.textContent = userAlias;
    } else {
        // 2. ถ้าใน localStorage ไม่มี ให้ดึงจาก DB ตาราง users
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            if (user) {
                const { data } = await supabaseClient
                    .from('users')
                    .select('nickname')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (data && data.nickname) {
                    aliasElement.textContent = data.nickname;
                    localStorage.setItem('userAlias', data.nickname);
                }
            }
        } catch (err) {
            console.error('Error fetching nickname:', err);
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    renderUserAlias();
    setupGenderPage();
});

window.addEventListener('pageshow', () => {
    renderUserAlias();
});

function setupGenderPage() {
    const backBtn = document.getElementById('backBtn');
    const submitBtn = document.getElementById('submitbtn');
    const genderButtons = document.querySelectorAll('.gender-btn');

    if (backBtn) {
        backBtn.addEventListener('click', () => {
            window.history.back();
        });
    }

    let selectedGender = null;

    genderButtons.forEach((btn) => {
        btn.addEventListener('click', () => {
            genderButtons.forEach((b) => {
                b.classList.remove('border-black', 'scale-105');
                b.classList.add('border-transparent');
            });

            btn.classList.remove('border-transparent');
            btn.classList.add('border-black', 'scale-105');

            selectedGender = btn.getAttribute('data-gender');
        });
    });

    if (submitBtn) {
        submitBtn.addEventListener('click', async () => {
            if (!selectedGender) {
                alert('❌ กรุณาเลือกเพศของคุณก่อนดำเนินการต่อครับ');
                return;
            }

            submitBtn.disabled = true;
            submitBtn.textContent = 'กำลังบันทึก...';

            try {
                // ดึงข้อมูล User จาก Auth Session เพื่อผ่าน RLS
                const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

                if (authError || !user) {
                    alert('❌ ไม่พบเซสชันการเข้าสู่ระบบ กรุณาเข้าสู่ระบบใหม่');
                    window.location.href = 'login.html';
                    return;
                }

                // อัปเดตคอลัมน์ gender ในตาราง users โดยอ้างอิง user_id
                const { error } = await supabaseClient
                    .from('users')
                    .update({ gender: selectedGender })
                    .eq('user_id', user.id);

                if (error) throw error;

                localStorage.setItem('userGender', selectedGender);
                window.location.href = 'hobby.html';

            } catch (error) {
                console.error('Update Gender Error:', error.message);
                alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Next';
            }
        });
    }
}