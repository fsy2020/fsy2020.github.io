// Dark mode toggle
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;
const navLinks = document.querySelectorAll('.nav-link');
const homeSection = document.getElementById('home');
const dynamicContent = document.getElementById('dynamic-content');

// Content templates
const contentTemplates = {
    blog: `
        <section id="blog" class="content-section">
            <h2>Blog Posts</h2>
            <div id="blog-list" class="content-grid">
                <!-- Blog posts will be dynamically loaded here -->
            </div>
        </section>
    `,
    projects: `
        <section id="projects" class="content-section">
            <h2>Projects</h2>
            <div id="project-list" class="content-grid">
                <!-- Projects will be dynamically loaded here -->
            </div>
        </section>
    `,
    work: `
        <section id="work" class="content-section">
            <h2>Work Experience</h2>
            <div id="work-list" class="content-grid">
                <!-- Work experience will be dynamically loaded here -->
            </div>
        </section>
    `,
    about: `
        <section id="about" class="content-section">
            <h2>About Me</h2>
            <div class="about-content">
                <p>Welcome to my personal space where I share my thoughts and experiences...</p>
            </div>
        </section>
    `
};

// Check theme settings in local storage
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
    
    localStorage.setItem('theme', newTheme);
});

// Content functionality
let blogList;
let projectList;
let workList;

let blogPosts = [];
let projects = [];
let workEntries = [];
let blogsLoaded = false;
let projectsLoaded = false;
let workLoaded = false;
let currentSection = 'home';

// Get the base URL for assets, adjusting for GitHub Pages if necessary
function getBaseUrl() {
    // Get the current URL's path
    const path = window.location.pathname;
    // If it's a GitHub Pages URL (contains the repo name as a path segment)
    if (path.includes('/fsy2020.github.io/')) {
        // Return the root of the repo
        return '/fsy2020.github.io';
    }
    // Otherwise, return an empty string for local development
    return '';
}

const baseUrl = getBaseUrl();

// Function to fetch and parse markdown files
async function fetchMarkdownFile(directory, filename) {
    console.log(`Fetching markdown file: ${directory}/${filename}`);
    try {
        const response = await fetch(`${baseUrl}/_posts/${directory}/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log(`Successfully fetched ${filename}`);
        return text;
    } catch (error) {
        console.error(`Error fetching markdown file: ${error}`);
        return null;
    }
}

// Function to parse markdown frontmatter
function parseFrontmatter(markdown) {
    console.log('Parsing frontmatter');
    try {
        const match = markdown.match(/^---([\s\S]*?)---/);
        if (!match) {
            console.warn('No frontmatter found in markdown');
            return { content: markdown };
        }

        const frontmatter = {};
        const content = markdown.replace(/^---([\s\S]*?)---/, '').trim();
        
        match[1].split('\n').forEach(line => {
            const [key, ...value] = line.split(':');
            if (key && value) {
                frontmatter[key.trim()] = value.join(':').trim();
            }
        });

        console.log('Parsed frontmatter:', frontmatter);
        return { frontmatter, content };
    } catch (error) {
        console.error('Error parsing frontmatter:', error);
        return { content: markdown };
    }
}

// Function to display content cards
function createContentCard(postData, type) {
    console.log(`Creating ${type} card:`, postData);
    try {
        const { frontmatter, content } = postData;
        const card = document.createElement('div');
        card.className = `${type}-card`;
        
        // Use marked.parse with error handling
        let parsedContent;
        try {
            parsedContent = marked.parse(content.split('\n').slice(0, 3).join('\n'));
        } catch (error) {
            console.error('Error parsing markdown content:', error);
            parsedContent = content.split('\n').slice(0, 3).join('\n');
        }
        
        card.innerHTML = `
            <h3>${frontmatter.title || 'Untitled'}</h3>
            <div class="${type}-meta">
                <span class="date">${frontmatter.date || 'No date'}</span>
            </div>
            <div class="${type}-preview">${parsedContent}</div>
            <a href="#" class="read-more">Read Full ${type === 'blog' ? 'Post' : 'Project'}</a>
        `;
        
        // Add click event for the read more button
        const readMoreLink = card.querySelector('.read-more');
        readMoreLink.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Create modal for displaying full content
            const modal = document.createElement('div');
            modal.className = 'content-modal';
            
            // Parse the full markdown content
            let fullContent;
            try {
                fullContent = marked.parse(content);
            } catch (error) {
                console.error('Error parsing markdown content:', error);
                fullContent = content;
            }
            
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close-modal">&times;</span>
                    <h2>${frontmatter.title || 'Untitled'}</h2>
                    <div class="modal-meta">
                        <span class="date">${frontmatter.date || 'No date'}</span>
                    </div>
                    <div class="modal-body">${fullContent}</div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add close button functionality
            const closeButton = modal.querySelector('.close-modal');
            closeButton.addEventListener('click', () => {
                document.body.removeChild(modal);
                document.body.classList.remove('modal-open');
            });
            
            // Close when clicking outside the modal content
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    document.body.removeChild(modal);
                    document.body.classList.remove('modal-open');
                }
            });
            
            // Add modal styles dynamically
            if (!document.getElementById('modal-styles')) {
                const style = document.createElement('style');
                style.id = 'modal-styles';
                style.textContent = `
                    .content-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background-color: rgba(0, 0, 0, 0.7);
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        z-index: 1001;
                        overflow-y: auto;
                        padding: 20px;
                    }
                    .modal-content {
                        background-color: var(--blog-card-bg);
                        border-radius: var(--border-radius);
                        padding: 2rem;
                        width: 90%;
                        max-width: 800px;
                        max-height: 90vh;
                        overflow-y: auto;
                        position: relative;
                        box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                    }
                    .close-modal {
                        position: absolute;
                        top: 15px;
                        right: 15px;
                        font-size: 1.5rem;
                        cursor: pointer;
                        color: var(--blog-meta-color);
                    }
                    .close-modal:hover {
                        color: var(--primary-color);
                    }
                    .modal-meta {
                        font-size: 0.9rem;
                        color: var(--blog-meta-color);
                        margin-bottom: 1.5rem;
                    }
                    .modal-body {
                        line-height: 1.8;
                    }
                    .modal-body h1, .modal-body h2, .modal-body h3 {
                        color: var(--primary-color);
                        margin: 1.5rem 0 1rem;
                    }
                    .modal-body p {
                        margin-bottom: 1rem;
                    }
                    .modal-body pre {
                        background-color: var(--shadow-color);
                        padding: 1rem;
                        border-radius: 5px;
                        overflow-x: auto;
                        margin: 1rem 0;
                    }
                    .modal-body code {
                        font-family: monospace;
                    }
                    /* Prevent body scroll when modal is open */
                    body.modal-open {
                        overflow: hidden;
                    }
                `;
                document.head.appendChild(style);
            }
            
            // Prevent background scrolling
            document.body.classList.add('modal-open');
        });
        
        return card;
    } catch (error) {
        console.error(`Error creating ${type} card:`, error);
        return null;
    }
}

// Function to load blog posts
async function loadBlogs() {
    if (blogsLoaded) return;
    
    const blogContainer = document.getElementById('blog-list');
    if (!blogContainer) return;
    
    try {
        blogContainer.innerHTML = '<div class="loading">Loading blogs...</div>';
        
        const response = await fetch(`${baseUrl}/_posts/blogs/index.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const blogIndex = await response.json();
        console.log('Loaded blog index:', blogIndex);
        
        // Clear loading message
        blogContainer.innerHTML = '';
        
        for (const post of blogIndex) {
            console.log(`Processing blog: ${post.filename}`);
            const postContent = await fetchMarkdownFile('blogs', post.filename);
            if (postContent) {
                const postData = parseFrontmatter(postContent);
                // Ensure frontmatter exists
                postData.frontmatter = postData.frontmatter || {};
                // Use metadata from index if not in frontmatter
                if (!postData.frontmatter.title && post.title) {
                    postData.frontmatter.title = post.title;
                }
                if (!postData.frontmatter.date && post.date) {
                    postData.frontmatter.date = post.date;
                }
                
                blogPosts.push(postData);
                
                const card = createContentCard(postData, 'blog');
                if (card) {
                    blogContainer.appendChild(card);
                }
            }
        }
        
        console.log('Blog posts loaded successfully');
        blogsLoaded = true;
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogContainer.innerHTML = '<p>Failed to load blog posts. Please try again later.</p>';
    }
}

// Function to load projects
async function loadProjects() {
    if (projectsLoaded) return;
    
    const projectContainer = document.getElementById('project-list');
    if (!projectContainer) return;
    
    try {
        projectContainer.innerHTML = '<div class="loading">Loading projects...</div>';
        
        const response = await fetch(`${baseUrl}/_posts/projects/index.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const projectIndex = await response.json();
        console.log('Loaded project index:', projectIndex);
        
        // Clear loading message
        projectContainer.innerHTML = '';
        
        for (const project of projectIndex) {
            console.log(`Processing project: ${project.filename}`);
            const projectContent = await fetchMarkdownFile('projects', project.filename);
            if (projectContent) {
                const projectData = parseFrontmatter(projectContent);
                // Ensure frontmatter exists
                projectData.frontmatter = projectData.frontmatter || {};
                // Use metadata from index if not in frontmatter
                if (!projectData.frontmatter.title && project.title) {
                    projectData.frontmatter.title = project.title;
                }
                if (!projectData.frontmatter.date && project.date) {
                    projectData.frontmatter.date = project.date;
                }
                
                projects.push(projectData);
                
                const card = createContentCard(projectData, 'project');
                if (card) {
                    projectContainer.appendChild(card);
                }
            }
        }
        
        console.log('Projects loaded successfully');
        projectsLoaded = true;
    } catch (error) {
        console.error('Error loading projects:', error);
        projectContainer.innerHTML = '<p>Failed to load projects. Please try again later.</p>';
    }
}

// Function to load work experience
async function loadWork() {
    if (workLoaded) return;
    
    const workContainer = document.getElementById('work-list');
    if (!workContainer) return;
    
    try {
        workContainer.innerHTML = '<div class="loading">Loading work experience...</div>';
        
        const response = await fetch(`${baseUrl}/_posts/work/index.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const workIndex = await response.json();
        console.log('Loaded work index:', workIndex);
        
        // Clear loading message
        workContainer.innerHTML = '';
        
        for (const entry of workIndex) {
            console.log(`Processing work entry: ${entry.filename}`);
            const workContent = await fetchMarkdownFile('work', entry.filename);
            if (workContent) {
                const workData = parseFrontmatter(workContent);
                // Ensure frontmatter exists
                workData.frontmatter = workData.frontmatter || {};
                // Use metadata from index if not in frontmatter
                if (!workData.frontmatter.title && entry.title) {
                    workData.frontmatter.title = entry.title;
                }
                if (!workData.frontmatter.date && entry.date) {
                    workData.frontmatter.date = entry.date;
                }
                
                workEntries.push(workData);
                
                const card = createContentCard(workData, 'project');  // Reuse project card style
                if (card) {
                    workContainer.appendChild(card);
                }
            }
        }
        
        console.log('Work entries loaded successfully');
        workLoaded = true;
    } catch (error) {
        console.error('Error loading work experience:', error);
        workContainer.innerHTML = '<p>Failed to load work experience. Please try again later.</p>';
    }
}

// Navigation functionality
function setActiveSection(sectionId) {
    if (currentSection === sectionId) return;
    
    // Update active navigation link
    navLinks.forEach(link => {
        if (link.getAttribute('data-section') === sectionId) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
    
    // Handle home section separately
    if (sectionId === 'home') {
        homeSection.classList.add('active');
        dynamicContent.innerHTML = '';
        currentSection = 'home';
        return;
    } else {
        homeSection.classList.remove('active');
    }
    
    // Clear current content
    dynamicContent.innerHTML = '';
    
    // Add new content based on section
    dynamicContent.innerHTML = contentTemplates[sectionId] || '';
    
    // Load content if needed
    if (sectionId === 'blog') {
        blogList = document.getElementById('blog-list');
        loadBlogs();
    } else if (sectionId === 'projects') {
        projectList = document.getElementById('project-list');
        loadProjects();
    } else if (sectionId === 'work') {
        workList = document.getElementById('work-list');
        loadWork();
    }
    
    // Update current section
    currentSection = sectionId;
    
    // Update URL hash
    window.location.hash = sectionId;
    
    // Scroll to top of dynamic content
    dynamicContent.scrollIntoView({ behavior: 'smooth' });
}

// Initialize navigation
function initNavigation() {
    // Add click event to navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const section = link.getAttribute('data-section');
            setActiveSection(section);
        });
    });
    
    // Check URL hash on load
    let initialSection = 'home';
    if (window.location.hash) {
        const hashSection = window.location.hash.substring(1);
        // Verify the section exists in our templates
        if (hashSection === 'home' || contentTemplates[hashSection]) {
            initialSection = hashSection;
        }
    }
    
    // Set initial active section
    setActiveSection(initialSection);
}

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing content functionality');
    initNavigation();
}); 