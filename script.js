// --- پیکربندی ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = 'YOUR_SUPABASE_ANON_KEY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// --- متغیرهای وضعیت ---
let user = null;
let composerState = {
    priority: 'none',
    dueDate: null,
    tags: []
};

// --- انتخابگرهای DOM ---
const dom = {
    authContainer: document.getElementById('auth-container'),
    appContent: document.getElementById('app-content'),
    emailInput: document.getElementById('email'),
    passInput: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    
    // Composer
    composer: document.getElementById('task-composer'),
    cTitle: document.getElementById('composer-title'),
    cDesc: document.getElementById('composer-desc'),
    cSubmit: document.getElementById('composer-submit'),
    
    // Buttons & Popovers
    btnPriority: document.getElementById('btn-priority'),
    popPriority: document.getElementById('popover-priority'),
    labelPriority: document.getElementById('label-priority'),
    
    btnTags: document.getElementById('btn-tags'),
    popTags: document.getElementById('popover-tags'),
    tagInput: document.getElementById('tag-input'),
    tagsContainer: document.getElementById('tags-list-container'),
    
    btnDate: document.getElementById('btn-date'),
    labelDate: document.getElementById('label-date'),
    dateInputHidden: document.getElementById('date-input-hidden'),
    
    todoList: document.getElementById('todo-list')
};

// --- شروع برنامه ---
document.addEventListener('DOMContentLoaded', async () => {
    initKamaDatepicker();
    checkUser();
    setupEventListeners();
});

// --- مدیریت Composer ---
function setupEventListeners() {
    // 1. باز کردن Composer
    dom.cTitle.addEventListener('focus', () => {
        dom.composer.classList.add('active');
    });

    // 2. فعال‌سازی دکمه ثبت
    dom.cTitle.addEventListener('input', (e) => {
        if(e.target.value.trim().length > 0) {
            dom.cSubmit.classList.add('ready');
            dom.cSubmit.disabled = false;
        } else {
            dom.cSubmit.classList.remove('ready');
            dom.cSubmit.disabled = true;
        }
    });

    // 3. کلیک بیرون برای بستن (بسیار مهم)
    document.addEventListener('click', (e) => {
        const isClickInside = dom.composer.contains(e.target);
        
        // اگر کلیک بیرون بود و عنوان خالی بود -> ببند
        if (!isClickInside && dom.cTitle.value.trim() === '') {
            closeComposer();
        }
        
        // بستن پاپ‌اوورها اگر کلیک بیرون از دکمه‌ها بود
        if (!dom.btnPriority.contains(e.target) && !dom.popPriority.contains(e.target)) {
            dom.popPriority.classList.remove('show');
        }
        if (!dom.btnTags.contains(e.target) && !dom.popTags.contains(e.target)) {
            dom.popTags.classList.remove('show');
        }
    });

    // 4. تاگل پاپ‌اوور اولویت
    dom.btnPriority.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.popTags.classList.remove('show'); // بستن بقیه
        dom.popPriority.classList.toggle('show');
    });

    // 5. انتخاب اولویت
    document.querySelectorAll('.popover-item[data-p]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            const p = item.getAttribute('data-p');
            composerState.priority = p;
            updatePriorityUI(p);
            dom.popPriority.classList.remove('show');
        });
    });

    // 6. تاگل پاپ‌اوور تگ
    dom.btnTags.addEventListener('click', (e) => {
        e.stopPropagation();
        dom.popPriority.classList.remove('show');
        dom.popTags.classList.toggle('show');
        renderComposerTags();
    });

    // 7. افزودن تگ
    dom.tagInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && dom.tagInput.value.trim()) {
            e.preventDefault();
            composerState.tags.push(dom.tagInput.value.trim());
            dom.tagInput.value = '';
            renderComposerTags();
        }
    });

    // 8. ثبت تسک
    dom.cSubmit.addEventListener('click', addTask);

    // 9. لاگین/لاگ‌اوت
    dom.loginBtn.addEventListener('click', handleLogin);
    dom.logoutBtn.addEventListener('click', handleLogout);
}

function initKamaDatepicker() {
    kamaDatepicker('btn-date', {
        nextButtonIcon: "fas fa-arrow-circle-right",
        previousButtonIcon: "fas fa-arrow-circle-left",
        forceFarsiDigits: true,
        markToday: true,
        markHolidays: true,
        highlightSelectedDay: true,
        sync: true,
        gotoToday: true,
        
        // نکته کلیدی: وصل کردن به اینپوت مخفی برای دریافت مقدار
        next: 'date-input-hidden' 
    });

    // وقتی تاریخ در کاما انتخاب شد، ما باید UI را آپدیت کنیم
    // از آنجایی که کاما رویداد استاندارد change ندارد، از MutationObserver استفاده می‌کنیم
    const observer = new MutationObserver(() => {
        const val = dom.dateInputHidden.value;
        if(val) {
            composerState.dueDate = val;
            dom.labelDate.textContent = val;
            dom.btnDate.classList.add('active');
        }
    });
    observer.observe(dom.dateInputHidden, { attributes: true });
}

function closeComposer() {
    dom.composer.classList.remove('active');
    // ریست کردن فرم
    dom.cTitle.value = '';
    dom.cDesc.value = '';
    dom.cDesc.style.height = 'auto';
    dom.cSubmit.classList.remove('ready');
    dom.cSubmit.disabled = true;
    
    // ریست کردن استیت
    composerState = { priority: 'none', dueDate: null, tags: [] };
    updatePriorityUI('none');
    dom.labelDate.textContent = '';
    dom.btnDate.classList.remove('active');
    renderComposerTags();
}

function updatePriorityUI(priority) {
    dom.labelPriority.className = 'badge-dot'; // ریست کلاس‌ها
    dom.btnPriority.classList.remove('active');
    
    if (priority === 'high') dom.labelPriority.classList.add('p-high');
    else if (priority === 'medium') dom.labelPriority.classList.add('p-medium');
    else if (priority === 'low') dom.labelPriority.classList.add('p-low');
    
    if (priority !== 'none') dom.btnPriority.classList.add('active');
}

function renderComposerTags() {
    dom.tagsContainer.innerHTML = '';
    composerState.tags.forEach((tag, index) => {
        const span = document.createElement('span');
        span.className = 'tag-chip';
        span.innerHTML = `${tag} <i class="fas fa-times" onclick="removeTag(${index})"></i>`;
        dom.tagsContainer.appendChild(span);
    });
    
    if(composerState.tags.length > 0) dom.btnTags.classList.add('active');
    else dom.btnTags.classList.remove('active');
}

window.removeTag = (index) => {
    composerState.tags.splice(index, 1);
    renderComposerTags();
};

// --- عملیات دیتابیس ---

async function addTask() {
    const title = dom.cTitle.value.trim();
    const desc = dom.cDesc.value.trim();
    if (!title || !user) return;

    const { error } = await supabase.from('todos').insert({
        title: title,
        description: desc,
        user_id: user.id,
        is_complete: false,
        priority: composerState.priority,
        due_date: composerState.dueDate,
        tags: composerState.tags
    });

    if (error) alert('خطا در ذخیره: ' + error.message);
    else {
        closeComposer();
        fetchTodos();
    }
}

async function fetchTodos() {
    if (!user) return;
    
    // مرتب‌سازی: تکمیل‌نشده‌ها اول، سپس بر اساس اولویت (نیاز به لاجیک سمت کلاینت یا SQL پیچیده دارد)
    // اینجا ساده‌ترین حالت: اول جدیدترین‌ها
    const { data, error } = await supabase
        .from('todos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    if (error) console.error(error);
    else renderTodos(data);
}

function renderTodos(todos) {
    dom.todoList.innerHTML = '';
    
    // مرتب سازی دستی برای نمایش اولویت
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1, 'none': 0 };
    todos.sort((a, b) => {
        if (a.is_complete === b.is_complete) {
            // اگر وضعیت تکمیل یکی است، بر اساس اولویت
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        }
        return a.is_complete ? 1 : -1; // تکمیل شده‌ها بروند پایین
    });

    todos.forEach(todo => {
        const div = document.createElement('div');
        div.className = `task-item ${todo.is_complete ? 'completed' : ''}`;
        
        // ساخت تگ‌ها
        let tagsHtml = '';
        if(todo.tags && todo.tags.length) {
            todo.tags.forEach(t => tagsHtml += `<span class="meta-tag">#${t}</span>`);
        }

        // تاریخ
        let dateHtml = todo.due_date ? `<span><i class="far fa-calendar"></i> ${todo.due_date}</span>` : '';

        div.innerHTML = `
            <div class="task-priority-indicator p-${todo.priority}"></div>
            <input type="checkbox" ${todo.is_complete ? 'checked' : ''} onchange="toggleTask(${todo.id}, this.checked)">
            <div class="task-content">
                <span class="task-title">${todo.title}</span>
                ${todo.description ? `<span class="task-desc">${todo.description}</span>` : ''}
                <div class="task-meta">
                    ${dateHtml}
                    ${tagsHtml}
                </div>
            </div>
            <div class="task-actions">
                <button onclick="deleteTask(${todo.id})"><i class="fas fa-trash"></i></button>
            </div>
        `;
        dom.todoList.appendChild(div);
    });
}

window.toggleTask = async (id, status) => {
    await supabase.from('todos').update({ is_complete: status }).eq('id', id);
    fetchTodos();
};

window.deleteTask = async (id) => {
    if(confirm('حذف شود؟')) {
        await supabase.from('todos').delete().eq('id', id);
        fetchTodos();
    }
};

// --- AUTHENTICATION ---
async function handleLogin() {
    const email = dom.emailInput.value;
    const password = dom.passInput.value;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        // اگر یوزر نبود، ثبت نام کن
        const { data: upData, error: upError } = await supabase.auth.signUp({ email, password });
        if (upError) alert(upError.message);
        else alert('ایمیل تایید را چک کنید!');
    }
}

async function handleLogout() {
    await supabase.auth.signOut();
    user = null;
    updateUI();
}

async function checkUser() {
    const { data } = await supabase.auth.getSession();
    if (data.session) {
        user = data.session.user;
        fetchTodos();
    }
    updateUI();
    
    supabase.auth.onAuthStateChange((_event, session) => {
        user = session ? session.user : null;
        updateUI();
        if (user) fetchTodos();
    });
}

function updateUI() {
    if (user) {
        dom.authContainer.style.display = 'none';
        dom.appContent.style.display = 'block';
        document.getElementById('user-email').textContent = user.email;
    } else {
        dom.authContainer.style.display = 'block';
        dom.appContent.style.display = 'none';
    }
}
