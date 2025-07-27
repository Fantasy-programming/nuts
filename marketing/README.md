# Nuts Marketing Website

The official marketing website for Nuts - built with Astro for optimal performance and SEO.

## 🌐 Overview

This marketing site showcases Nuts' features, provides documentation, and handles user onboarding. Built with modern static site generation for fast loading and excellent SEO performance.

## 🚀 Features

- **Static Site Generation**: Fast, SEO-optimized pages
- **Modern Design**: Clean, responsive UI with TailwindCSS
- **Blog System**: Markdown-based blog posts and tutorials
- **Multi-page Support**: About, Privacy, Terms, and more
- **Performance Optimized**: Lighthouse scores of 95+

## 🛠️ Technology Stack

- **[Astro](https://astro.build/)**: Static site generator
- **React**: Interactive components
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Markdown**: Content management

## 📁 Project Structure

```
marketing/
├── src/
│   ├── components/        # Reusable UI components
│   ├── layouts/          # Page layouts and templates
│   ├── pages/            # Static pages and routes
│   ├── data/             # Content and data files
│   │   ├── blog/         # Blog posts (Markdown)
│   │   └── pages/        # Static page content
│   └── styles/           # CSS and styling
├── public/               # Static assets (images, icons)
├── astro.config.mjs      # Astro configuration
├── tailwind.config.js    # TailwindCSS configuration
├── tsconfig.json         # TypeScript configuration
└── package.json          # Dependencies and scripts
```

## 🚀 Development

### Prerequisites
- **Node.js 18+**
- **pnpm** (recommended) or npm

### Getting Started

1. **Install dependencies:**
   ```bash
   pnpm install
   ```

2. **Start development server:**
   ```bash
   pnpm dev
   ```
   The site will be available at `http://localhost:3000`

3. **Build for production:**
   ```bash
   pnpm build
   ```

4. **Preview production build:**
   ```bash
   pnpm preview
   ```

### Available Scripts

```bash
pnpm dev        # Start development server
pnpm build      # Build for production
pnpm preview    # Preview production build
pnpm lint       # Run ESLint
pnpm format     # Format code with Prettier
```

## 📝 Content Management

### Adding Blog Posts

1. Create a new Markdown file in `src/data/blog/`:
   ```markdown
   ---
   title: "Your Post Title"
   description: "Brief description of the post"
   pubDate: 2024-01-15
   author: "Author Name"
   image: "./images/post-image.jpg"
   tags: [tutorial, guide]
   ---

   # Your Content Here

   Your blog post content in Markdown format.
   ```

2. Add images to `src/data/blog/images/`
3. The post will automatically appear on the blog index

### Adding Pages

1. Create a new file in `src/pages/`:
   ```astro
   ---
   import Layout from '../layouts/Layout.astro';
   ---

   <Layout title="Page Title">
     <main>
       <h1>Your Page Content</h1>
     </main>
   </Layout>
   ```

2. The page will be available at `/your-filename`

### Updating Static Content

Edit files in `src/data/pages/` to update:
- About page content
- Privacy policy
- Terms of service
- FAQ section

## 🎨 Styling

### TailwindCSS
The site uses TailwindCSS for styling. Key configurations:

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        brand: {
          // Custom brand colors
        }
      }
    }
  }
}
```

### Custom Components
Reusable components are in `src/components/`:
- `Header.astro`: Site navigation
- `Footer.astro`: Site footer
- `BlogCard.astro`: Blog post cards
- `Button.astro`: Styled buttons

## 📈 SEO & Performance

### SEO Features
- **Meta Tags**: Automatic meta tag generation
- **Open Graph**: Social media sharing optimization
- **Sitemap**: Automatic sitemap generation
- **Schema Markup**: Structured data for search engines

### Performance Optimizations
- **Image Optimization**: Automatic image compression and WebP conversion
- **CSS Purging**: Unused CSS removal
- **Code Splitting**: Optimal JavaScript bundles
- **Static Generation**: Pre-rendered HTML for fast loading

## 🚀 Deployment

### Netlify (Recommended)
1. Connect your GitHub repository to Netlify
2. Set build command: `pnpm build`
3. Set publish directory: `dist`
4. Deploy automatically on git push

### Vercel
1. Import project to Vercel
2. Framework preset: Astro
3. Deploy with default settings

### Manual Deployment
```bash
# Build the site
pnpm build

# Upload the `dist` folder to your hosting provider
```

## 🔧 Configuration

### Environment Variables
```bash
# .env
SITE_URL=https://nuts.ridyrich.engineer
BLOG_AUTHOR=Nuts Team
CONTACT_EMAIL=hello@nuts.app
```

### Site Configuration
```javascript
// astro.config.mjs
export default defineConfig({
  site: 'https://nuts.ridyrich.engineer',
  integrations: [
    react(),
    tailwind(),
    sitemap()
  ]
});
```

## 📊 Analytics

The site includes:
- **Google Analytics**: Traffic and user behavior tracking
- **Plausible**: Privacy-friendly analytics alternative
- **Performance Monitoring**: Core Web Vitals tracking

## 🤝 Contributing

### Content Guidelines
- Use clear, accessible language
- Include relevant images and examples
- Follow the established style guide
- Test all links and functionality

### Development Guidelines
- Follow TypeScript best practices
- Use semantic HTML elements
- Optimize images before adding
- Test responsive design on multiple devices

### Submitting Changes
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test the build locally
5. Submit a pull request

## 📞 Support

For marketing site issues:
- **GitHub Issues**: [Report bugs](https://github.com/Fantasy-Programming/nuts/issues)
- **Documentation**: Check the main [docs](../../docs/)
- **Email**: marketing@nuts.app

---

*Built with ❤️ using Astro and modern web technologies*
