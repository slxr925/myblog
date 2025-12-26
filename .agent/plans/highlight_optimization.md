# Plan: Enable Native Elasticsearch Highlighting

## Context
The user wants to optimize search highlighting. Currently, the backend uses manual string replacement which is inefficient and inaccurate (context loss). The frontend does not support rendering HTML tags from the backend. Since the local environment lacks Elasticsearch, we must deploy to production to verify changes.

## Goals
1.  **Backend**: Replace manual highlighting with Elasticsearch native `HighlightQuery`.
2.  **Frontend**: Render HTML highlighting tags (`<span class='search-highlight'>...</span>`) in search results and autocomplete suggestions.
3.  **Deploy**: Push changes to production.

## Implementation Details

### 1. Backend: `SearchServiceImpl.java`
-   **Method**: `searchBlogsWithHighlight`
-   **Change**:
    -   Use `NativeQueryBuilder`.
    -   Construct `HighlightParameters` with `preTags="<span class='search-highlight'>"` and `postTags="</span>"`.
    -   Construct `HighlightQuery` with global parameters and `HighlightField`s for `title`, `summary`, `content`.
    -   Extract highlighted fragments from `SearchHit.getHighlightFields()` in `convertToSearchResultVOWithHighlight`.
    -   Remove legacy `highlightText` method.

### 2. Frontend: `SearchResults.tsx`
-   **Change**: Update rendering logic to check for `highlightedTitle`, `highlightedSummary`, etc.
-   **Method**: Use `<span dangerouslySetInnerHTML={{ __html: post.highlightedSummary || post.excerpt }} />`.

### 3. Frontend: `RealTimeSearch.tsx`
-   **Change**: Update suggestions dropdown to render HTML.
-   **Method**: Helper function to render text that might contain HTML.

### 4. Styles: `index.css`
-   **Change**: Add `.search-highlight` class.
    ```css
    .search-highlight {
      @apply text-indigo-600 font-bold bg-indigo-50 px-1 rounded;
    }
    ```

## Verification Plan
1.  **Compile**: Run `mvn clean compile` locally to ensure backend code is valid.
2.  **Deploy**: Commit, push, and run deployment script.
3.  **Production Test**:
    -   Search for a keyword.
    -   Verify highlighting works in dropdown.
    -   Verify highlighting works in result list.
    -   Verify highlighting is minimal (fragments) vs full text.
