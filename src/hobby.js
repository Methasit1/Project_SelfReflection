// 1. ตั้งค่า Supabase
const supabaseUrl = 'https://srwjzmtulcuneuqinpgx.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNyd2p6bXR1bGN1bmV1cWlucGd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODcyODc2NjEsImV4cCI6MjEwMjg2MzY2MX0.itJlKOgtoewJpvqhImfLzc5XLlp9lHQuESDTRM2qjYI';
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// 2. ดึงค่าจาก localStorage
const userEmail = localStorage.getItem('userEmail');
const userAlias = localStorage.getItem('userAlias');

if (userAlias) {
    document.getElementById('userAlias').textContent = userAlias;
}

// 3. จัดการระบบ Input (ปุ่ม X และ ตัวนับตัวอักษร)
const hobbyInput = document.getElementById('hobby');
const clearBtn = document.getElementById('clearBtn');
const charCounter = document.getElementById('charCounter');
const hobbyForm = document.getElementById('hobbyForm');

hobbyInput.addEventListener('input', () => {
    const length = hobbyInput.value.length;
    
    if (length > 0) {
        clearBtn.classList.remove('hidden');
        charCounter.classList.remove('hidden');
        charCounter.textContent = `${length}/30`;
    } else {
        clearBtn.classList.add('hidden');
        charCounter.classList.add('hidden');
    }
});

clearBtn.addEventListener('click', () => {
    hobbyInput.value = '';
    clearBtn.classList.add('hidden');
    charCounter.classList.add('hidden');
    hobbyInput.focus();
});

// 4. บันทึกข้อมูลเข้า Supabase
hobbyForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const hobbyValue = hobbyInput.value.trim();

    if (!hobbyValue) return;

    try {
        const { error } = await supabaseClient
            .from('User')
            .update({ hobby: hobbyValue })
            .eq('email', userEmail);

        if (error) throw error;

        localStorage.setItem('userHobby', hobbyValue);
        window.location.href = 'nextpage.html';

    } catch (error) {
        console.error('Update Hobby Error:', error.message);
        alert('เกิดข้อผิดพลาดในการบันทึกข้อมูล: ' + error.message);
    }
});