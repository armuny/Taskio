// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- DOM Elements ---
const els = {
    todoInput: document.getElementById('todo-input'),
    addBtn: document.getElementById('add-btn'),
    todoList: document.getElementById('todo-list'),
    themeToggle: document.getElementById('theme-toggle'),
    
    // Auth & Header
    authBtn: document.getElementById('auth-btn'),
    headerTitle: document.getElementById('header-title'),
    userDropdown: document.getElementById('user-dropdown'),
    dropdownHeader: document.getElementById('dropdown-header'),
    logoutBtn: document.getElementById('logout-btn'),
    editProfileBtn: document.getElementById('edit-profile-btn'),
    
    // Modal
    authModal: document.getElementById('auth-modal'),
    closeModal: document.querySelector('.close-modal'),
    modalTitle: document.getElementById('modal-title'),
    authMainSection: document.getElementById('auth-main-section'),
    recoverySection: document.getElementById('recovery-section'),
    updatePassSection: document.getElementById('update-pass-section'),

    // Inputs
    usernameInput: document.getElementById('username-input'),
    passwordInput: document.getElementById('password-input'),
    fnameInput: document.getElementById('fname-input'),
    lnameInput: document.getElementById('lname-input'),
    realEmailInput: document.getElementById('real-email-input'), // جدید
    signupFields: document.getElementById('signup-fields'),
    
    // Buttons & Links
    submitAuthBtn: document.getElementById('submit-auth-btn'),
    switchAuthBtn: document.getElementById('switch-auth-btn'),
    authFooterLinks: document.getElementById('auth-footer-links'),
    authMsg: document.getElementById('auth-msg'),
    forgotPassContainer: document.getElementById('forgot-pass-container'), // کانتینر لینک فراموشی
    forgotPassLink: document.getElementById('forgot-pass-link'), // لینک فراموشی

    // Recovery Elements
    recoveryEmailInput: document.getElementById('recovery-email-input'),
    sendRecoveryBtn: document.getElementById('send-recovery-btn'),
    recoveryMsg: document.getElementById('recovery-msg'),
    backToLoginBtn: document.getElementById('back-to-login-btn'),

    // Update Pass Elements
    newPasswordInput: document.getElementById('new-password-input'),
    saveNewPassBtn: document.getElementById('save-new-pass-btn'),
    updatePassMsg: document.getElementById('update-pass-msg'),

    // Alert Modal
    alertModal: document.getElementById('alert-modal'),
    alertTitle: document.getElementById('alert-title'),
    alertMsg: document.getElementById('alert-msg'),
    alertOkBtn: document.getElementById('alert-ok-btn'),
    alertCancelBtn: document.getElementById('alert-cancel-btn')
};

// --- Icons ---
const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

// --- Variables ---
let tasks = [];
let currentUser = null;
let authMode = 'login'; // 'login', 'signup', 'edit'
let alertCallback = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalSettings();
    await checkSession();
    renderTasks();
});

// --- Theme Logic ---
function loadLocalSettings() {
    const isDark = localStorage.getItem('dark_mode') === 'true';
    if (isDark) document.body.classList.add('dark-mode');
    updateThemeIcon();
}

els.themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    localStorage.setItem('dark_mode', document.body.classList.contains('dark-mode'));
    updateThemeIcon();
});

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    els.themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
}

// --- Auth Logic ---
els.authBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) {
        els.userDropdown.classList.toggle('show');
    } else {
        openAuthModal('login');
    }
});

els.editProfileBtn.addEventListener('click', openEditProfile);

els.logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    els.userDropdown.classList.remove('show');
    els.authBtn.classList.remove('active');
    els.headerTitle.textContent = 'لیست کارها';
    
    // Load local tasks
    const localData = localStorage.getItem('todo_local_tasks');
    if (localData) tasks = JSON.parse(localData);
    renderTasks();
    showAlert('از حساب خارج شدید');
});

// Close dropdown on outside click
window.addEventListener('click', (e) => {
    if (!els.userDropdown.contains(e.target) && !els.authBtn.contains(e.target)) {
        els.userDropdown.classList.remove('show');
    }
});

function openAuthModal(mode) {
    authMode = mode;
    els.authMsg.textContent = '';
    els.usernameInput.value = '';
    els.passwordInput.value = '';
    els.fnameInput.value = '';
    els.lnameInput.value = '';
    els.realEmailInput.value = '';

    // ریست کردن نمایش سکشن‌ها
    els.authMainSection.style.display = 'block';
    els.recoverySection.style.display = 'none';
    els.updatePassSection.style.display = 'none';

    if (mode === 'login') {
        els.modalTitle.textContent = 'ورود به حساب';
        els.submitAuthBtn.textContent = 'ورود';
        els.signupFields.style.display = 'none';
        els.authFooterLinks.style.display = 'block';
        els.forgotPassContainer.style.display = 'block'; // نمایش فراموشی رمز
        
        document.getElementById('switch-text').textContent = 'حساب ندارید؟';
        els.switchAuthBtn.textContent = 'ثبت نام';
    } 
    else if (mode === 'signup') {
        els.modalTitle.textContent = 'ثبت نام کاربر جدید';
        els.submitAuthBtn.textContent = 'ثبت نام';
        els.signupFields.style.display = 'block';
        els.authFooterLinks.style.display = 'block';
        els.forgotPassContainer.style.display = 'none'; // در ثبت نام فراموشی معنی ندارد

        document.getElementById('switch-text').textContent = 'حساب دارید؟';
        els.switchAuthBtn.textContent = 'ورود';
    }
    openModal(els.authModal);
}

function openEditProfile() {
    authMode = 'edit';
    els.userDropdown.classList.remove('show');

    els.modalTitle.textContent = 'ویرایش مشخصات';
    els.submitAuthBtn.textContent = 'ذخیره تغییرات';

    els.signupFields.style.display = 'block'; 
    els.authFooterLinks.style.display = 'none';
    els.forgotPassContainer.style.display = 'none';

    // مخفی کردن ایمیل واقعی چون کاربر نمی‌تواند ایمیلش را راحت عوض کند (نیاز به تاییدیه دارد)
    // به جای آن یوزرنیم را نمایش می‌دهیم
    els.realEmailInput.style.display = 'none';

    const meta = currentUser.user_metadata || {};
    els.fnameInput.value = meta.first_name || '';
    els.lnameInput.value = meta.last_name || '';
    els.usernameInput.value = currentUser.email || ''; 
    els.usernameInput.disabled = true; // ایمیل قابل ویرایش نیست فعلا

    els.passwordInput.value = '';
    els.passwordInput.placeholder = 'رمز عبور جدید (اختیاری)';

    openModal(els.authModal);
}

els.switchAuthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    openAuthModal(authMode === 'login' ? 'signup' : 'login');
});

// --- لاجیک اصلی سابمیت (ورود / ثبت نام / ویرایش) ---
els.submitAuthBtn.addEventListener('click', async () => {
    els.authMsg.textContent = 'لطفا صبر کنید...';
    els.authMsg.style.color = 'var(--text)';

    // ۱. حالت ویرایش
    if (authMode === 'edit') {
        const fname = els.fnameInput.value.trim();
        const lname = els.lnameInput.value.trim();
        const pass = els.passwordInput.value.trim();

        if(!fname) return els.authMsg.textContent = 'نام الزامی است';

        const updateData = { data: { first_name: fname, last_name: lname } };
        if (pass.length > 0) updateData.password = pass;

        const { data, error } = await supabase.auth.updateUser(updateData);

        if(error) els.authMsg.textContent = error.message;
        else {
            setCurrentUser(data.user);
            closeModalFunc(els.authModal);
            showAlert('مشخصات بروز شد');
        }
        return;
    }

    // ۲. حالت ورود یا ثبت نام
    const userOrEmail = els.usernameInput.value.trim(); // در لاگین: یوزر یا ایمیل
    const pass = els.passwordInput.value.trim();
    const fname = els.fnameInput.value.trim();
    const lname = els.lnameInput.value.trim();
    const realEmail = els.realEmailInput.value.trim(); // فقط در ثبت نام

    if (!userOrEmail && !realEmail) {
        els.authMsg.textContent = 'ایمیل الزامی است';
        return;
    }
    if (pass.length < 4) {
        els.authMsg.textContent = 'رمز عبور باید حداقل ۴ کاراکتر باشد';
        return;
    }

    let result;
    
    if (authMode === 'login') {
        // لاجیک هوشمند برای ورود:
        // اگر کاربر ایمیل وارد کرد که هیچ، اگر یوزرنیم وارد کرد، @example.com اضافه کن (برای کاربران قدیمی)
        let emailToUse = userOrEmail;
        if (!userOrEmail.includes('@')) {
            emailToUse = `${userOrEmail}@example.com`;
        }

        result = await supabase.auth.signInWithPassword({
            email: emailToUse,
            password: pass
        });
    } else {
        // ثبت نام
        if (!realEmail || !realEmail.includes('@')) {
            els.authMsg.textContent = 'لطفا یک ایمیل معتبر وارد کنید';
            return;
        }
        // استفاده از ایمیل واقعی برای ثبت نام
        result = await supabase.auth.signUp({
            email: realEmail,
            password: pass,
            options: { data: { first_name: fname, last_name: lname } }
        });
    }

    const { data, error } = result;

    if (error) {
        els.authMsg.textContent = 'خطا: اطلاعات اشتباه است';
        els.authMsg.style.color = 'var(--danger)';
        console.error(error);
    } else {
        if (authMode === 'signup') {
            // اگر ثبت نام موفق بود ولی تایید ایمیل لازم است
            if (data.user && !data.session) {
                els.authMsg.textContent = 'لینک تایید به ایمیل ارسال شد. لطفا ایمیل خود را چک کنید.';
                els.authMsg.style.color = 'green';
            } else {
                closeModalFunc(els.authModal);
                showAlert('ثبت نام موفقیت آمیز بود!');
                if (data.user) setCurrentUser(data.user);
            }
        } else {
            // ورود
            closeModalFunc(els.authModal);
            if (data.user) {
                setCurrentUser(data.user);
                showAlert(`خوش آمدید ${data.user.user_metadata.first_name || ''}!`, 'ورود موفق');
            }
        }
    }
});

// --- فراموشی رمز عبور ---
els.forgotPassLink.addEventListener('click', (e) => {
    e.preventDefault();
    els.authMainSection.style.display = 'none';
    els.recoverySection.style.display = 'block';
    els.modalTitle.textContent = 'بازیابی رمز عبور';
});

els.backToLoginBtn.addEventListener('click', () => {
    els.recoverySection.style.display = 'none';
    els.authMainSection.style.display = 'block';
    els.modalTitle.textContent = 'ورود به حساب';
});

els.sendRecoveryBtn.addEventListener('click', async () => {
    const email = els.recoveryEmailInput.value.trim();
    if (!email) return els.recoveryMsg.textContent = 'ایمیل را وارد کنید';

    els.recoveryMsg.textContent = 'در حال ارسال...';
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href
    });

    if (error) {
        els.recoveryMsg.textContent = 'خطا در ارسال ایمیل (شاید ایمیل اشتباه است)';
        els.recoveryMsg.style.color = 'var(--danger)';
    } else {
        els.recoveryMsg.textContent = 'لینک بازیابی ارسال شد. ایمیل خود را چک کنید (پوشه اسپم را هم ببینید).';
        els.recoveryMsg.style.color = 'green';
    }
});

// تشخیص بازگشت از ایمیل برای تغییر رمز
supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        openModal(els.authModal);
        els.authMainSection.style.display = 'none';
        els.recoverySection.style.display = 'none';
        els.updatePassSection.style.display = 'block';
        els.modalTitle.textContent = 'تغییر رمز عبور';
    }
});

els.saveNewPassBtn.addEventListener('click', async () => {
    const newPass = els.newPasswordInput.value.trim();
    if (newPass.length < 4) return els.updatePassMsg.textContent = 'رمز کوتاه است';

    els.updatePassMsg.textContent = 'در حال ذخیره...';
    const { error } = await supabase.auth.updateUser({ password: newPass });

    if (error) {
        els.updatePassMsg.textContent = 'خطا در تغییر رمز';
    } else {
        els.updatePassMsg.textContent = 'رمز با موفقیت تغییر کرد!';
        els.updatePassMsg.style.color = 'green';
        setTimeout(() => {
            closeModalFunc(els.authModal);
            showAlert('رمز تغییر کرد');
            window.location.hash = ''; // پاک کردن توکن از URL
            // رفرش صفحه برای اطمینان از استیت صحیح
            setTimeout(() => window.location.reload(), 1000);
        }, 1500);
    }
});

// --- Session Check ---
async function checkSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) setCurrentUser(session.user);
}

function setCurrentUser(user) {
    currentUser = user;
    els.authBtn.classList.add('active');
    
    const name = user.user_metadata.first_name || 'کاربر';
    els.headerTitle.textContent = `${name} خوش آمدید`;
    els.dropdownHeader.textContent = user.email;
    
    fetchTasks();
}

// --- Task Functions ---
els.addBtn.addEventListener('click', addNewTask);
els.todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addNewTask());

async function addNewTask() {
    const text = els.todoInput.value.trim();
    if (!text) return;

    const newTask = { text, completed: false, id: Date.now() };

    if (currentUser) {
        const { data, error } = await supabase.from('tasks').insert([{
            user_id: currentUser.id,
            title: text,
            is_complete: false
        }]).select();
        
        if (!error && data) {
            newTask.id = data[0].id; 
            newTask.user_id = currentUser.id; 
            tasks.unshift(newTask);
        }
    } else {
        tasks.unshift(newTask);
        saveLocal();
    }

    els.todoInput.value = '';
    renderTasks();
}

async function fetchTasks() {
    if (!currentUser) return;
    const { data, error } = await supabase.from('tasks').select('*').eq('user_id', currentUser.id).order('created_at', { ascending: false });
    if (!error) {
        tasks = data.map(t => ({ id: t.id, text: t.title, completed: t.is_complete }));
        renderTasks();
    }
}

function renderTasks() {
    els.todoList.innerHTML = '';
    tasks.forEach(task => {
        const li = document.createElement('li');
        li.className = task.completed ? 'completed' : '';
        li.innerHTML = `
            <span onclick="toggleTask('${task.id}')" style="cursor:pointer; flex:1; text-align:right;">${task.text}</span>
            <div class="task-actions">
                <button class="action-btn check-btn" onclick="toggleTask('${task.id}')">${ICONS.check}</button>
                <button class="action-btn delete-btn" onclick="confirmDelete('${task.id}')">${ICONS.trash}</button>
            </div>
        `;
        els.todoList.appendChild(li);
    });
}

window.toggleTask = async (id) => {
    const taskIndex = tasks.findIndex(t => t.id == id);
    if (taskIndex === -1) return;
    
    const newState = !tasks[taskIndex].completed;
    tasks[taskIndex].completed = newState;
    renderTasks();

    if (currentUser) {
        await supabase.from('tasks').update({ is_complete: newState }).eq('id', id);
    } else {
        saveLocal();
    }
};

window.confirmDelete = (id) => {
    showAlert('آیا از حذف این کار مطمئن هستید؟', 'هشدار حذف', true, () => deleteTask(id));
};

async function deleteTask(id) {
    if (currentUser) {
        await supabase.from('tasks').delete().eq('id', id);
    }
    tasks = tasks.filter(t => t.id != id);
    saveLocal();
    renderTasks();
}

function saveLocal() {
    localStorage.setItem('todo_local_tasks', JSON.stringify(tasks));
}

// --- Helper Functions ---
function openModal(modal) {
    modal.style.display = 'flex';
    setTimeout(() => modal.classList.add('open'), 10);
}

function closeModalFunc(modal) {
    modal.classList.remove('open');
    setTimeout(() => modal.style.display = 'none', 300);
}

els.closeModal.addEventListener('click', () => closeModalFunc(els.authModal));
window.onclick = (e) => {
    if (e.target == els.authModal) closeModalFunc(els.authModal);
    if (e.target == els.alertModal) closeModalFunc(els.alertModal);
};

function showAlert(msg, title = 'پیام', hasCancel = false, callback = null) {
    els.alertTitle.textContent = title;
    els.alertMsg.textContent = msg;
    els.alertCancelBtn.style.display = hasCancel ? 'inline-block' : 'none';
    
    alertCallback = callback;
    openModal(els.alertModal);
}

els.alertOkBtn.addEventListener('click', () => {
    if (alertCallback) alertCallback();
    closeModalFunc(els.alertModal);
});
els.alertCancelBtn.addEventListener('click', () => closeModalFunc(els.alertModal));
