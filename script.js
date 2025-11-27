const supabaseUrl = 'YOUR_SUPABASE_URL'; // آدرس سوپربیس خود را اینجا بگذارید
const supabaseKey = 'YOUR_SUPABASE_KEY'; // کلید خود را اینجا بگذارید
const supabase = supabase.createClient(supabaseUrl, supabaseKey);

// --- Elements ---
const taskInput = document.getElementById('task-input');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const themeToggle = document.getElementById('theme-toggle');
const headerTitle = document.getElementById('header-title');

// Auth Elements
const authBtn = document.getElementById('auth-btn');
const userDropdown = document.getElementById('user-dropdown');
const authModal = document.getElementById('auth-modal');
const closeModal = document.getElementById('close-modal');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const fnameInput = document.getElementById('fname-input');
const lnameInput = document.getElementById('lname-input');
const signupFields = document.getElementById('signup-fields');
const switchAuthLink = document.getElementById('switch-auth-link');
const modalTitle = document.getElementById('modal-title');
const authMsg = document.getElementById('auth-msg');
const dropdownUsername = document.getElementById('dropdown-username');
const logoutBtn = document.getElementById('logout-btn');
const forgotPassLink = document.getElementById('forgot-pass-link');

// Profile Edit Elements
const editProfileBtn = document.getElementById('edit-profile-btn');
const profileModal = document.getElementById('profile-modal');
const closeProfileModal = document.getElementById('close-profile-modal');
const saveProfileBtn = document.getElementById('save-profile-btn');
const editFname = document.getElementById('edit-fname');
const editLname = document.getElementById('edit-lname');
const editEmail = document.getElementById('edit-email');
const editPassword = document.getElementById('edit-password');

// Theme Modal Elements
const colorPaletteBtn = document.getElementById('color-palette-btn');
const themeModal = document.getElementById('theme-modal');
const colorGrid = document.getElementById('color-grid');

// --- آیکون‌ها ---
const ICONS = {
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>'
};

// --- متغیرها ---
let tasks = [];
let currentUser = null;
let isLoginMode = true;

// --- Initialization ---
document.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    
    // بررسی لاگین بودن کاربر
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        handleLoginSuccess(session.user);
    } else {
        loadLocalTasks();
    }
});

// --- Theme & Color Logic (Updated) ---
// پالت رنگی گسترده‌تر
const themes = [
    '#3b82f6', // آبی (پیش‌فرض)
    '#ef4444', // قرمز
    '#10b981', // سبز
    '#f59e0b', // زرد/نارنجی
    '#8b5cf6', // بنفش
    '#ec4899', // صورتی
    '#06b6d4', // فیروزه‌ای
    '#f97316', // نارنجی پررنگ
    '#6366f1', // نیلی
    '#64748b'  // خاکستری سربی
];

function loadTheme() {
    const isDark = localStorage.getItem('dark-mode') === 'true';
    const color = localStorage.getItem('theme-color') || '#3b82f6';
    
    if (isDark) document.body.classList.add('dark-mode');
    themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
    
    document.documentElement.style.setProperty('--primary', color);
    renderColorGrid(color);
}

// ساخت گرید رنگ‌ها در مودال
function renderColorGrid(selectedColor) {
    colorGrid.innerHTML = '';
    themes.forEach(color => {
        const div = document.createElement('div');
        div.className = `color-option ${color === selectedColor ? 'selected' : ''}`;
        div.style.backgroundColor = color;
        div.onclick = () => {
            document.documentElement.style.setProperty('--primary', color);
            localStorage.setItem('theme-color', color);
            // بروزرسانی کلاس selected
            document.querySelectorAll('.color-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            closeModalFunc(themeModal); // بستن مودال بعد از انتخاب
        };
        colorGrid.appendChild(div);
    });
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('dark-mode', isDark);
    themeToggle.innerHTML = isDark ? ICONS.sun : ICONS.moon;
});

// باز کردن مودال رنگ
colorPaletteBtn.addEventListener('click', () => openModal(themeModal));


// --- Task Logic ---
function renderTasks() {
    taskList.innerHTML = '';
    
    // مرتب‌سازی: اول انجام نشده‌ها، بعد انجام شده‌ها
    tasks.sort((a, b) => a.completed - b.completed);

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);

    activeTasks.forEach(task => createTaskElement(task));

    if (completedTasks.length > 0) {
        const separator = document.createElement('div');
        separator.className = 'list-separator';
        separator.innerHTML = '<span>انجام شده</span>';
        taskList.appendChild(separator);
        completedTasks.forEach(task => createTaskElement(task));
    }
}

function createTaskElement(task) {
    const li = document.createElement('li');
    if (task.completed) li.classList.add('completed');

    li.innerHTML = `
        <div class="check-circle">${task.completed ? ICONS.check : ''}</div>
        <span>${task.task}</span>
        <button class="delete-btn">${ICONS.trash}</button>
    `;

    // Toggle Complete
    li.querySelector('.check-circle').addEventListener('click', async () => {
        task.completed = !task.completed;
        if (currentUser) {
            await supabase.from('todos').update({ is_complete: task.completed }).eq('id', task.id);
        } else {
            saveLocalTasks();
        }
        renderTasks();
    });

    // Delete Task (Custom Modal)
    li.querySelector('.delete-btn').addEventListener('click', async () => {
        const confirm = await showConfirm('آیا از حذف این تسک مطمئن هستید؟');
        if (confirm) {
            if (currentUser) {
                await supabase.from('todos').delete().eq('id', task.id);
                fetchTasks();
            } else {
                tasks = tasks.filter(t => t.id !== task.id);
                saveLocalTasks();
                renderTasks();
            }
        }
    });

    taskList.appendChild(li);
}

async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    if (currentUser) {
        const { data, error } = await supabase
            .from('todos')
            .insert([{ task: text, user_id: currentUser.id, is_complete: false }])
            .select();
        
        if (data) {
            tasks.push(data[0]);
        } else if (error) {
            showAlert('خطا در ذخیره: ' + error.message);
        }
    } else {
        tasks.push({ id: Date.now(), task: text, completed: false });
        saveLocalTasks();
    }

    taskInput.value = '';
    renderTasks();
}

addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

function saveLocalTasks() {
    localStorage.setItem('localTasks', JSON.stringify(tasks));
}

function loadLocalTasks() {
    const stored = localStorage.getItem('localTasks');
    if (stored) tasks = JSON.parse(stored);
    renderTasks();
}

// --- User Profile & Greeting Logic (Updated) ---
async function handleLoginSuccess(user) {
    currentUser = user;
    closeModalFunc(authModal);
    
    const { data: meta } = await supabase
        .from('users_meta')
        .select('*')
        .eq('user_id', user.id)
        .single();

    let displayName = 'کاربر';
    // لاجیک سلام: فقط نام کوچک + ایموجی
    if (meta && meta.first_name) {
        headerTitle.textContent = `سلام ${meta.first_name} 👋`;
        displayName = meta.first_name + ' ' + meta.last_name;
    } else {
        headerTitle.textContent = 'لیست کارها';
    }
    
    dropdownUsername.textContent = displayName;
    authBtn.classList.add('active');
    
    // Sync logic
    await syncLocalTasksToCloud();
    fetchTasks();
}

async function syncLocalTasksToCloud() {
    const localTasks = JSON.parse(localStorage.getItem('localTasks') || '[]');
    if (localTasks.length > 0) {
        const formattedTasks = localTasks.map(t => ({
            task: t.task,
            is_complete: t.completed,
            user_id: currentUser.id
        }));

        await supabase.from('todos').insert(formattedTasks);
        localStorage.removeItem('localTasks'); // Clear after sync
        showAlert('تسک‌های آفلاین شما با موفقیت همگام‌سازی شدند.', 'همگام‌سازی');
    }
}

async function fetchTasks() {
    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

    if (data) {
        // مپ کردن ساختار دیتابیس به ساختار لوکال
        tasks = data.map(t => ({
            id: t.id,
            task: t.task, 
            completed: t.is_complete
        }));
        renderTasks();
    }
}

// --- Auth UI Handlers ---
authBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (currentUser) {
        userDropdown.classList.toggle('show');
    } else {
        openModal(authModal);
    }
});

window.addEventListener('click', () => {
    if (userDropdown.classList.contains('show')) userDropdown.classList.remove('show');
});

closeModal.addEventListener('click', () => closeModalFunc(authModal));

switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام کاربر جدید';
    submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
    authMsg.textContent = '';
    signupFields.style.display = isLoginMode ? 'none' : 'flex';
    forgotPassLink.style.display = isLoginMode ? 'block' : 'none';
});

submitAuthBtn.addEventListener('click', async () => {
    const email = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    const fname = fnameInput.value.trim();
    const lname = lnameInput.value.trim();

    if (!email || !pass) {
        authMsg.textContent = 'لطفا ایمیل و رمز عبور را وارد کنید';
        return;
    }

    authMsg.textContent = 'در حال پردازش...';
    
    if (isLoginMode) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
        if (error) {
            authMsg.textContent = 'خطا: ' + error.message;
        } else {
            handleLoginSuccess(data.user);
        }
    } else {
        // Signup
        if (!fname || !lname) {
            authMsg.textContent = 'نام و نام خانوادگی الزامی است';
            return;
        }
        const { data, error } = await supabase.auth.signUp({
            email, password: pass,
            options: { data: { first_name: fname, last_name: lname } } // ذخیره موقت در متادیتای auth
        });

        if (error) {
            authMsg.textContent = 'خطا: ' + error.message;
        } else {
            // ذخیره در جدول users_meta
            const user = data.user;
            if (user) {
                await supabase.from('users_meta').insert([{ 
                    user_id: user.id, 
                    first_name: fname, 
                    last_name: lname 
                }]);
                handleLoginSuccess(user);
            }
        }
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    authBtn.classList.remove('active');
    headerTitle.textContent = 'لیست کارها';
    tasks = [];
    taskList.innerHTML = ''; // پاک کردن تسک‌های کاربر قبلی
    // لود تسک‌های لوکال (که احتمالا خالی است یا کاربر جدید تسک می‌سازد)
    loadLocalTasks();
});

// Forgot Password
forgotPassLink.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = usernameInput.value.trim();
    if (!email) {
        authMsg.textContent = 'برای بازیابی رمز، لطفا ایمیل خود را وارد کنید.';
        return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.href,
    });
    if (error) authMsg.textContent = error.message;
    else showAlert('لینک بازیابی رمز عبور به ایمیل شما ارسال شد.');
});

// --- Edit Profile Logic ---
editProfileBtn.addEventListener('click', async () => {
    // پر کردن فیلدها با اطلاعات فعلی
    const { data: meta } = await supabase.from('users_meta').select('*').eq('user_id', currentUser.id).single();
    if (meta) {
        editFname.value = meta.first_name;
        editLname.value = meta.last_name;
    }
    editEmail.value = currentUser.email;
    openModal(profileModal);
});

closeProfileModal.addEventListener('click', () => closeModalFunc(profileModal));

saveProfileBtn.addEventListener('click', async () => {
    const newFname = editFname.value.trim();
    const newLname = editLname.value.trim();
    const newEmail = editEmail.value.trim();
    const newPass = editPassword.value.trim();

    saveProfileBtn.textContent = 'در حال ذخیره...';

    try {
        // 1. آپدیت متا (نام)
        if (newFname && newLname) {
            await supabase.from('users_meta').update({ 
                first_name: newFname, 
                last_name: newLname 
            }).eq('user_id', currentUser.id);
            
            // آپدیت UI
            headerTitle.textContent = `سلام ${newFname} 👋`;
            dropdownUsername.textContent = newFname + ' ' + newLname;
        }

        // 2. آپدیت ایمیل (اگر تغییر کرده باشد)
        if (newEmail && newEmail !== currentUser.email) {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;
            showAlert('ایمیل تغییر کرد. لطفا ایمیل جدید خود را تایید کنید.');
        }

        // 3. آپدیت پسورد
        if (newPass) {
            const { error } = await supabase.auth.updateUser({ password: newPass });
            if (error) throw error;
        }

        closeModalFunc(profileModal);
        showAlert('اطلاعات با موفقیت بروزرسانی شد.');

    } catch (error) {
        showAlert('خطا: ' + error.message);
    } finally {
        saveProfileBtn.textContent = 'ذخیره تغییرات';
    }
});

// --- Shared Modal Utils ---
function openModal(modal) {
    modal.classList.add('open');
}

function closeModalFunc(modal) {
    modal.classList.remove('open');
}

// Alert Functions
const alertModal = document.getElementById('alert-modal');
const alertTitle = document.getElementById('alert-title');
const alertText = document.getElementById('alert-text');
const alertOkBtn = document.getElementById('alert-ok-btn');
const alertCancelBtn = document.getElementById('alert-cancel-btn');

function showAlert(msg, title = 'پیام') {
    return new Promise((resolve) => {
        alertTitle.textContent = title;
        alertText.textContent = msg;
        alertOkBtn.textContent = 'باشه';
        alertCancelBtn.style.display = 'none';
        openModal(alertModal);
        alertOkBtn.onclick = () => {
            closeModalFunc(alertModal);
            resolve(true);
        };
    });
}

function showConfirm(msg) {
    return new Promise((resolve) => {
        alertTitle.textContent = 'تایید عملیات';
        alertText.textContent = msg;
        alertOkBtn.textContent = 'بله، حذف شود';
        alertCancelBtn.style.display = 'block';
        openModal(alertModal);
        
        alertOkBtn.onclick = () => {
            closeModalFunc(alertModal);
            resolve(true);
        };
        alertCancelBtn.onclick = () => {
            closeModalFunc(alertModal);
            resolve(false);
        };
    });
}
