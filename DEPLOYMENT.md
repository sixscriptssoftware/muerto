# GitHub Pages Deployment Instructions

This repository is configured to deploy to GitHub Pages using GitHub Actions.

## Setup Steps

To enable GitHub Pages for this repository, follow these steps:

### 1. Enable GitHub Pages in Repository Settings

1. Go to your repository on GitHub: https://github.com/sixscriptssoftware/muerto
2. Click on **Settings** (top menu)
3. In the left sidebar, click on **Pages** (under "Code and automation")
4. Under **Source**, select **GitHub Actions** from the dropdown
5. Save the changes

### 2. Merge the Pull Request

Once you merge the pull request containing the GitHub Pages setup to the `main` branch, the GitHub Actions workflow will automatically deploy the site.

### 3. Access Your Site

After deployment completes (usually takes 1-2 minutes), your site will be available at:

**https://sixscriptssoftware.github.io/muerto/**

## Workflow Details

The deployment workflow (`.github/workflows/static.yml`) will:
- Trigger automatically when changes are pushed to the `main` branch
- Can also be triggered manually from the Actions tab
- Deploy the entire repository content as a static site
- Use the `index.html` file as the homepage

## Files Included

- `index.html` - Main landing page
- `styles.css` - Stylesheet for the landing page
- `.github/workflows/static.yml` - GitHub Actions workflow for deployment
- `README.md` - Project documentation
- `LICENSE` - MIT License

## Monitoring Deployment

You can monitor the deployment status:
1. Go to the **Actions** tab in your repository
2. Look for "Deploy to GitHub Pages" workflow runs
3. Click on a run to see detailed logs

## Updating the Site

To update the site, simply:
1. Make changes to the HTML/CSS files
2. Commit and push to the `main` branch (or merge a PR to main)
3. The workflow will automatically redeploy

## Troubleshooting

If the site doesn't deploy:
- Check that GitHub Pages is enabled in Settings > Pages
- Verify the workflow completed successfully in the Actions tab
- Ensure the source is set to "GitHub Actions" (not "Deploy from a branch")
- Wait a few minutes after the first deployment for DNS to propagate
