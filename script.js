// 暗色模式切换
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;

// 检查本地存储中的主题设置
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    body.setAttribute('data-theme', savedTheme);
    themeSwitch.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
}

themeSwitch.addEventListener('click', () => {
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    body.setAttribute('data-theme', newTheme);
    themeSwitch.textContent = newTheme === 'dark' ? '☀️' : '🌙';
    
    // 保存主题设置到本地存储
    localStorage.setItem('theme', newTheme);
});

// 搜索功能
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const projectGrid = document.querySelector('.project-grid');

// 示例项目数据
const projects = [
    {
        title: '项目一',
        description: '这是项目一的描述...',
        link: '#'
    },
    {
        title: '项目二',
        description: '这是项目二的描述...',
        link: '#'
    },
    {
        title: '项目三',
        description: '这是项目三的描述...',
        link: '#'
    }
];

// 渲染项目卡片
function renderProjects(projectsToRender) {
    projectGrid.innerHTML = '';
    projectsToRender.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <h3>${project.title}</h3>
            <p>${project.description}</p>
            <a href="${project.link}" class="project-link">了解更多</a>
        `;
        projectGrid.appendChild(card);
    });
}

// 搜索功能实现
function searchProjects(query) {
    const filteredProjects = projects.filter(project => 
        project.title.toLowerCase().includes(query.toLowerCase()) ||
        project.description.toLowerCase().includes(query.toLowerCase())
    );
    renderProjects(filteredProjects);
}

// 添加搜索事件监听器
searchButton.addEventListener('click', () => {
    searchProjects(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        searchProjects(searchInput.value);
    }
});

// 初始化显示所有项目
renderProjects(projects);

// 平滑滚动
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
}); 