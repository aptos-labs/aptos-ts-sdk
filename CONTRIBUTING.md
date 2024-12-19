---
id: contributing
title: Contributing to the Aptos TypeScript SDK
---

# Contributing

Our goal is to make contributing to Aptos TypeScript SDK easy and transparent. See [Aptos Community](https://aptos.dev/community)
for full details. This page describes [our development process](#our-development-process).

## Aptos SDK

To contribute to the Aptos SDK implementation, first fork the [aptos-ts-sdk](https://github.com/aptos-labs/aptos-ts-sdk)
repository. For more information on how to fork see the [Github documentation](https://docs.github.com/en/get-started/quickstart/fork-a-repo).

## Our Development Process

### Documentation

Aptos's developer website is also open source (the code can be found in this
[repository](https://github.com/aptos-labs/aptos-core/tree/main/developers-docs-site/). It is built using
[Docusaurus](https://docusaurus.io/):

If you know Markdown, you can already contribute!

## Developer Workflow

Changes to the project are proposed through pull requests. The general pull request workflow is as follows:

1. If you have added code that should be tested, add unit tests.
2. If you have changed APIs, update the documentation. Make sure the documentation builds.
3. Ensure all formatting applies with `pnpm fmt`.
4. Ensure all tests and lints pass on each and every commit that is part of your pull request using `pnpm test && pnpm lint`.
5. Update `CHANGELOG.md` with your changes.
6. Submit your pull request.

### Testing

To test your code:

1. Navigate to the top of the package.
2. Install dependencies with `pnpm i`
3. Build the code using `pnpm build`
4. Run tests using `pnpm test`

## Authoring Clean Commits

### Logically Separate Commits

Commits should be [atomic](https://en.wikipedia.org/wiki/Atomic_commit#Atomic_commit_convention) and broken down into
logically separate changes. Diffs should also be made easy for reviewers to read and review so formatting fixes or code
moves should not be included in commits with actual code changes.

### Meaningful Commit Messages

Commit messages are important and incredibly helpful for others when they dig through the commit history in order to
understand why a particular change was made and what problem it was intending to solve. For this reason commit messages
should be well written and conform with the following format:

All commit messages should begin with a single short (50 character max) line summarizing the change and should skip the
full stop. This is the title of the commit. It is also preferred that this summary be prefixed with "[area]" where the
area is an identifier for the general area of the code being modified, e.g.

```
* [ci] enforce whitelist of nightly features
* [language] removing VerificationPass trait
```

Following the commit title (unless it alone is self-explanatory), there should be a single blank line followed by the
commit body which includes more detailed, explanatory text as separate paragraph(s). It is recommended that the commit
body be wrapped at 72 characters so that Git has plenty of room to indent the text while still keeping everything under
80 characters overall.

The commit body should provide a meaningful commit message, which:

- Explains the problem the change tries to solve, i.e. what is wrong with the current code without the change.
- Justifies the way the change solves the problem, i.e. why the result with the change is better.
- Alternative solutions considered but discarded, if any.

### References in Commit Messages

If you want to reference a previous commit in the history of the project, use the format "abbreviated sha1 (subject,
date)", with the subject enclosed in a pair of double-quotes, like this:

```bash
Commit 895b53510 ("[consensus] remove slice_patterns feature", 2019-07-18) noticed that ...
```

This invocation of `git show` can be used to obtain this format:

```bash
git show -s --date=short --pretty='format:%h ("%s", %ad)' <commit>
```

If a commit references an issue please add a reference to the body of your commit message, e.g. `issue #1234` or `
fixes #456`. Using keywords like `fixes`, `resolves`, or `closes` will cause the corresponding issue to be closed when
the pull request is merged.

Avoid adding any `@` mentions to commit messages, instead add them to the PR cover letter.

## Responding to Reviewer Feedback

During the review process a reviewer may ask you to make changes to your pull request. If a particular commit needs to
be changed, that commit should be amended directly. Changes in response to a review _should not_ be made in separate
commits on top of your PR unless it logically makes sense to have separate, distinct commits for those changes. This
helps keep the commit history clean.

If your pull request is out-of-date and needs to be updated because `main` has advanced, you should rebase your branch
on top of the latest main by doing the following:

```bash
git fetch upstream
git checkout branch
git rebase -i upstream/main
```

You _should not_ update your branch by merging the latest main into your branch. Merge commits included in PRs tend to
make it more difficult for the reviewer to understand the change being made, especially if the merge wasn't clean and
needed conflicts to be resolved. As such, PRs with merge commits will be rejected.

## Bisect-able History

It is important that the project history is bisect-able so that when regressions are identified we can easily use
`git bisect` to be able to pin-point the exact commit which introduced the regression. This requires that every commit
is able to be built and passes all lints and tests. So if your pull request includes multiple commits be sure that each
and every commit is able to be built and passes all checks performed by CI.

## Issues

The Aptos SDK uses [GitHub issues](https://github.com/aptos-labs/aptos-ts-sdk/issues) to track bugs. Please include
necessary information and instructions to reproduce your issue.

## Releasing a new version

### Create a release PR

Simply update the version in `package.json` and `pnpm update-version` will take care of the rest. This will create a new
version everywhere in the code, and generate documentation accordingly. Ensure you check out a new branch before running
these commands.

```bash
git checkout "bump_version"
// update version in `package.json`
// update CHANGELOG.md
pnpm update-version
```

Then push the branch and create a new PR. Once the PR is approved, merge it into the main branch and pull locally.

### Publish to NPM

After you pulled latest main, it is recommended to first do a dry-run to make sure we are publishing only the files we need to. To do that run:

```bash
npm publish --dry-run
```

This command gives us a preview of what we will be releasing to NPM, make sure it does not include hidden files or anything we dont want to publish. Also, compare the package size and the total files with what is on [npm](https://www.npmjs.com/package/@aptos-labs/ts-sdk) and validate it is resonable.

Then, when we are ready to publish to NPM, simply run:

```bash
npm publish
```

This command will build the SDK and publish it to NPM registry
