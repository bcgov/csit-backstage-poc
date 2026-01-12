# Plugin Development Guidelines

To align Backstage plugins with the BC Government design system and DevHub UI stack, use BC Gov design tokens for all styling values, leverage Material-UI's theming system (configured at the app level), and follow JSS-based styling patterns (via `makeStyles` or `withStyles`).

## Integration Checklist

When creating a new plugin, ensure:

- [ ] All colors use design tokens (`@bcgov/design-tokens/js`) - never hardcode values
- [ ] All spacing uses design tokens or Material-UI spacing props
- [ ] Components use `makeStyles` or `withStyles` for styling (JSS)
- [ ] Typography uses Material-UI `Typography` with variants (`h2`, `h3`, `body1`, etc.)
- [ ] Layout uses Material-UI `Grid` with responsive props (`xs`, `sm`, `md`, `lg`)
- [ ] Theme is accessed via `makeStyles` theme parameter (don't create plugin-specific themes)
- [ ] No hardcoded values (colors, spacing, fonts)
- [ ] No inline styles for static values (only for dynamic/calculated values)
- [ ] Components are accessible (semantic HTML, ARIA attributes, keyboard navigation)
- [ ] Responsive design implemented with Material-UI breakpoints
- [ ] Backstage core components used when available (`Page`, `Content`, `InfoCard`, etc.)
- [ ] Plugin follows Backstage plugin structure conventions

## 1. Plugin Structure and Setup

**Create Plugin Using Backstage CLI:**

```bash
yarn new
```

**Required Dependencies in `package.json`:**

```json
{
  "dependencies": {
    "@material-ui/core": "^4.12.4",
    "@material-ui/icons": "^4.11.3",
    "@material-ui/lab": "^4.0.0-alpha.61",
    "@material-ui/styles": "^4.11.5",
    "@bcgov/design-tokens": "^3.0.0"
  },
  "peerDependencies": {
    "react": "^18.0.2"
  }
}
```

## 2. Styling Best Practices

### Use Design Tokens for All Values

**Always import and use BC Gov design tokens:**

```typescript
import * as tokens from '@bcgov/design-tokens/js';

const useStyles = makeStyles(theme => ({
  container: {
    padding: tokens.layoutPaddingLarge,
    margin: tokens.layoutMarginMedium,
    backgroundColor: tokens.surfaceColorBackgroundWhite,
    border: `${tokens.layoutBorderWidthSmall} solid ${tokens.surfaceColorBorderDefault}`,
    borderRadius: tokens.layoutBorderRadiusMedium,
    boxShadow: tokens.surfaceShadowSmall,
    color: tokens.themePrimaryBlue,
  },
}));
```

**Never hardcode values:**

```typescript
// ❌ Bad
padding: '16px',
color: '#003366',

// ✅ Good
padding: tokens.layoutPaddingLarge,
color: tokens.themePrimaryBlue,
```

**Semantic color tokens:**

```typescript
// Status colors
error: tokens.iconsColorDanger,
warning: tokens.iconsColorWarning,
success: tokens.iconsColorSuccess,
info: tokens.iconsColorInfo,

// Surface colors
background: tokens.surfaceColorBackgroundWhite,
hover: tokens.surfaceColorMenusHover,
border: tokens.surfaceColorBorderDefault,
```

### Prefer JSS (`makeStyles`) for Component Styles

Note: This is a legacy method, deprecated in MUI v5 in favour of `styled` and the `sx` prop.

**Primary styling method:**

```typescript
import { makeStyles } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  card: {
    padding: tokens.layoutPaddingLarge,
    '&:hover': {
      backgroundColor: 
        theme.palette.type === 'dark'
          ? tokens.themeGray80
          : tokens.surfaceColorMenusHover,
    },
  },
}));

const MyComponent = () => {
  const classes = useStyles();
  return <Card className={classes.card}>...</Card>;
};
```

### Use `withStyles` for Reusable Styled Components

Note: This is a legacy method, deprecated in MUI v5.

**For components that need consistent styling across the plugin:**

```typescript
import { withStyles } from '@material-ui/core';
import { Box } from '@material-ui/core';

const StyledBox = withStyles({
  root: {
    display: 'flex',
    gap: tokens.layoutMarginSmall,
    padding: tokens.layoutPaddingMedium,
  },
})(Box);
```

### Use Prop-Based Styling for Layout

**Leverage Material-UI's prop system for layout:**

```typescript
<Grid container spacing={4}>
  <Grid item xs={12} sm={6} md={4}>
    <Card>...</Card>
  </Grid>
</Grid>

<Typography variant="h3" paragraph>
  Heading Text
</Typography>

<Button variant="text" color="primary">
  Action
</Button>
```

### Minimize Inline Styles

**Use inline styles only for one-off, dynamic values:**

```typescript
// ✅ Acceptable for dynamic values
<div style={{ width: `${dynamicWidth}px` }}>

// ❌ Avoid for static values - use makeStyles instead
<div style={{ padding: '16px', margin: '8px' }}>
```

## 3. Component Architecture

### Use Backstage Core Components When Available

**Prefer Backstage components for consistency:**

```typescript
import {
  Content,
  Page,
  InfoCard,
  ItemCardHeader,
} from '@backstage/core-components';

const MyPluginPage = () => (
  <Page themeId="tool">
    <Content>
      <InfoCard title="My Plugin">
        {/* Plugin content */}
      </InfoCard>
    </Content>
  </Page>
);
```

### Combine Material-UI and Backstage Components

**Use Material-UI for layout and base components:**

```typescript
import { Grid, Card, CardContent, Typography } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';

// Material-UI for layout structure
<Grid container spacing={4}>
  <Grid item xs={12} md={6}>
    {/* Backstage components for content */}
    <InfoCard title="Information">
      <Typography>Content here</Typography>
    </InfoCard>
  </Grid>
</Grid>
```

## 4. Theme Integration

### Use the DevEx Theme

Plugins should NOT create their own theme. For development, add the `devex-theme.ts` from <https://github.com/bcgov/developer-portal/blob/main/packages/app/src/devex-theme.ts> and import in `App.tsx` of your dev app:

```typescript
themes: [
  {
    id: 'devex',
    title: 'DevEx Theme',
    variant: 'light',
    Provider: ({ children }) => (
      <ThemeProvider theme={devExTheme}>
        <CssBaseline>{children}</CssBaseline>
      </ThemeProvider>
    ),
  },
]
```

### Use Theme-Aware Colors

Using the theme palette is better for theme awareness (e.g., supporting dynamic themes or light/dark mode) rather than directly referencing the BC Design System tokens.

**Reference theme palette for dynamic colors:**

```typescript
const useStyles = makeStyles(theme => ({
  link: {
    color: theme.palette.primary.main, // Uses BC Gov primary blue
    '&:hover': {
      color: theme.palette.primary.dark,
    },
  },
}));
```

## 5. Typography

### Use Material-UI Typography with Variants

**Leverage typography variants for hierarchy:**

```typescript
import { Typography } from '@material-ui/core';

<Typography variant="h2" gutterBottom>
  Main Heading
</Typography>
<Typography variant="h3" paragraph>
  Section Heading
</Typography>
<Typography variant="body1">
  Body text
</Typography>
<Typography variant="body2">
  Secondary text
</Typography>
```

**The theme automatically applies BC Sans font family** - no need to specify it in components.

### Custom Typography Components (Optional)

**If you need BC Gov-specific typography components:**

```typescript
import { Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core';

const BCGovHeaderText = withStyles({
  root: {
    fontFamily: 'BCSans, Noto Sans, Roboto, sans-serif',
    textTransform: 'none', // BC Gov style
  },
})(Typography);
```

## 7. Accessibility

### Semantic HTML and ARIA

**Use semantic elements and ARIA attributes:**

```typescript
<Button
  aria-label="Close dialog"
  aria-describedby="dialog-description"
>
  Close
</Button>
```

### Keyboard Navigation

**Material-UI components handle keyboard navigation automatically**, but ensure custom components are keyboard accessible:

```typescript
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom Interactive Element
</div>
```

### Color Contrast

**Design tokens ensure WCAG compliance**, but verify custom color combinations:

```typescript
// ✅ Good - uses theme colors with proper contrast
color: theme.palette.text.primary,
backgroundColor: theme.palette.background.default,

// ⚠️ Verify contrast if using custom combinations
color: tokens.themeGray100,
backgroundColor: tokens.themeGray10,
```

## 8. File Organization

**Recommended plugin structure:**

```text
plugins/my-plugin/
├── src/
│   ├── components/
│   │   ├── MyComponent/
│   │   │   ├── MyComponent.tsx
│   │   │   ├── MyComponent.test.tsx
│   │   │   └── index.ts
│   │   └── index.ts
│   ├── hooks/
│   │   └── useMyHook.ts
│   ├── routes.ts
│   ├── plugin.ts
│   └── index.ts
├── package.json
└── README.md
```

## 9. Common Pitfalls to Avoid

1. **Don't create plugin-specific themes** - Use the app-level theme
2. **Don't hardcode colors or spacing** - Always use design tokens
3. **Don't use inline styles for static values** - Use `makeStyles`
4. **Don't import BC Sans CSS in plugins** - It's loaded at the app level
5. **Don't override Material-UI component styles globally** - Use component-level overrides via `classes` prop
6. **Don't use CSS modules or styled-components** - Stick to JSS (`makeStyles`/`withStyles`)

## 10. Complete Example

**Complete example following all guidelines:**

```typescript
import { makeStyles } from '@material-ui/core';
import { Grid, Card, CardContent, Typography, Button } from '@material-ui/core';
import { InfoCard } from '@backstage/core-components';
import * as tokens from '@bcgov/design-tokens/js';

const useStyles = makeStyles(theme => ({
  container: {
    padding: tokens.layoutPaddingLarge,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    padding: tokens.layoutPaddingMedium,
    '&:hover': {
      backgroundColor: 
        theme.palette.type === 'dark'
          ? tokens.themeGray80
          : tokens.surfaceColorMenusHover,
    },
  },
  actionButton: {
    marginTop: tokens.layoutMarginMedium,
  },
}));

export const MyPluginComponent = () => {
  const classes = useStyles();

  return (
    <div className={classes.container}>
      <InfoCard title="My Plugin">
        <Grid container spacing={4}>
          <Grid item xs={12} sm={6} md={4}>
            <Card className={classes.card}>
              <CardContent>
                <Typography variant="h3" paragraph>
                  Card Title
                </Typography>
                <Typography variant="body1">
                  Card description using BC Gov design tokens
                  and Material-UI components.
                </Typography>
                <Button
                  variant="text"
                  color="primary"
                  className={classes.actionButton}
                >
                  Learn More
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </InfoCard>
    </div>
  );
};
```
