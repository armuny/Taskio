// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp6Ym5ic215d21wbWtxaGJsb3JvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxODg1NjMsImV4cCI6MjA3OTc2NDU2M30.efyCqT9PLhy-1IPyMAadIzSjmhnIXEMZDOKN4F-P1_M';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- متغیرها ---
let tasks = [];
let currentUser = null;
let isLoginMode = true; // حالت پیش‌فرض مودال: ورود

// --- انتخابگرها (Selectors) ---
const todoInput = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const colorPicker = document.getElementById('color-picker');
const authBtn = document.getElementById('auth-btn');
const authModal = document.getElementById('auth-modal');
const closeModal = document.querySelector('.close-modal');
const submitAuthBtn = document.getElementById('submit-auth-btn');
const switchAuthLink = document.getElementById('switch-auth-link');
const modalTitle = document.getElementById('modal-title');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const authMsg = document.getElementById('auth-msg');
const userStatusBar = document.getElementById('user-status-bar');
const userDisplayName = document.getElementById('user-display-name');
const logoutBtn = document.getElementById('logout-btn');

// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    loadLocalSettings();
    
    // چک کردن سشن کاربر
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        setCurrentUser(session.user);
    } else {
        // اگر لاگین نبود، لوکال را بارگذاری کن
        const localData = localStorage.getItem('todo_local_tasks');
        if (localData) tasks = JSON.parse(localData);
        renderTasks();
    }
});

function setCurrentUser(user) {
    currentUser = user;
    userStatusBar.style.display = 'flex';
    userDisplayName.textContent = user.user_metadata.username || 'کاربر';
    authBtn.style.color = '#10b981'; // سبز شدن آیکون
    fetchTasks();
}

// --- توابع دیتابیس و تسک ---

// دریافت تسک‌ها از Supabase
async function fetchTasks() {
    todoList.innerHTML = '<div style="text-align:center; padding:20px;">در حال دریافت...</div>';
    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

    if (!error) {
        tasks = data;
        renderTasks();
    }
}

// افزودن تسک
addBtn.addEventListener('click', addNewTask);
todoInput.addEventListener('keypress', (e) => e.key === 'Enter' && addNewTask());

async function addNewTask() {
    const text = todoInput.value.trim();
    if (!text) return;

    const tempId = Date.now();
    const newTask = { id: tempId, task: text, is_completed: false };

    // نمایش فوری (Optimistic UI)
    tasks.unshift(newTask);
    renderTasks();
    todoInput.value = '';

    if (currentUser) {
        const { data, error } = await supabase
            .from('todos')
            .insert([{ task: text, user_id: currentUser.id }])
            .select();
        
        if (!error && data) {
            // بروزرسانی ID موقت با ID واقعی دیتابیس
            const index = tasks.findIndex(t => t.id === tempId);
            if (index !== -1) tasks[index] = data[0];
        }
    } else {
        saveLocal();
    }
}

// تغییر وضعیت (تیک زدن)
async function toggleTask(id) {
    const index = tasks.findIndex(t => t.id === id);
    if (index === -1) return;

    const newState = !tasks[index].is_completed;
    tasks[index].is_completed = newState;
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').update({ is_completed: newState }).eq('id', id);
    } else {
        saveLocal();
    }
}

// حذف تسک
async function deleteTask(id) {
    if (!confirm('آیا مطمئن هستید؟')) return;

    tasks = tasks.filter(t => t.id !== id);
    renderTasks();

    if (currentUser) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        saveLocal();
    }
}

// ذخیره در لوکال استوریج (برای مهمان)
function saveLocal() {
    localStorage.setItem('todo_local_tasks', JSON.stringify(tasks));
}

// --- رندر کردن لیست (UI) ---
function renderTasks() {
    todoList.innerHTML = '';
    
    const active = tasks.filter(t => !t.is_completed);
    const completed = tasks.filter(t => t.is_completed);

    if (active.length === 0 && completed.length === 0) {
        todoList.innerHTML = '<div style="text-align:center; opacity:0.6; margin-top:20px;">لیست خالی است</div>';
        return;
    }

    // رندر فعال‌ها
    active.forEach(task => createEl(task));

    // جداکننده و تکمیل شده‌ها
    if (completed.length > 0) {
        if (active.length > 0) {
            const sep = document.createElement('div');
            sep.className = 'list-separator';
            sep.textContent = 'تکمیل شده';
            todoList.appendChild(sep);
        }
        completed.forEach(task => createEl(task));
    }
}

function createEl(task) {
    const li = document.createElement('li');
    if (task.is_completed) li.classList.add('completed');

    li.innerHTML = `
        <div class="check-circle ${task.is_completed ? 'checked' : ''}" onclick="toggleTask(${task.id})"></div>
        <span>${task.task}</span>
        <button class="delete-btn" onclick="deleteTask(${task.id})">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
        </button>
    `;
    todoList.appendChild(li);
}

// --- مدیریت تم و رنگ ---
function loadLocalSettings() {
    const theme = localStorage.getItem('theme_color');
    const isDark = localStorage.getItem('dark_mode') === 'true';
    
    if (theme) {
        document.documentElement.style.setProperty('--primary', theme);
        colorPicker.value = theme;
    }
    
    if (isDark) {
        document.body.classList.add('dark-mode');
        themeToggle.textContent = '☀️';
    } else {
        themeToggle.textContent = '🌙';
    }
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = isDark ? '☀️' : '🌙';
    localStorage.setItem('dark_mode', isDark);
});

colorPicker.addEventListener('input', (e) => {
    const color = e.target.value;
    document.documentElement.style.setProperty('--primary', color);
    localStorage.setItem('theme_color', color);
});

// --- احراز هویت (Auth) ---
authBtn.addEventListener('click', () => {
    if (currentUser) return; // اگر لاگین بود کاری نکن (دکمه خروج جداست)
    authModal.style.display = 'flex';
});

closeModal.addEventListener('click', () => authModal.style.display = 'none');
window.onclick = (e) => { if (e.target == authModal) authModal.style.display = 'none'; };

// سوئیچ بین لاگین و ثبت نام
switchAuthLink.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    modalTitle.textContent = isLoginMode ? 'ورود به حساب' : 'ثبت نام کاربر جدید';
    submitAuthBtn.textContent = isLoginMode ? 'ورود' : 'ثبت نام';
    document.getElementById('switch-text').textContent = isLoginMode ? 'حساب ندارید؟' : 'حساب دارید؟';
    switchAuthLink.textContent = isLoginMode ? 'ثبت نام کنید' : 'وارد شوید';
    authMsg.textContent = '';
});

// لاجیک اصلی ورود/ثبت نام
submitAuthBtn.addEventListener('click', async () => {
    const user = usernameInput.value.trim();
    const pass = passwordInput.value.trim();
    
    if (user.length < 3 || pass.length < 4) {
        authMsg.textContent = 'نام کاربری حداقل ۳ و رمز ۴ کاراکتر';
        return;
    }

    authMsg.textContent = 'لطفا صبر کنید...';
    authMsg.style.color = 'var(--text-color)';

    // ساخت ایمیل فیک برای دور زدن نیاز به ایمیل واقعی
    const fakeEmail = `${user}@example.com`;

    let result;
    if (isLoginMode) {
        result = await supabase.auth.signInWithPassword({
            email: fakeEmail,
            password: pass
        });
    } else {
        result = await supabase.auth.signUp({
            email: fakeEmail,
            password: pass,
            options: { data: { username: user } }
        });
    }

    const { data, error } = result;

    if (error) {
        authMsg.style.color = 'red';
        authMsg.textContent = translateError(error.message);
    } else {
        if (!isLoginMode && !data.session) {
            authMsg.textContent = 'ثبت نام انجام شد! لطفا وارد شوید.'; // در حالتی که تایید ایمیل روشن باشد
        } else {
            authModal.style.display = 'none';
            setCurrentUser(data.user);
            usernameInput.value = '';
            passwordInput.value = '';
            alert(isLoginMode ? 'خوش آمدید!' : 'حساب ساخته شد و وارد شدید!');
        }
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    currentUser = null;
    tasks = []; // خالی کردن تسک‌های کاربر قبلی
    userStatusBar.style.display = 'none';
    authBtn.style.color = 'var(--text-color)';
    
    // بارگذاری مجدد تسک‌های لوکال
    const localData = localStorage.getItem('todo_local_tasks');
    if (localData) tasks = JSON.parse(localData);
    renderTasks();
});

function translateError(msg) {
    if (msg.includes('Invalid login')) return 'نام کاربری یا رمز اشتباه است';
    if (msg.includes('already registered')) return 'این نام کاربری قبلا گرفته شده';
    return msg;
}
