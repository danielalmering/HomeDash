// https://eslint.org/docs/user-guide/configuring

module.exports = {
    root: true,
    parser: 'babel-eslint',
    parserOptions: {
        sourceType: 'module'
    },
    env: {
        browser: true,
    },
    // required to lint *.vue files
    plugins: [
      'html'
    ],
    // add your custom rules here
    'rules': {
        // allow debugger during development
        'no-debugger': process.env.NODE_ENV === 'production' ? 2 : 0,
        'semi': 1,
        'eqeqeq': 2,
        'curly': 1,
        'camelcase': 2
    }
}
