module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation
        'style',    // Formatting, semicolons, etc
        'refactor', // Code refactoring
        'perf',     // Performance improvement
        'test',     // Add/fix tests
        'chore',    // Build tasks, configs, etc
        'ci',       // CI/CD changes
        'revert',   // Revert previous commit
      ],
    ],
    'subject-case': [0], // Allow any case in subject
  },
}

