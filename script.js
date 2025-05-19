// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    const dynamicContent = document.getElementById('dynamic-content');
    const navLinks = document.querySelectorAll('.nav-link');
    const themeSwitch = document.getElementById('theme-switch');

    // Theme Switcher
    themeSwitch.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        themeSwitch.textContent = newTheme === 'light' ? '🌙' : '☀️';
        
        localStorage.setItem('theme', newTheme);
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.documentElement.setAttribute('data-theme', savedTheme);
        themeSwitch.textContent = savedTheme === 'light' ? '🌙' : '☀️';
    }

    // Navigation
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            const section = link.getAttribute('data-section');
            
            // Handle home section (always visible)
            if (section === 'home') {
                document.getElementById('home').classList.add('active');
                dynamicContent.innerHTML = '';
                return;
            }
            
            // Hide home section for other sections
            document.getElementById('home').classList.remove('active');
            
            // Load content based on section
            loadContent(section);
        });
    });

    // Content Loading Functions
    async function loadContent(section) {
        dynamicContent.innerHTML = '<div class="loading">Loading...</div>';
        
        try {
            switch(section) {
                case 'blog':
                    await loadBlogPosts();
                    break;
                case 'projects':
                    await loadProjects();
                    break;
                case 'work':
                    await loadWorkContent();
                    break;
                case 'about':
                    loadAboutContent();
                    break;
                default:
                    showError('Invalid section requested');
            }
        } catch (error) {
            showError('Failed to load content', error);
        }
    }

    async function loadBlogPosts() {
        try {
            const response = await fetch('./_posts/blogs/index.json');
            const posts = await response.json();
            
            renderContent('Blog Posts', posts, 'blogs');
        } catch (error) {
            showError('Failed to load blog posts', error);
        }
    }

    async function loadProjects() {
        try {
            const response = await fetch('./_posts/projects/index.json');
            const projects = await response.json();
            
            if (projects.length === 0) {
                showError('No projects found');
                return;
            }
            
            // Get the first project to display
            const project = projects[0];
            const content = await fetchPost('projects', project.filename);
            
            // Remove front matter from content
            const cleanContent = content.replace(/---[\s\S]*?---/, '').trim();
            
            // Parse markdown to HTML
            const htmlContent = marked.parse(cleanContent);
            
            dynamicContent.innerHTML = `
                <section id="projects" class="content-section active">
                    <h2>Projects</h2>
                    <div class="about-content">
                        ${htmlContent}
                    </div>
                </section>
            `;
        } catch (error) {
            showError('Failed to load projects', error);
        }
    }

    async function loadWorkContent() {
        try {
            const response = await fetch('./_posts/work/index.json');
            const workItems = await response.json();
            
            if (workItems.length === 0) {
                showError('No work experience found');
                return;
            }
            
            // Get the first work experience to display
            const work = workItems[0];
            const content = await fetchPost('work', work.filename);
            
            // Remove front matter from content
            const cleanContent = content.replace(/---[\s\S]*?---/, '').trim();
            
            // Parse markdown to HTML
            const htmlContent = marked.parse(cleanContent);
            
            dynamicContent.innerHTML = `
                <section id="work" class="content-section active">
                    <h2>Work Experience</h2>
                    <div class="about-content">
                        ${htmlContent}
                    </div>
                </section>
            `;
        } catch (error) {
            showError('Failed to load work content', error);
        }
    }

    function loadAboutContent() {
        dynamicContent.innerHTML = `
            <section id="about" class="content-section active">
                <h2>About Me</h2>
                <div class="about-content">
                    <p>
                        Welcome to my personal website! I'm passionate about technology, writing, and sharing knowledge.
                        This space serves as a portfolio of my work and a platform for my thoughts.
                    </p>
                    <p>
                        Feel free to explore my blog posts, projects, and work experience. Don't hesitate to reach out if you have any questions or would like to collaborate!
                    </p>
                </div>
            </section>
        `;
    }

    async function renderContent(title, items, type) {
        let html = `
            <section id="${type}" class="content-section active">
                <h2>${title}</h2>
                <div class="content-grid">
        `;

        // Sort items by date (newest first)
        items.sort((a, b) => new Date(b.date) - new Date(a.date));

        for (const item of items) {
            // Get post content and extract preview
            const postContent = await fetchPost(type, item.filename);
            const preview = extractPreview(postContent, 150);
            
            // Format the date
            const date = new Date(item.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Create card HTML
            html += `
                <div class="${type === 'blogs' ? 'blog-card' : 'project-card'}" data-filename="${item.filename}">
                    <h3>${item.title}</h3>
                    <div class="${type === 'blogs' ? 'blog-meta' : 'project-meta'}">
                        <span class="date">${formattedDate}</span>
                        ${item.tags ? `<span class="tags">${item.tags.join(', ')}</span>` : ''}
                    </div>
                    <div class="${type === 'blogs' ? 'blog-preview' : 'project-preview'}">
                        ${preview}
                    </div>
                    <a href="#" class="read-more" data-type="${type}" data-file="${item.filename}">Read More</a>
                </div>
            `;
        }

        html += `
                </div>
            </section>
        `;

        dynamicContent.innerHTML = html;

        // Add event listeners to "Read More" links
        document.querySelectorAll('.read-more').forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();
                const type = link.getAttribute('data-type');
                const filename = link.getAttribute('data-file');
                
                await displayFullPost(type, filename);
            });
        });
    }

    async function fetchPost(type, filename) {
        try {
            const response = await fetch(`./_posts/${type}/${filename}`);
            return await response.text();
        } catch (error) {
            console.error(`Error fetching post: ${error}`);
            return '';
        }
    }

    function extractPreview(markdown, length) {
        // Remove front matter
        let content = markdown.replace(/---[\s\S]*?---/, '').trim();
        
        // Remove markdown headings
        content = content.replace(/#+\s+.*\n/g, '');
        
        // Remove any other markdown formatting that might interfere
        content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');  // Convert links to just text
        
        // Truncate to specified length
        if (content.length > length) {
            content = content.substring(0, length) + '...';
        }
        
        return content;
    }

    async function displayFullPost(type, filename) {
        try {
            const content = await fetchPost(type, filename);
            const response = await fetch(`./_posts/${type}/index.json`);
            const items = await response.json();
            const postInfo = items.find(item => item.filename === filename);
            
            if (!postInfo) {
                throw new Error('Post information not found');
            }
            
            // Format the date
            const date = new Date(postInfo.date);
            const formattedDate = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
            
            // Remove front matter from content
            const cleanContent = content.replace(/---[\s\S]*?---/, '').trim();
            
            // Parse markdown to HTML
            const htmlContent = marked.parse(cleanContent);
            
            // Create post container
            let html = `
                <section id="full-post" class="content-section active">
                    <div class="post-header">
                        <button class="back-button" data-type="${type}">← Back to ${type}</button>
                        <h1>${postInfo.title}</h1>
                        <div class="post-meta">
                            <span class="date">${formattedDate}</span>
                            ${postInfo.tags ? `<span class="tags">${postInfo.tags.join(', ')}</span>` : ''}
                        </div>
                    </div>
                    <div class="post-content">
                        ${htmlContent}
                    </div>
                </section>
            `;
            
            dynamicContent.innerHTML = html;
            
            // Add event listener to back button
            document.querySelector('.back-button').addEventListener('click', (e) => {
                e.preventDefault();
                // Map 'blogs' to 'blog' for the loadContent function
                const sectionType = type === 'blogs' ? 'blog' : 
                                 type === 'projects' ? 'projects' : 
                                 type === 'work' ? 'work' : type;
                loadContent(sectionType);
            });
        } catch (error) {
            showError('Failed to load post', error);
        }
    }

    function showError(message, error = null) {
        console.error(message, error);
        dynamicContent.innerHTML = `
            <div class="error">
                <h3>Error</h3>
                <p>${message}</p>
                ${error ? `<p class="error-details">${error.message}</p>` : ''}
                <button onclick="location.reload()">Retry</button>
            </div>
        `;
    }

    // Load home section by default
    document.querySelector('.nav-link[data-section="home"]').click();
});
