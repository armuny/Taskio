// --- تنظیمات Supabase ---
const SUPABASE_URL = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const SUPABASE_KEY = 'sb_publishable_gZqBqViTWwWnKoMgSxEH3g_BtiJJ3VE';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// --- المان‌های HTML ---
const todoInput = document.getElementById('todoInput');
const addTodoBtn = document.getElementById('addTodoBtn');
const todoList = document.getElementById('todoList');
const emptyState = document.getElementById('emptyState');
const themeToggle = document.getElementById('themeToggle');

// المان‌های لاگین و مودال
const loginBtnHeader = document.getElementById('loginBtnHeader');
const loginModal = document.getElementById('loginModal');
const closeModal = document.getElementById('closeModal');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const submitLoginBtn = document.getElementById('submitLoginBtn');
const submitSignupBtn = document.getElementById('submitSignupBtn');
const authMessage = document.getElementById('authMessage');
const userStatusDot = document.getElementById('userStatusDot');
const logoutBtn = document.getElementById('logoutBtn');

let user = null;
let localTodos = JSON.parse(localStorage.getItem('guest_todos')) || [];

// --- شروع برنامه ---
window.addEventListener('DOMContentLoaded', async () => {
    loadTheme();
    
    // بررسی وضعیت لاگین در سوپابیس
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        handleUserLoggedIn(data.session.user);
    } else {
        handleUserGuest();
    }
});

// --- مدیریت وضعیت کاربر ---
function handleUserLoggedIn(userData) {
    user = userData;
    userStatusDot.className = 'status-dot connected'; // سبز
    loginModal.style.display = 'none';
    loginBtnHeader.innerHTML = '👤'; // تغییر آیکون ابر به آدمک
    logoutBtn.style.display = 'block';
    
    syncLocalToCloud().then(() => {
        fetchTodos();
    });
}

function handleUserGuest() {
    user = null;
    userStatusDot.className = 'status-dot disconnected'; // خاکستری/قرمز
    loginBtnHeader.innerHTML = '☁️'; // آیکون ابر برای مهمان
    logoutBtn.style.display = 'none';
    renderTodos(localTodos);
}

// --- همگام‌سازی (انتقال لوکال به دیتابیس) ---
async function syncLocalToCloud() {
    if (localTodos.length > 0) {
        // آماده‌سازی داده‌ها برای ارسال به دیتابیس
        const records = localTodos.map(todo => ({
            text: todo.text,
            is_completed: todo.is_completed,
            user_id: user.id
        }));

        // ارسال به سوپابیس
        const { error } = await supabase.from('todos').insert(records);
        
        if (!error) {
            // اگر موفق بود، لوکال را پاک کن
            localStorage.removeItem('guest_todos');
            localTodos = [];
        }
    }
}

// --- لاگین / ثبت نام ---
loginBtnHeader.addEventListener('click', () => {
    if(!user) {
        loginModal.style.display = 'flex';
        authMessage.textContent = '';
    }
});

closeModal.addEventListener('click', () => loginModal.style.display = 'none');

// کلیک بیرون مودال برای بستن
window.onclick = (event) => {
    if (event.target == loginModal) loginModal.style.display = 'none';
}

submitLoginBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if(!email || !password) return;

    authMessage.textContent = "در حال ورود...";
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        authMessage.textContent = "خطا: " + error.message;
        authMessage.style.color = "red";
    } else {
        handleUserLoggedIn(data.user);
    }
});

submitSignupBtn.addEventListener('click', async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if(!email || !password) return;

    authMessage.textContent = "در حال ثبت نام...";
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        authMessage.textContent = error.message;
        authMessage.style.color = "red";
    } else {
        authMessage.textContent = "ثبت نام انجام شد! وارد شوید.";
        authMessage.style.color = "green";
        if(data.session) handleUserLoggedIn(data.session.user);
    }
});

logoutBtn.addEventListener('click', async () => {
    await supabase.auth.signOut();
    handleUserGuest();
});

// --- عملیات اصلی (CRUD) ---

// ۱. افزودن
addTodoBtn.addEventListener('click', async () => {
    const text = todoInput.value.trim();
    if (!text) return;

    addTodoBtn.textContent = "...";

    if (user) {
        // ذخیره در دیتابیس
        const { error } = await supabase.from('todos').insert([{ text, user_id: user.id }]);
        if (!error) fetchTodos();
    } else {
        // ذخیره در لوکال
        const newTodo = { id: Date.now(), text, is_completed: false };
        localTodos.unshift(newTodo);
        saveLocal();
        renderTodos(localTodos);
    }

    todoInput.value = '';
    addTodoBtn.textContent = 'افزودن';
});

todoInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTodoBtn.click();
});

// ۲. دریافت لیست
async function fetchTodos() {
    if (user) {
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) renderTodos(data);
    } else {
        renderTodos(localTodos);
    }
}

// ۳. نمایش لیست
function renderTodos(todos) {
    todoList.innerHTML = '';
    if (todos.length === 0) {
        emptyState.style.display = 'block';
    } else {
        emptyState.style.display = 'none';
        todos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item ${todo.is_completed ? 'completed' : ''}`;
            li.innerHTML = `
                <div class="todo-left" onclick="toggleTask('${todo.id}', ${todo.is_completed})">
                    <div class="check-circle">✔</div>
                    <span>${todo.text}</span>
                </div>
                <button class="delete-icon" onclick="deleteTask('${todo.id}')">🗑</button>
            `;
            todoList.appendChild(li);
        });
    }
}

// ۴. تغییر وضعیت
window.toggleTask = async (id, currentStatus) => {
    if (user) {
        await supabase.from('todos').update({ is_completed: !currentStatus }).eq('id', id);
        fetchTodos();
    } else {
        const todo = localTodos.find(t => t.id == id);
        if (todo) {
            todo.is_completed = !currentStatus;
            saveLocal();
            renderTodos(localTodos);
        }
    }
};

// ۵. حذف
window.deleteTask = async (id) => {
    if (user) {
        await supabase.from('todos').delete().eq('id', id);
        fetchTodos();
    } else {
        localTodos = localTodos.filter(t => t.id != id);
        saveLocal();
        renderTodos(localTodos);
    }
};

function saveLocal() {
    localStorage.setItem('guest_todos', JSON.stringify(localTodos));
}

// --- تم (Dark Mode) ---
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    updateThemeIcon();
});

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') document.body.classList.add('dark-mode');
    updateThemeIcon();
}

function updateThemeIcon() {
    const isDark = document.body.classList.contains('dark-mode');
    // آیکون ماه یا خورشید
    themeToggle.innerHTML = isDark ? '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' 
                                   : '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}
