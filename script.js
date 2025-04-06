document.addEventListener('DOMContentLoaded', async function() {
    const blogContainer = document.getElementById('blogContainer');
    const loadingElement = document.getElementById('loading');

    try {
        // 初始化博客文件列表
        let blogFiles = [];
        
        // 尝试动态获取博客文件列表
        try {
            // 这里使用一个特殊的技巧来尝试获取目录列表
            // 如果服务器支持目录列表功能，这可能会工作
            // 但在许多服务器上，这可能不会成功
            const response = await fetch('blogs/');
            const html = await response.text();
            
            // 使用正则表达式从HTML目录列表中提取.md文件
            const regex = /href="([^"]+\.md)"/g;
            let match;
            while ((match = regex.exec(html)) !== null) {
                blogFiles.push(match[1]);
            }
        } catch (error) {
            console.log('无法自动获取博客列表，使用默认列表', error);
        }
        
        // 如果无法获取目录列表，则使用已知的博客文件
        if (blogFiles.length === 0) {
            blogFiles = ['first-post.md']; // 默认的博客文件
            
            // 也可以尝试自动发现更多文件（这只是一个示例）
            // 这里我们可以尝试访问一些可能存在的文件
            const possibleFiles = [
                'second-post.md',
                'third-post.md',
                'about-me.md',
                'japan-life.md'
            ];
            
            for (const file of possibleFiles) {
                try {
                    const testResponse = await fetch(`blogs/${file}`);
                    if (testResponse.ok) {
                        blogFiles.push(file);
                    }
                } catch (e) {
                    // 忽略错误
                }
            }
        }
        
        // 清除加载提示
        loadingElement.style.display = 'none';
        
        // 循环加载每个博客文件
        for (const blogFile of blogFiles) {
            try {
                const blogResponse = await fetch(`blogs/${blogFile}`);
                if (!blogResponse.ok) {
                    throw new Error(`无法加载博客文件 ${blogFile}`);
                }
                
                const content = await blogResponse.text();
                const blogElement = createBlogElement(content, blogFile);
                blogContainer.appendChild(blogElement);
            } catch (error) {
                console.error(`加载博客 ${blogFile} 时出错:`, error);
                const errorElement = document.createElement('div');
                errorElement.className = 'blog-post error';
                errorElement.textContent = `加载博客 ${blogFile} 时出错: ${error.message}`;
                blogContainer.appendChild(errorElement);
            }
        }
        
        // 如果没有博客内容，显示提示
        if (blogContainer.children.length === 1 && loadingElement.style.display === 'none') {
            const noContentElement = document.createElement('div');
            noContentElement.textContent = '暂无博客内容';
            blogContainer.appendChild(noContentElement);
        }
    } catch (error) {
        console.error('加载博客列表时出错:', error);
        loadingElement.textContent = `加载博客列表时出错: ${error.message}`;
    }
});

// 解析博客内容并创建DOM元素
function createBlogElement(content, filename) {
    const postElement = document.createElement('article');
    postElement.className = 'blog-post';
    
    // 解析Markdown格式
    const lines = content.split('\n');
    let inFrontMatter = false;
    let frontMatter = {};
    let mainContent = [];
    
    // 解析前置元数据和正文内容
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // 处理YAML前置元数据
        if (i === 0 && line.trim() === '---') {
            inFrontMatter = true;
            continue;
        }
        
        if (inFrontMatter) {
            if (line.trim() === '---') {
                inFrontMatter = false;
                continue;
            }
            
            // 解析元数据
            const match = line.match(/^([^:]+):\s*(.+)$/);
            if (match) {
                const [_, key, value] = match;
                frontMatter[key.trim()] = value.trim();
            }
        } else {
            mainContent.push(line);
        }
    }
    
    // 创建标题元素
    if (frontMatter.title) {
        const titleElement = document.createElement('h2');
        titleElement.className = 'blog-title';
        titleElement.textContent = frontMatter.title;
        postElement.appendChild(titleElement);
    } else {
        // 如果没有元数据标题，使用文件名作为标题
        const titleElement = document.createElement('h2');
        titleElement.className = 'blog-title';
        titleElement.textContent = filename.replace('.md', '');
        postElement.appendChild(titleElement);
    }
    
    // 创建日期元素
    if (frontMatter.date) {
        const dateElement = document.createElement('div');
        dateElement.className = 'blog-date';
        dateElement.textContent = `发布日期: ${frontMatter.date}`;
        postElement.appendChild(dateElement);
    }
    
    // 创建内容元素
    const contentElement = document.createElement('div');
    contentElement.className = 'blog-content';
    
    // 简单的Markdown解析
    let html = '';
    let inCodeBlock = false;
    
    for (const line of mainContent) {
        // 处理代码块
        if (line.startsWith('```')) {
            inCodeBlock = !inCodeBlock;
            if (inCodeBlock) {
                html += '<pre><code>';
            } else {
                html += '</code></pre>';
            }
            continue;
        }
        
        if (inCodeBlock) {
            html += line + '\n';
            continue;
        }
        
        // 处理标题
        if (line.startsWith('# ')) {
            html += `<h1>${line.substring(2)}</h1>`;
        } else if (line.startsWith('## ')) {
            html += `<h2>${line.substring(3)}</h2>`;
        } else if (line.startsWith('### ')) {
            html += `<h3>${line.substring(4)}</h3>`;
        } else if (line.trim() === '') {
            html += '<p></p>';
        } else {
            html += `<p>${line}</p>`;
        }
    }
    
    contentElement.innerHTML = html;
    postElement.appendChild(contentElement);
    
    // 创建标签元素
    if (frontMatter.tags) {
        const tagsText = frontMatter.tags
            .replace('[', '')
            .replace(']', '')
            .split(',')
            .map(tag => tag.trim())
            .join(', ');
            
        const tagsElement = document.createElement('div');
        tagsElement.className = 'blog-tags';
        tagsElement.textContent = `标签: ${tagsText}`;
        postElement.appendChild(tagsElement);
    }
    
    return postElement;
} 