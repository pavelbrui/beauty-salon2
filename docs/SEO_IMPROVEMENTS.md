# SEO Improvements Documentation

## Overview

This document describes the SEO enhancements implemented in the beauty-salon2 project. These improvements focus on better search engine visibility, structured data markup, and user experience optimization.

## New Components

### 1. ImageWithAlt Component

**Location:** `src/components/ImageWithAlt.tsx`

**Purpose:** Ensures all images have descriptive alt text and supports lazy loading for performance.

**Features:**
- Enforces alt text for accessibility and SEO
- Built-in lazy loading support
- Fallback alt text for missing descriptions
- Proper image loading strategy

**Usage:**
```tsx
import { ImageWithAlt } from './components/ImageWithAlt';

<ImageWithAlt 
  src="/images/makijaz-permanentny.jpg"
  alt="Makijaż permanentny brwi Białystok - efekt zabiegu"
  loading="lazy"
/>
```

**SEO Benefits:**
- Improved image search visibility
- Better accessibility for screen readers
- Faster page load times with lazy loading

### 2. FAQSection Component

**Location:** `src/components/FAQSection.tsx`

**Purpose:** Renders FAQ sections with built-in schema.org FAQPage markup for rich snippet display.

**Features:**
- Accordion-style UI for better UX
- Automatic schema.org FAQPage generation
- Support for multiple FAQ items
- Toggleable answers

**Usage:**
```tsx
import { FAQSection } from './components/FAQSection';

<FAQSection 
  title="Pytania o makijaż permanentny"
  faqs={[
    { 
      question: "Ile trwa zabieg?", 
      answer: "Zabieg trwa około 2-3 godzin..." 
    },
    { 
      question: "Czy boli?", 
      answer: "Stosujemy znieczulenie topiczne..." 
    }
  ]}
  includeSchema={true}
/>
```

**SEO Benefits:**
- Rich snippet display in search results
- Improved click-through rates (CTR)
- Better user engagement
- Featured snippet potential

### 3. SEOLink Component

**Location:** `src/components/SEOLink.tsx`

**Purpose:** Internal link component with automatic language prefix handling and proper SEO attributes.

**Features:**
- Automatic language prefix handling
- Proper rel attributes for external links
- Accessibility support (title, aria-label)
- Current page detection (aria-current)

**Usage:**
```tsx
import { SEOLink } from './components/SEOLink';

<SEOLink to="/services/makijaz-permanentny-bialystok">
  Makijaż permanentny
</SEOLink>

// External link
<SEOLink to="https://example.com" external>
  External Link
</SEOLink>
```

**SEO Benefits:**
- Consistent internal link structure
- Proper language handling
- Better crawlability for Google
- Improved site architecture

### 4. SEOEnhanced Component

**Location:** `src/components/SEOEnhanced.tsx`

**Purpose:** Extended SEO component with support for articles, products, and advanced schema.org markup.

**Features:**
- Article schema support (for blog posts)
- Product schema support (for services)
- Breadcrumb navigation
- Multi-language hreflang support
- Open Graph and Twitter Card metadata
- Automatic canonical URL generation

**Usage:**
```tsx
import { SEOEnhanced } from './components/SEOEnhanced';

// For blog posts
<SEOEnhanced
  title="Makijaż permanentny - wszystko co musisz wiedzieć"
  description="Kompletny poradnik dotyczący makijażu permanentnego..."
  article={{
    publishedTime: "2024-01-15T10:00:00Z",
    modifiedTime: "2024-03-16T15:30:00Z",
    author: "Katarzyna Brui",
    section: "Poradniki",
    tags: ["makijaż permanentny", "brwi", "pielęgnacja"]
  }}
  breadcrumbs={[
    { name: "Strona główna", url: "/" },
    { name: "Blog", url: "/blog" },
    { name: "Makijaż permanentny", url: "/blog/makijaz-permanentny" }
  ]}
/>

// For service pages
<SEOEnhanced
  title="Makijaż permanentny brwi"
  description="Profesjonalny makijaż permanentny brwi w Białymstoku..."
  product={{
    price: 800,
    currency: "PLN",
    availability: "InStock",
    rating: 4.9,
    reviewCount: 384
  }}
/>
```

**SEO Benefits:**
- Rich snippet display for articles and products
- Better search result appearance
- Improved click-through rates
- Enhanced structured data

## SEO Helper Utilities

**Location:** `src/utils/seoHelpers.ts`

### Available Functions

#### Service-Related Functions

- **generateServiceTitle(serviceName, location)** - Create SEO-friendly service titles
- **generateServiceDescription(serviceName, description, location)** - Generate meta descriptions
- **generateServiceKeywords(serviceName, location)** - Create relevant keyword lists
- **generateServiceCanonical(serviceSlug, language)** - Build canonical URLs
- **generateServiceBreadcrumbs(serviceName, serviceSlug)** - Create breadcrumb navigation
- **generateServiceSchema(data, baseUrl)** - Generate Product schema markup

#### Blog-Related Functions

- **generateBlogTitle(postTitle)** - Create SEO-friendly blog titles
- **generateBlogBreadcrumbs(postTitle, postSlug)** - Create breadcrumb navigation
- **generateBlogSchema(data, baseUrl)** - Generate Article schema markup

#### Utility Functions

- **sanitizeMetaText(text)** - Normalize text for meta tags

### Usage Example

```tsx
import { generateServiceTitle, generateServiceDescription, generateServiceKeywords } from './utils/seoHelpers';

const serviceTitle = generateServiceTitle("Makijaż permanentny brwi");
// Returns: "Makijaż permanentny brwi Białystok | Salon Kosmetyczny Katarzyna Brui"

const description = generateServiceDescription(
  "Makijaż permanentny brwi",
  "Profesjonalny makijaż permanentny brwi metodą microblading i powder brows."
);
// Returns: "Makijaż permanentny brwi w Białymstoku. Profesjonalny makijaż permanentny brwi metodą microblading i powder brows. Umów wizytę online!"

const keywords = generateServiceKeywords("Makijaż permanentny brwi");
// Returns: ["Makijaż permanentny brwi", "Makijaż permanentny brwi Białystok", ...]
```

## Implementation Guidelines

### For Service Pages

1. Use `SEOEnhanced` component with product schema
2. Use `generateServiceTitle` for page title
3. Use `generateServiceDescription` for meta description
4. Use `generateServiceKeywords` for meta keywords
5. Use `generateServiceBreadcrumbs` for navigation
6. Use `ImageWithAlt` for all service images

### For Blog Posts

1. Use `SEOEnhanced` component with article schema
2. Use `generateBlogTitle` for page title
3. Use `generateBlogSchema` for structured data
4. Use `generateBlogBreadcrumbs` for navigation
5. Include `publishedTime` and `modifiedTime` in article metadata
6. Use descriptive alt text for all images

### For Internal Links

1. Replace standard `<a>` tags with `SEOLink` component
2. Ensure links use consistent slug format
3. Use descriptive link text (avoid "click here")
4. Maintain proper link hierarchy

## Best Practices

### Meta Tags

- **Title:** Keep under 60 characters, include main keyword and location
- **Description:** Keep between 150-160 characters, include call-to-action
- **Keywords:** Include 5-10 relevant keywords, prioritize long-tail keywords

### Images

- Always provide descriptive alt text
- Use lazy loading for images below the fold
- Optimize image sizes for web (use WebP format when possible)
- Include image titles and captions for better context

### Structured Data

- Use schema.org markup for all important content types
- Validate schema using Google's Structured Data Testing Tool
- Keep schema data synchronized with visible content
- Update schema when content changes

### Internal Linking

- Link related services and blog posts
- Use descriptive anchor text
- Maintain consistent URL structure
- Create breadcrumb navigation for better UX

## Monitoring and Maintenance

### Regular Checks

1. Monitor Core Web Vitals in Google Search Console
2. Check indexed pages and coverage issues
3. Review search performance metrics
4. Validate structured data regularly
5. Test page speed with PageSpeed Insights

### Tools

- Google Search Console - Monitor indexation and performance
- Google PageSpeed Insights - Check Core Web Vitals
- Structured Data Testing Tool - Validate schema markup
- Lighthouse - Comprehensive SEO audit

## Future Improvements

- [ ] Implement dynamic sitemap generation with lastmod dates
- [ ] Add schema.org LocalBusiness markup to all pages
- [ ] Create FAQ sections for each service category
- [ ] Implement breadcrumb schema across all pages
- [ ] Add video schema for service demonstration videos
- [ ] Optimize images with WebP format and responsive sizes
- [ ] Implement AMP (Accelerated Mobile Pages) for blog posts
- [ ] Add JSON-LD for Event schema for special promotions

## References

- [Google Search Central - SEO Starter Guide](https://developers.google.com/search/docs/beginner/seo-starter-guide)
- [Schema.org - Structured Data](https://schema.org/)
- [Google Structured Data Testing Tool](https://search.google.com/test/rich-results)
- [Web.dev - Core Web Vitals](https://web.dev/vitals/)
