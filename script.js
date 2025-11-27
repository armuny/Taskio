// --- تنظیمات Supabase ---
// این کلیدها از فایل قبلی شما کپی شده‌اند
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- آیکون‌ها (SVG خالص) ---
const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>'
};

// --- متغیرها ---
let tasks = [];
let currentUser = null;
let isLoginMode = true; // پیش‌فرض روی حالت ورود است

// --- المان‌های DOM ---
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const completedList = document.getElementById('completed-list');
const completedSection = document.getElementById('completed-section');
const themeToggle = document.getElementById('theme-toggle');
const userBtn = document.getElementById('user-btn');
const userDropdown = document.getElementById('user-dropdown');
const logoutBtn = document.getElementById('logout-btn');
const logoutIcon = document.getElementById('logout-icon');
const userDisplayName = document.getElementById('user-display-name');
const headerTitle = document.getElementById('header-title');

// المان‌های مودال احراز هویت
const authModal = document.getElementById('auth-modal');
const closeModalBtn = document.getElementById('close-modal');
const authMsg = document.getElementById('auth-msg');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const switchAuthLink = document.getElementById('switch-auth-link');
const modalTitle = document.getElementById('modal-title');

// ورودی‌های جدید
const emailInput = document.getElementById('email-input');
const passwordInput = document.getElementById('password-input');
const fnameInput = document.getElementById('fname-input');
const lnameInput = document.getElementById('lname-input');
const signupFields = document.getElementById('signup-fields');

// المان‌های Alert سفارشی
const customAlert = document.getElementById('custom-alert');
const alertTitle = document.getElementById('alert-title');
const alertMsg = document.getElementById('alert-msg');
const alertOkBtn = document.getElementById('alert-ok-btn');


// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    // تنظیم آیکون‌ها
    themeToggle.innerHTML = ICONS.moon;
    userBtn.innerHTML = ICONS.user;
    logoutIcon.innerHTML = ICONS.logout;

    // چک کردن تم ذخیره شده
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = ICONS.sun;
    }

    // چک کردن لاگین بودن کاربر
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        userDisplayName.textContent = 'کاربر مهمان';
    }
});

// --- فانکشن‌ها ---

// 1. مدیریت تسک‌ها
async function fetchTasks() {
    if (!currentUser) return;

    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching tasks:', error);
    } else {
        tasks = data;
        renderTasks();
    }
}

function renderTasks() {
    taskList.innerHTML = '';
    completedList.innerHTML = '';
    let hasCompleted = false;

    tasks.forEach(task => {
        const li = document.createElement('li');
        if (task.is_completed) {
            li.classList.add('completed');
            hasCompleted = true;
        }

        li.innerHTML = `
            <div class="check-circle" onclick="toggleTask('${task.id}', ${task.is_completed})">
                ${task.is_completed ? ICONS.check : ''}
            </div>
            <span>${task.title}</span>
            <button class="delete-btn" onclick="deleteTask('${task.id}')">
                ${ICONS.trash}
            </button>
        `;

        if (task.is_completed) {
            completedList.appendChild(li);
        } else {
            taskList.appendChild(li);
        }
    });

    completedSection.style.display = hasCompleted ? 'block' : 'none';
}

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    if (!currentUser) {
        openAuthModal(); // اگر لاگین نیست، فرم ورود باز شود
        return;
    }

    // اضافه کردن به دیتابیس
    const { data, error } = await supabase
        .from('todos')
        .insert([{ title: text, user_id: currentUser.id, is_completed: false }])
        .select();

    if (error) {
        showAlert('خطا در ذخیره تسک: ' + error.message);
    } else {
        tasks.unshift(data[0]);
        renderTasks();
        taskInput.value = '';
    }
}

// توابع global برای دسترسی در HTML
window.toggleTask = async (id, currentStatus) => {
    const { error } = await supabase
        .from('todos')
        .update({ is_completed: !currentStatus })
        .eq('id', id);

    if (!error) {
        const task = tasks.find(t => t.id === id);
        if (task) task.is_completed = !currentStatus;
        renderTasks();
    }
};

window.deleteTask = async (id) => {
    if(!confirm('آیا مطمئن هستید؟')) return;
    
    const { error } = await supabase
        .from('todos')
        .delete()
        .eq('id', id);

    if (!error) {
        tasks = tasks.filter(t => t.id !== id);
        renderTasks();
    }
};

// 2. مدیریت کاربران (Auth) با ایمیل واقعی
submitAuthBtn.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const pass = passwordInput.value.trim();
    const fname = fnameInput.value.trim();
    const lname = lnameInput.value.trim();

    // اعتبارسنجی
    if (!email.includes('@') || !email.includes('.')) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'لطفا یک ایمیل معتبر وارد کنید';
        return;
    }

    if (pass.length < 6) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'رمز عبور باید حداقل ۶ رقم باشد';
        return;
    }

    // اگر در حالت ثبت نام هستیم، نام و نام خانوادگی اجباری است
    if (!isLoginMode && (!fname || !lname)) {
        authMsg.style.color = 'var(--danger)';
        authMsg.textContent = 'لطفا نام و نام خانوادگی را وارد کنید';
        return;
    }

    authMsg.style.color = 'var(--text)';
    authMsg.textContent = 'لطفا صبر کنید...';

    let result;

    if (isLoginMode) {
        // --- ورود (Login) ---
        result = await supabase.auth.signInWithPassword({
            email: email,
            password: pass
        });
    } else {
        // --- ثبت نام (Sign Up) ---
        result = await supabase.auth.signUp({
            email: email,
            password: pass,
            options: {
                data: {
                    first_name: fname,
                    last_name: lname
                }
            }
        });
    }

    const { data, error } = result;

    if (error) {
        authMsg.style.color = 'var(--danger)';
        if (error.message.includes('Invalid login')) {
            authMsg.textContent = 'ایمیل یا رمز عبور اشتباه است';
        } else if (error.message.includes('already registered')) {
            authMsg.textContent = 'این ایمیل قبلا ثبت شده است';
        } else {
            authMsg.textContent = 'خطا: ' + error.message;
        }
    } else {
        // عملیات موفقیت آمیز بود
        if (!isLoginMode && data.user && !data.session) {
            // ثبت نام انجام شد اما نیاز به تایید ایمیل دارد
            authMsg.style.color = 'green';
            authMsg.innerHTML = '✅ ثبت‌نام موفق!<br>لینک تایید به ایمیل شما ارسال شد.<br>لطفا ایمیل خود را چک کنید.';
        } else if (data.user) {
            // لاگین موفق (یا ثبت نامی که تایید ایمیل خاموش بوده)
            closeModalFunc(authModal);
            setCurrentUser(data.user);
            
            // پاک کردن فیلدها
            emailInput.value = '';
            passwordInput.value = '';
            fnameInput.value = '';
            lnameInput.value = '';
            
            const name = data.user.user_metadata.first_name || 'کاربر';
            showAlert(`خوش آمدید ${name}!`, 'ورود موفق');
        }
    }
});

// تغییر حالت بین ورود و ثبت نام
switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    
    modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام کاربر جدید';
    submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
    authMsg.textContent = '';

    // نمایش یا مخفی کردن فیلدهای نام
    if (isLoginMode) {
        signupFields.style.display = 'none';
        document.querySelector('.modal-subtitle').textContent = 'برای ذخیره آنلاین کارها وارد شوید';
    } else {
        signupFields.style.display = 'flex'; // نمایش کنار هم
        document.querySelector('.modal-subtitle').textContent = 'مشخصات خود را وارد کنید';
    }
});

// تنظیم کاربر جاری در برنامه
function setCurrentUser(user) {
    currentUser = user;
    // دریافت نام از متادیتا یا ایمیل
    let displayName = user.email;
    if (user.user_metadata && user.user_metadata.first_name) {
        displayName = `${user.user_metadata.first_name} ${user.user_metadata.last_name}`;
    }
    
    userDisplayName.textContent = displayName;
    headerTitle.textContent = `سلام، ${user.user_metadata.first_name || 'کاربر'}`;
    
    // تغییر آیکون کاربر به تیک یا رنگی شدن (اختیاری)
    userBtn.style.color = varCSS('--primary');
    
    fetchTasks();
}

// خروج
logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = [];
    renderTasks();
    userDisplayName.textContent = 'کاربر مهمان';
    headerTitle.textContent = 'لیست کارها';
    userDropdown.classList.remove('show'); // بستن منو
    userBtn.style.color = ''; // برگشت رنگ آیکون
    showAlert('با موفقیت خارج شدید');
});


// --- مدیریت UI ---

// دکمه افزودن
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// تم تاریک/روشن
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
});

// منوی کاربری
userBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) {
        userDropdown.classList.toggle('show');
    } else {
        openAuthModal();
    }
});

// بستن منو با کلیک بیرون
document.addEventListener('click', (e) => {
    if (!userDropdown.contains(e.target) && !userBtn.contains(e.target)) {
        userDropdown.classList.remove('show');
    }
});

// مودال‌ها
function openAuthModal() {
    authModal.classList.add('open');
    authMsg.textContent = '';
    // ریست به حالت لاگین
    isLoginMode = true;
    signupFields.style.display = 'none';
    modalTitle.textContent = 'ورود به حساب';
    submitAuthBtn.textContent = 'ورود';
    switchAuthLink.textContent = 'ثبت نام کنید';
}

function closeModalFunc(modal) {
    modal.classList.remove('open');
}

closeModalBtn.addEventListener('click', () => closeModalFunc(authModal));

// Alert سفارشی
function showAlert(msg, title = 'پیام') {
    alertTitle.textContent = title;
    alertMsg.textContent = msg;
    customAlert.classList.add('open');
}
alertOkBtn.addEventListener('click', () => closeModalFunc(customAlert));

// هلپر برای گرفتن رنگ از CSS
function varCSS(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
