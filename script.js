// Dark mode toggle
const themeSwitch = document.getElementById('theme-switch');
const body = document.body;

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

// Blog functionality
const blogList = document.getElementById('blog-list');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

// Function to fetch and parse markdown files
async function fetchMarkdownFile(filename) {
    try {
        const response = await fetch(`blogs/${filename}`);
        const text = await response.text();
        return text;
    } catch (error) {
        console.error('Error fetching markdown file:', error);
        return null;
    }
}

// Function to parse markdown frontmatter
function parseFrontmatter(markdown) {
    const match = markdown.match(/^---([\s\S]*?)---/);
    if (!match) return { content: markdown };

    const frontmatter = {};
    const content = markdown.replace(/^---([\s\S]*?)---/, '').trim();
    
    match[1].split('\n').forEach(line => {
        const [key, ...value] = line.split(':');
        if (key && value) {
            frontmatter[key.trim()] = value.join(':').trim();
        }
    });

    return { frontmatter, content };
}

// Function to create blog post card
function createBlogPostCard(postData) {
    const { frontmatter, content } = postData;
    const card = document.createElement('div');
    card.className = 'blog-card';
    
    card.innerHTML = `
        <h3>${frontmatter.title}</h3>
        <div class="blog-meta">
            <span class="date">${frontmatter.date}</span>
            <span class="tags">${frontmatter.tags}</span>
        </div>
        <div class="blog-preview">${marked.parse(content.split('\n').slice(0, 3).join('\n'))}</div>
        <a href="#" class="read-more">Read More</a>
    `;
    
    return card;
}

// Function to load blog posts
async function loadBlogPosts() {
    const post = await fetchMarkdownFile('first-post.md');
    if (post) {
        const postData = parseFrontmatter(post);
        const card = createBlogPostCard(postData);
        blogList.appendChild(card);
    }
}

// Search functionality
function performSearch(query) {
    const blogCards = document.querySelectorAll('.blog-card');
    query = query.toLowerCase();

    blogCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(query) ? 'block' : 'none';
    });
}

// Add search event listeners
searchButton.addEventListener('click', () => {
    performSearch(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        performSearch(searchInput.value);
    }
});

// Smooth scrolling
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

// Load blog posts when the page loads
loadBlogPosts(); 