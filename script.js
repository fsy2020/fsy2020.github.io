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
    console.log(`Fetching markdown file: ${filename}`);
    try {
        const response = await fetch(`blogs/${filename}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const text = await response.text();
        console.log(`Successfully fetched ${filename}`);
        return text;
    } catch (error) {
        console.error('Error fetching markdown file:', error);
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

        // Parse tags if they exist
        if (frontmatter.tags) {
            frontmatter.tags = frontmatter.tags
                .replace(/[\[\]]/g, '')
                .split(',')
                .map(tag => tag.trim());
        }

        console.log('Parsed frontmatter:', frontmatter);
        return { frontmatter, content };
    } catch (error) {
        console.error('Error parsing frontmatter:', error);
        return { content: markdown };
    }
}

// Function to create blog post card
function createBlogPostCard(postData) {
    console.log('Creating blog post card:', postData);
    try {
        const { frontmatter, content } = postData;
        const card = document.createElement('div');
        card.className = 'blog-card';
        
        const tagButtons = frontmatter.tags
            ? frontmatter.tags
                .map(tag => `<button class="tag">${tag}</button>`)
                .join('')
            : '';
        
        // Use marked.parse with error handling
        let parsedContent;
        try {
            parsedContent = marked.parse(content.split('\n').slice(0, 3).join('\n'));
        } catch (error) {
            console.error('Error parsing markdown content:', error);
            parsedContent = content.split('\n').slice(0, 3).join('\n');
        }
        
        card.innerHTML = `
            <h3>${frontmatter.title || 'Untitled Post'}</h3>
            <div class="blog-meta">
                <span class="date">${frontmatter.date || 'No date'}</span>
                <div class="tags">${tagButtons}</div>
            </div>
            <div class="blog-preview">${parsedContent}</div>
            <a href="#" class="read-more">Read More</a>
        `;
        
        return card;
    } catch (error) {
        console.error('Error creating blog card:', error);
        return null;
    }
}

// Function to update tag filters
function updateTagFilters() {
    console.log('Updating tag filters. All tags:', Array.from(allTags));
    try {
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
    } catch (error) {
        console.error('Error updating tag filters:', error);
    }
}

// Function to filter blog posts
function filterBlogPosts() {
    console.log('Filtering blog posts');
    try {
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
    } catch (error) {
        console.error('Error filtering blog posts:', error);
    }
}

// Function to load blog posts
async function loadBlogPosts() {
    console.log('Loading blog posts');
    try {
        const posts = ['first-post.md']; // Add more posts here as they're created
        
        for (const filename of posts) {
            console.log(`Processing ${filename}`);
            const post = await fetchMarkdownFile(filename);
            if (post) {
                const postData = parseFrontmatter(post);
                blogPosts.push(postData);
                
                // Collect all unique tags
                if (postData.frontmatter && postData.frontmatter.tags) {
                    postData.frontmatter.tags.forEach(tag => allTags.add(tag));
                }
                
                const card = createBlogPostCard(postData);
                if (card) {
                    blogList.appendChild(card);
                }
            }
        }
        
        updateTagFilters();
        console.log('Blog posts loaded successfully');
    } catch (error) {
        console.error('Error loading blog posts:', error);
    }
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

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing blog functionality');
    loadBlogPosts();
}); 