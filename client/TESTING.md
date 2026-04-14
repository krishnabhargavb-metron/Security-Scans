# Client Testing Setup

This document covers the testing infrastructure for the GitLabScanner client application.

## Overview

The client uses **Vitest** as the test runner, with **@testing-library/react** for component testing. The setup includes unit tests, integration tests, and end-to-end scenarios.

## Installation

After cloning the repository, install the testing dependencies:

```bash
cd client
npm install -D vitest @vitest/ui @testing-library/react @testing-library/vitest happy-dom @types/vitest
```

## Project Structure

```
src/
├── test/
│   ├── setup.ts           # Global test configuration
│   └── test-utils.tsx     # Custom render function with providers
├── __tests__/             # Test files (*.test.ts, *.test.tsx)
├── components/
│   ├── *.tsx              # Component files
│   └── *.test.tsx         # Component tests
├── hooks/
│   ├── *.ts               # Hook files
│   └── *.test.ts          # Hook tests
└── utils/
    ├── *.ts               # Utility files
    └── *.test.ts          # Utility tests
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm test -- --watch
```

### Run tests with UI
```bash
npm test:ui
```

This opens an interactive test UI in your browser.

### Run tests with coverage report
```bash
npm test:coverage
```

Generates coverage reports in HTML, JSON, and text formats.

### Run specific test file
```bash
npm test -- src/utils/apiService.test.ts
```

### Run tests matching a pattern
```bash
npm test -- --grep "ScanForm"
```

## Test Files

### Unit Tests

#### Utilities (`src/utils/`)

**apiService.test.ts**
- Tests for API service wrapper
- Status code handling
- Error responses
- Network errors
- Fetch mocking

Tests:
- ✅ Successful GET requests
- ✅ Successful POST requests
- ✅ Error handling (404, 429, 500)
- ✅ Network error handling
- ✅ Custom headers
- ✅ Response data validation

**validation.test.ts**
- Username validation
- Filter validation
- Edge cases

Tests:
- ✅ Username validation (empty, length, characters)
- ✅ Filter severity validation
- ✅ Category filter validation
- ✅ Whitespace trimming

#### Hooks (`src/hooks/`)

**useToast.test.ts**
- Toast hook functionality
- All toast types (success, error, loading, info)
- Custom options (duration, description)

Tests:
- ✅ Hook returns all methods
- ✅ Success toast
- ✅ Error toast
- ✅ Loading toast
- ✅ Info toast
- ✅ Custom duration
- ✅ Custom description

### Component Tests

**ScanForm.test.tsx**
- Form rendering
- Input validation
- Form submission
- Advanced options toggle
- PAT (Personal Access Token) handling

Tests:
- ✅ Form renders correctly
- ✅ Validation errors display
- ✅ Button disabled states
- ✅ Advanced options toggle
- ✅ Form submission with username
- ✅ Form submission with PAT
- ✅ Whitespace trimming

**FilterPanel.test.tsx**
- Filter rendering
- Filter state management
- Clear filters functionality
- Category/severity options

Tests:
- ✅ Filter panel renders
- ✅ Counts display correctly
- ✅ Clear filters button
- ✅ Filter change callback

**FindingCard.test.tsx**
- Card rendering
- Severity badges
- Content display
- Styling based on severity

Tests:
- ✅ Card renders with data
- ✅ Severity badge colors
- ✅ Project name display
- ✅ File path display
- ✅ Description display

**ResultsView.test.tsx**
- Results list rendering
- Loading states
- Empty states
- Pagination
- Load more functionality

Tests:
- ✅ Results rendering
- ✅ Loading state
- ✅ Empty state
- ✅ Pagination display
- ✅ Load more button

### Integration Tests

**App.test.tsx**
- Full application flow
- API calls and responses
- Toast notifications
- Error handling
- User interactions

Tests:
- ✅ App renders with header and form
- ✅ Categories fetch on mount
- ✅ Scan form submission
- ✅ Success toast display
- ✅ Error toast display
- ✅ Username validation
- ✅ Network error handling
- ✅ Rate limiting (429) handling
- ✅ Findings display with filters

## Mocking Strategy

### Global Mocks

**fetch API**
```typescript
global.fetch = vi.fn()
```

**sonner Toast**
```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
  },
  Toaster: () => null,
}))
```

### Usage in Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks()
})

// Mock successful response
global.fetch = vi.fn().mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => ({ data: 'value' }),
})

// Mock error response
global.fetch = vi.fn().mockResolvedValueOnce({
  ok: false,
  status: 404,
  json: async () => ({ detail: 'Not found' }),
})

// Mock network error
global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
```

## Test Utilities

### Custom Render Function

Located in `src/test/test-utils.tsx`, the custom render function automatically wraps components with necessary providers:

```typescript
import { render, screen } from '../test/test-utils'

render(<MyComponent />)
```

This automatically includes:
- `ToasterProvider` for toast notifications
- React DOM setup

## Test Coverage

To view test coverage:

```bash
npm test:coverage
```

This generates:
- **HTML report**: `coverage/index.html` (open in browser)
- **Text summary**: Console output
- **JSON report**: `coverage/coverage-final.json`

## Common Patterns

### Testing Components with Props

```typescript
const mockOnScan = vi.fn()

render(<ScanForm onScan={mockOnScan} isLoading={false} />)

const input = screen.getByPlaceholderText(/username/i)
fireEvent.change(input, { target: { value: 'testuser' } })

fireEvent.click(screen.getByRole('button'))

expect(mockOnScan).toHaveBeenCalledWith('testuser', undefined)
```

### Testing API Calls

```typescript
global.fetch = vi.fn().mockResolvedValueOnce({
  ok: true,
  status: 200,
  json: async () => ({ data: 'value' }),
})

render(<App />)

await waitFor(() => {
  expect(screen.getByText('success')).toBeInTheDocument()
})
```

### Testing Error States

```typescript
global.fetch = vi.fn().mockResolvedValueOnce({
  ok: false,
  status: 404,
  json: async () => ({ detail: 'Not found' }),
})

render(<App />)

await waitFor(() => {
  expect(toast.error).toHaveBeenCalled()
})
```

## Debugging Tests

### Run single test file
```bash
npm test -- src/components/ScanForm.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --grep "ScanForm"
```

### Run with debug output
```bash
npm test -- --reporter=verbose
```

### Interactive watch mode
```bash
npm test -- --watch
```

In watch mode, press:
- `w` to show available options
- `p` to filter by filename
- `t` to filter by test name
- `q` to quit

## CI/CD Integration

For GitHub Actions or other CI systems:

```yaml
- name: Run tests
  run: npm test -- --run
```

## Best Practices

1. **Use `screen` queries** over container queries
   ```typescript
   // ✅ Good
   screen.getByRole('button', { name: /submit/i })
   
   // ❌ Avoid
   container.querySelector('button')
   ```

2. **Use `waitFor` for async operations**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument()
   })
   ```

3. **Mock external dependencies**
   ```typescript
   vi.mock('sonner')
   ```

4. **Clean up after tests**
   ```typescript
   afterEach(() => {
     vi.clearAllMocks()
   })
   ```

5. **Use descriptive test names**
   ```typescript
   // ✅ Good
   it('should show error message when username is empty', () => {})
   
   // ❌ Avoid
   it('works', () => {})
   ```

## Troubleshooting

### Tests fail with "Cannot find module"
- Ensure all files are created
- Clear node_modules: `rm -rf node_modules && npm install`

### Fetch mock not working
- Clear mocks: `vi.clearAllMocks()` in beforeEach
- Verify mock is set before render

### Component not rendering
- Use custom `render` from test-utils.tsx
- Check that all required props are provided
- Verify providers are properly wrapped

### Tests passing locally but failing in CI
- Use `--run` flag to run once instead of watch mode
- Check for timing issues: ensure `waitFor` is used
- Verify environment variables are set

## Resources

- [Vitest Documentation](https://vitest.dev)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [React Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
