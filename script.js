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
    console.log('Current pathname:', path);
    
    // If it's a GitHub Pages URL (contains the repo name as a path segment)
    if (path.includes('/fsy2020.github.io')) {
        console.log('Running on GitHub Pages, using /fsy2020.github.io as base URL');
        return '/fsy2020.github.io';
    }
    // Otherwise, return an empty string for local development
    console.log('Running in local development mode, using empty base URL');
    return '';
}

const baseUrl = getBaseUrl();

// Function to fetch and parse markdown files
async function fetchMarkdownFile(directory, filename) {
    const filePath = `${baseUrl}/_posts/${directory}/${filename}`;
    console.log(`Fetching markdown file: ${filePath}`);
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            console.error(`HTTP error when fetching ${filePath}! status: ${response.status}`);
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log(`Successfully fetched ${filename}`);
        return text;
    } catch (error) {
        console.error(`Error fetching markdown file from ${filePath}: ${error}`);
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
    console.log('Starting blog loading process');
    if (blogsLoaded) {
        console.log('Blogs already loaded, skipping');
        return;
    }
    
    const blogContainer = document.getElementById('blog-list');
    if (!blogContainer) {
        console.error('blog-list container not found!');
        return;
    }
    
    try {
        blogContainer.innerHTML = '<div class="loading">Loading blogs...</div>';
        
        const indexPath = `${baseUrl}/_posts/blogs/index.json`;
        console.log(`Fetching blogs from: ${indexPath}`);
        const response = await fetch(indexPath);
        if (!response.ok) {
            console.error(`HTTP error when fetching blog index! Status: ${response.status}`);
            blogContainer.innerHTML = `<div class="error">Error loading blog index (${response.status}). <button id="retry-blogs">Retry</button></div>`;
            
            // Add retry button functionality
            document.getElementById('retry-blogs')?.addEventListener('click', () => {
                loadBlogs();
            });
            return;
        }
        const blogIndex = await response.json();
        console.log('Loaded blog index:', blogIndex);
        
        // Clear loading message
        blogContainer.innerHTML = '';
        
        if (blogIndex.length === 0) {
            blogContainer.innerHTML = '<div class="info">No blog posts found.</div>';
            blogsLoaded = true;
            return;
        }
        
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
                    console.log('Blog card added to container');
                } else {
                    console.error('Failed to create blog card');
                }
            } else {
                console.error(`Failed to fetch content for blog: ${post.filename}`);
                // Add an error card
                const errorCard = document.createElement('div');
                errorCard.className = 'blog-card error-card';
                errorCard.innerHTML = `
                    <h3>Error Loading: ${post.title || post.filename}</h3>
                    <div class="blog-meta">
                        <span class="date">${post.date || 'No date'}</span>
                    </div>
                    <div class="blog-preview">Failed to load content. Please try again later.</div>
                `;
                blogContainer.appendChild(errorCard);
            }
        }
        
        console.log('Blog posts loaded successfully');
        blogsLoaded = true;
    } catch (error) {
        console.error('Error loading blogs:', error);
        blogContainer.innerHTML = `<p>Failed to load blog posts. Please try again later. <button id="retry-blogs">Retry</button></p>`;
        
        // Add retry button functionality
        document.getElementById('retry-blogs')?.addEventListener('click', () => {
            loadBlogs();
        });
    }
}

// Function to load projects
async function loadProjects() {
    if (projectsLoaded) return;
    
    const projectContainer = document.getElementById('project-list');
    if (!projectContainer) return;
    
    try {
        projectContainer.innerHTML = '<div class="loading">Loading projects...</div>';
        
        const indexPath = `${baseUrl}/_posts/projects/index.json`;
        console.log(`Fetching projects from: ${indexPath}`);
        const response = await fetch(indexPath);
        if (!response.ok) {
            console.error(`HTTP error when fetching project index! Status: ${response.status}`);
            projectContainer.innerHTML = `<div class="error">Error loading project index (${response.status}). <button id="retry-projects">Retry</button></div>`;
            
            // Add retry button functionality
            document.getElementById('retry-projects')?.addEventListener('click', () => {
                loadProjects();
            });
            return;
        }
        const projectIndex = await response.json();
        console.log('Loaded project index:', projectIndex);
        
        // Clear loading message
        projectContainer.innerHTML = '';
        
        if (projectIndex.length === 0) {
            projectContainer.innerHTML = '<div class="info">No projects found.</div>';
            projectsLoaded = true;
            return;
        }
        
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
            } else {
                console.error(`Failed to fetch content for project: ${project.filename}`);
                // Add an error card
                const errorCard = document.createElement('div');
                errorCard.className = 'project-card error-card';
                errorCard.innerHTML = `
                    <h3>Error Loading: ${project.title || project.filename}</h3>
                    <div class="project-meta">
                        <span class="date">${project.date || 'No date'}</span>
                    </div>
                    <div class="project-preview">Failed to load content. Please try again later.</div>
                `;
                projectContainer.appendChild(errorCard);
            }
        }
        
        console.log('Projects loaded successfully');
        projectsLoaded = true;
    } catch (error) {
        console.error('Error loading projects:', error);
        projectContainer.innerHTML = `<p>Failed to load projects. Please try again later. <button id="retry-projects">Retry</button></p>`;
        
        // Add retry button functionality
        document.getElementById('retry-projects')?.addEventListener('click', () => {
            loadProjects();
        });
    }
}

// Function to load work experience
async function loadWork() {
    if (workLoaded) return;
    
    const workContainer = document.getElementById('work-list');
    if (!workContainer) return;
    
    try {
        workContainer.innerHTML = '<div class="loading">Loading work experience...</div>';
        
        const indexPath = `${baseUrl}/_posts/work/index.json`;
        console.log(`Fetching work experience from: ${indexPath}`);
        const response = await fetch(indexPath);
        if (!response.ok) {
            console.error(`HTTP error when fetching work index! Status: ${response.status}`);
            workContainer.innerHTML = `<div class="error">Error loading work experience (${response.status}). <button id="retry-work">Retry</button></div>`;
            
            // Add retry button functionality
            document.getElementById('retry-work')?.addEventListener('click', () => {
                loadWork();
            });
            return;
        }
        const workIndex = await response.json();
        console.log('Loaded work index:', workIndex);
        
        // Clear loading message
        workContainer.innerHTML = '';
        
        if (workIndex.length === 0) {
            workContainer.innerHTML = '<div class="info">No work experience found.</div>';
            workLoaded = true;
            return;
        }
        
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
            } else {
                console.error(`Failed to fetch content for work entry: ${entry.filename}`);
                // Add an error card
                const errorCard = document.createElement('div');
                errorCard.className = 'project-card error-card';
                errorCard.innerHTML = `
                    <h3>Error Loading: ${entry.title || entry.filename}</h3>
                    <div class="project-meta">
                        <span class="date">${entry.date || 'No date'}</span>
                    </div>
                    <div class="project-preview">Failed to load content. Please try again later.</div>
                `;
                workContainer.appendChild(errorCard);
            }
        }
        
        console.log('Work entries loaded successfully');
        workLoaded = true;
    } catch (error) {
        console.error('Error loading work experience:', error);
        workContainer.innerHTML = `<p>Failed to load work experience. Please try again later. <button id="retry-work">Retry</button></p>`;
        
        // Add retry button functionality
        document.getElementById('retry-work')?.addEventListener('click', () => {
            loadWork();
        });
    }
}

// Navigation functionality
function setActiveSection(sectionId) {
    console.log(`Setting active section: ${sectionId}`);
    if (currentSection === sectionId) {
        console.log('Section already active, skipping');
        return;
    }
    
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
    const template = contentTemplates[sectionId];
    console.log(`Template for ${sectionId}:`, template ? 'Found' : 'Not found');
    
    if (!template) {
        console.error(`No template found for section: ${sectionId}`);
        dynamicContent.innerHTML = `<div class="error">Error: Could not load ${sectionId} content.</div>`;
        return;
    }
    
    dynamicContent.innerHTML = template;
    
    // Load content if needed
    if (sectionId === 'blog') {
        blogList = document.getElementById('blog-list');
        console.log('Blog list element:', blogList ? 'Found' : 'Not found');
        if (!blogList) {
            console.error('Could not find blog-list element after setting template');
        } else {
            loadBlogs();
        }
    } else if (sectionId === 'projects') {
        projectList = document.getElementById('project-list');
        console.log('Project list element:', projectList ? 'Found' : 'Not found');
        if (!projectList) {
            console.error('Could not find project-list element after setting template');
        } else {
            loadProjects();
        }
    } else if (sectionId === 'work') {
        workList = document.getElementById('work-list');
        console.log('Work list element:', workList ? 'Found' : 'Not found');
        if (!workList) {
            console.error('Could not find work-list element after setting template');
        } else {
            loadWork();
        }
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
    
    // Debug info about environment
    console.log('Running in browser:', navigator.userAgent);
    console.log('Current URL:', window.location.href);
    console.log('Current pathname:', window.location.pathname);
    console.log('Base URL used:', baseUrl);
    
    // Try to directly fetch Markdown contents to verify file access
    testFetchFiles();
    
    initNavigation();
});

// Test function to directly fetch files
async function testFetchFiles() {
    console.log('Testing direct file access...');
    
    try {
        // Check if the _posts directory structure exists
        console.log(`Current base URL: ${baseUrl}`);
        console.log(`Testing paths relative to: ${window.location.origin}${baseUrl}`);
        
        // Test blogs index
        const blogIndexPath = `${baseUrl}/_posts/blogs/index.json`;
        console.log(`Testing blog index: ${blogIndexPath}`);
        const blogResponse = await fetch(blogIndexPath);
        console.log(`Blogs index fetch status: ${blogResponse.status} (${blogResponse.statusText})`);
        if (blogResponse.ok) {
            try {
                const blogData = await blogResponse.json();
                console.log('Blog index content:', blogData);
            } catch (parseError) {
                console.error('Failed to parse blog index JSON:', parseError);
                const blogText = await blogResponse.text();
                console.log('Raw blog index content:', blogText);
            }
        }
        
        // Test projects index
        const projectsIndexPath = `${baseUrl}/_posts/projects/index.json`;
        console.log(`Testing projects index: ${projectsIndexPath}`);
        const projectsResponse = await fetch(projectsIndexPath);
        console.log(`Projects index fetch status: ${projectsResponse.status} (${projectsResponse.statusText})`);
        if (projectsResponse.ok) {
            try {
                const projectsData = await projectsResponse.json();
                console.log('Projects index content:', projectsData);
            } catch (parseError) {
                console.error('Failed to parse projects index JSON:', parseError);
                const projectsText = await projectsResponse.text();
                console.log('Raw projects index content:', projectsText);
            }
        }
        
        // Test work index
        const workIndexPath = `${baseUrl}/_posts/work/index.json`;
        console.log(`Testing work index: ${workIndexPath}`);
        const workResponse = await fetch(workIndexPath);
        console.log(`Work index fetch status: ${workResponse.status} (${workResponse.statusText})`);
        if (workResponse.ok) {
            try {
                const workData = await workResponse.json();
                console.log('Work index content:', workData);
            } catch (parseError) {
                console.error('Failed to parse work index JSON:', parseError);
                const workText = await workResponse.text();
                console.log('Raw work index content:', workText);
            }
        }
        
        // Create diagnostic display
        if (!document.querySelector('.diagnostic-info')) {
            const debugSection = document.createElement('div');
            debugSection.className = 'diagnostic-info';
            debugSection.style.display = 'none';
            debugSection.innerHTML = `
                <h3>Diagnostic Information</h3>
                <p>Base URL: ${baseUrl}</p>
                <p>Window Location: ${window.location.href}</p>
                <p>Blog Index: ${blogResponse.status} ${blogResponse.statusText}</p>
                <p>Projects Index: ${projectsResponse.status} ${projectsResponse.statusText}</p>
                <p>Work Index: ${workResponse.status} ${workResponse.statusText}</p>
                <button id="toggle-debug-info">Show/Hide Diagnostic Info</button>
            `;
            
            document.body.appendChild(debugSection);
            
            document.getElementById('toggle-debug-info')?.addEventListener('click', () => {
                const display = debugSection.style.display;
                debugSection.style.display = display === 'none' ? 'block' : 'none';
            });
        }
    } catch (error) {
        console.error('File access test failed:', error);
    }
} 