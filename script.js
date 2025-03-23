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
const tagFilters = document.getElementById('tag-filters');
const clearFilters = document.getElementById('clear-filters');
const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');

let allTags = new Set();
let activeTags = new Set();
let blogPosts = [];

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

    // Parse tags if they exist
    if (frontmatter.tags) {
        frontmatter.tags = frontmatter.tags
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(tag => tag.trim());
    }

    return { frontmatter, content };
}

// Function to create blog post card
function createBlogPostCard(postData) {
    const { frontmatter, content } = postData;
    const card = document.createElement('div');
    card.className = 'blog-card';
    
    const tagButtons = frontmatter.tags
        ? frontmatter.tags
            .map(tag => `<button class="tag">${tag}</button>`)
            .join('')
        : '';
    
    card.innerHTML = `
        <h3>${frontmatter.title}</h3>
        <div class="blog-meta">
            <span class="date">${frontmatter.date}</span>
            <div class="tags">${tagButtons}</div>
        </div>
        <div class="blog-preview">${marked.parse(content.split('\n').slice(0, 3).join('\n'))}</div>
        <a href="#" class="read-more">Read More</a>
    `;
    
    return card;
}

// Function to update tag filters
function updateTagFilters() {
    tagFilters.innerHTML = Array.from(allTags)
        .map(tag => `<button class="tag ${activeTags.has(tag) ? 'active' : ''}">${tag}</button>`)
        .join('');
    
    // Add click event listeners to tags
    tagFilters.querySelectorAll('.tag').forEach(tagButton => {
        tagButton.addEventListener('click', () => {
            const tag = tagButton.textContent;
            if (activeTags.has(tag)) {
                activeTags.delete(tag);
            } else {
                activeTags.add(tag);
            }
            filterBlogPosts();
            updateTagFilters();
        });
    });
}

// Function to filter blog posts
function filterBlogPosts() {
    const searchQuery = searchInput.value.toLowerCase();
    const blogCards = document.querySelectorAll('.blog-card');
    
    blogCards.forEach(card => {
        const text = card.textContent.toLowerCase();
        const cardTags = Array.from(card.querySelectorAll('.tags .tag'))
            .map(tag => tag.textContent);
        
        const matchesSearch = text.includes(searchQuery);
        const matchesTags = activeTags.size === 0 || 
            cardTags.some(tag => activeTags.has(tag));
        
        card.style.display = matchesSearch && matchesTags ? 'block' : 'none';
    });
}

// Function to load blog posts
async function loadBlogPosts() {
    const posts = ['first-post.md']; // Add more posts here as they're created
    
    for (const filename of posts) {
        const post = await fetchMarkdownFile(filename);
        if (post) {
            const postData = parseFrontmatter(post);
            blogPosts.push(postData);
            
            // Collect all unique tags
            if (postData.frontmatter.tags) {
                postData.frontmatter.tags.forEach(tag => allTags.add(tag));
            }
            
            const card = createBlogPostCard(postData);
            blogList.appendChild(card);
        }
    }
    
    updateTagFilters();
}

// Clear filters
clearFilters.addEventListener('click', () => {
    activeTags.clear();
    searchInput.value = '';
    filterBlogPosts();
    updateTagFilters();
});

// Add search event listeners
searchButton.addEventListener('click', () => {
    filterBlogPosts();
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        filterBlogPosts();
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