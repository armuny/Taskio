// --- 1. تنظیمات Supabase ---
const supabaseUrl = 'https://zzbnbsmywmpmkqhbloro.supabase.co';
const supabaseKey = 'sb_publishable_gZqBqViTWwWnKoMgSxEH3g_BtiJJ3VE';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

let onlineUsername = null; // نام کاربری کاربر لاگین شده

// --- 2. انتخاب المان‌های صفحه ---
const input = document.getElementById('todo-input');
const addBtn = document.getElementById('add-btn');
const todoList = document.getElementById('todo-list');
const themeToggle = document.getElementById('theme-toggle');
const colorPicker = document.getElementById('color-picker');
const body = document.body;

// المان‌های مربوط به مودال و لاگین
const syncBtn = document.getElementById('sync-btn');
const modal = document.getElementById('sync-modal');
const closeModal = document.querySelector('.close-modal');
const usernameInput = document.getElementById('username-input');
const passwordInput = document.getElementById('password-input');
const loginBtn = document.getElementById('login-btn');
const registerBtn = document.getElementById('register-btn');
const switchAuthBtn = document.getElementById('switch-auth-btn');
const switchText = document.getElementById('switch-text');
const modalTitle = document.getElementById('modal-title');
const authError = document.getElementById('auth-error');

// وضعیت لاگین
const userStatusBar = document.getElementById('user-status-bar');
const loggedUserName = document.getElementById('logged-user-name');
const logoutBtn = document.getElementById('logout-btn');

// --- 3. مدیریت تم ---
let isDarkMode = localStorage.getItem('theme') === 'dark';
if (isDarkMode) body.classList.add('dark-mode');

function updateThemeIcon() {
    themeToggle.innerHTML = isDarkMode 
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>' 
        : '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>';
}
updateThemeIcon();

themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-mode');
    isDarkMode = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    updateThemeIcon();
});

const savedColor = localStorage.getItem('themeColor') || '#2563eb';
document.documentElement.style.setProperty('--primary', savedColor);
if(colorPicker) colorPicker.value = savedColor;

if(colorPicker) {
    colorPicker.addEventListener('input', (e) => {
        const color = e.target.value;
        document.documentElement.style.setProperty('--primary', color);
        localStorage.setItem('themeColor', color);
    });
}

// --- 4. منطق ورود / ثبت نام / خروج ---

// چک کردن لاگین قبلی
const savedUser = localStorage.getItem('activeUser');
if (savedUser) {
    setLoggedInUser(savedUser);
}

function setLoggedInUser(username) {
    onlineUsername = username;
    localStorage.setItem('activeUser', username);
    
    // آپدیت UI
    userStatusBar.style.display = 'flex';
    loggedUserName.textContent = `کاربر: ${username}`;
    syncBtn.style.color = 'var(--success-color)'; // آیکون ابر سبز شود
    
    renderTodos(); // بارگذاری لیست کاربر
}

function logoutUser() {
    onlineUsername = null;
    localStorage.removeItem('activeUser');
    
    // آپدیت UI
    userStatusBar.style.display = 'none';
    syncBtn.style.color = ''; // آیکون ابر عادی شود
    
    renderTodos(); // نمایش لیست آفلاین
}

logoutBtn.addEventListener('click', logoutUser);

// تغییر مودال بین ثبت نام و ورود
let isLoginMode = true;
switchAuthBtn.addEventListener('click', (e) => {
    e.preventDefault();
    isLoginMode = !isLoginMode;
    authError.textContent = '';
    
    if (isLoginMode) {
        modalTitle.textContent = 'ورود به حساب';
        loginBtn.style.display = 'block';
        registerBtn.style.display = 'none';
        switchText.textContent = 'حساب ندارید؟';
        switchAuthBtn.textContent = 'ثبت نام کنید';
    } else {
        modalTitle.textContent = 'ساخت حساب جدید';
        loginBtn.style.display = 'none';
        registerBtn.style.display = 'block';
        switchText.textContent = 'حساب دارید؟';
        switchAuthBtn.textContent = 'وارد شوید';
    }
});

// دکمه ثبت نام
registerBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        authError.textContent = 'نام کاربری و رمز عبور الزامی است.';
        return;
    }

    authError.style.color = 'orange';
    authError.textContent = 'در حال ثبت نام...';

    // چک کردن اینکه نام کاربری تکراری نباشد
    const { data: existingUser } = await supabase
        .from('users')
        .select('username')
        .eq('username', username)
        .single();

    if (existingUser) {
        authError.style.color = 'red';
        authError.textContent = 'این نام کاربری قبلاً گرفته شده است.';
        return;
    }

    // ساخت کاربر جدید
    const { error } = await supabase
        .from('users')
        .insert([{ username: username, password: password }]);

    if (error) {
        authError.style.color = 'red';
        authError.textContent = 'خطا در ثبت نام: ' + error.message;
    } else {
        authError.style.color = 'green';
        authError.textContent = 'ثبت نام موفق! وارد شدید.';
        setTimeout(() => {
            modal.style.display = "none";
            setLoggedInUser(username);
        }, 1000);
    }
});

// دکمه ورود
loginBtn.addEventListener('click', async () => {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    if (!username || !password) {
        authError.textContent = 'لطفاً همه فیلدها را پر کنید.';
        return;
    }

    authError.style.color = 'orange';
    authError.textContent = 'در حال بررسی...';

    // بررسی نام کاربری و رمز عبور
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

    if (error || !data) {
        authError.style.color = 'red';
        authError.textContent = 'نام کاربری یا رمز عبور اشتباه است.';
    } else {
        authError.style.color = 'green';
        authError.textContent = 'ورود موفق!';
        setTimeout(() => {
            modal.style.display = "none";
            setLoggedInUser(username);
        }, 1000);
    }
});

// --- 5. توابع اصلی لیست کارها ---

async function getTodos() {
    if (onlineUsername) {
        // آنلاین
        const { data, error } = await supabase
            .from('todos')
            .select('*')
            .eq('username', onlineUsername)
            .order('id', { ascending: true });
        
        return error ? [] : data;
    } else {
        // آفلاین
        const stored = localStorage.getItem('todos');
        return stored ? JSON.parse(stored) : [];
    }
}

async function renderTodos() {
    todoList.innerHTML = '<li style="justify-content:center; opacity:0.7; border:none;">در حال بارگذاری...</li>';
    
    const todos = await getTodos();
    todoList.innerHTML = '';

    const activeTodos = todos.filter(t => !t.completed);
    const completedTodos = todos.filter(t => t.completed);

    if (activeTodos.length === 0 && completedTodos.length === 0) {
       todoList.innerHTML = '<li style="justify-content:center; opacity:0.5; border:none;">لیست خالی است</li>';
       return;
    }

    activeTodos.forEach(todo => createTodoElement(todo));

    if (completedTodos.length > 0) {
        const separator = document.createElement('li');
        separator.className = 'list-separator';
        separator.textContent = 'انجام شده‌ها';
        todoList.appendChild(separator);
        completedTodos.forEach(todo => createTodoElement(todo));
    }
}

function createTodoElement(todo) {
    const li = document.createElement('li');
    
    const deleteBtn = document.createElement('button');
    deleteBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => removeTodo(todo.id); 

    const span = document.createElement('span');
    span.textContent = todo.text;
    if (todo.completed) span.classList.add('completed');

    const checkBtn = document.createElement('div');
    checkBtn.className = `check-circle ${todo.completed ? 'checked' : ''}`;
    checkBtn.onclick = () => toggleComplete(todo.id, todo);

    li.appendChild(deleteBtn);
    li.appendChild(span);
    li.appendChild(checkBtn);
    
    todoList.appendChild(li);
}

async function addTodo() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    if (onlineUsername) {
        await supabase.from('todos').insert([{ text: text, completed: false, username: onlineUsername }]);
    } else {
        const todos = JSON.parse(localStorage.getItem('todos') || '[]');
        todos.push({ id: Date.now(), text, completed: false });
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    renderTodos();
}

async function removeTodo(id) {
    if (onlineUsername) {
        await supabase.from('todos').delete().eq('id', id);
    } else {
        let todos = JSON.parse(localStorage.getItem('todos') || '[]');
        todos = todos.filter(t => t.id !== id);
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    renderTodos();
}

async function toggleComplete(id, todoObj) {
    const newStatus = !todoObj.completed;
    if (onlineUsername) {
        await supabase.from('todos').update({ completed: newStatus }).eq('id', id);
    } else {
        let todos = JSON.parse(localStorage.getItem('todos') || '[]');
        const target = todos.find(t => t.id === id);
        if (target) target.completed = newStatus;
        localStorage.setItem('todos', JSON.stringify(todos));
    }
    renderTodos();
}

// Event Listeners
addBtn.addEventListener('click', addTodo);
input.addEventListener('keypress', (e) => { if (e.key === 'Enter') addTodo(); });

syncBtn.onclick = () => { 
    if(!onlineUsername) {
        modal.style.display = "flex"; 
        authError.textContent = '';
    } else {
        // اگر لاگین باشد با کلیک روی ابر اتفاقی نمی‌افتد یا پیامی می‌دهد که لاگین هستید
        alert(`شما با نام کاربری ${onlineUsername} وارد شده‌اید.`);
    }
}

closeModal.onclick = () => { modal.style.display = "none"; }
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }

renderTodos();
