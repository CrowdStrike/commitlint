'use strict';

module.exports = {
  plugins: [
    {
      rules: {
        'custom-rule': ({ subject }) => {
          return [subject !== 'bad', 'subject may not be "bad"'];
        },
      },
    },
  ],
  rules: {
    'custom-rule': [2, 'always'],
  },
};
