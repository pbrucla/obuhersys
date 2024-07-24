const checks = [
  {
    name: 'call .final()',
    trigger: {
      type: 'constructor',
      lib: 'crypto',
      fn: 'createDecipheriv',
      args: ['aes-256-gcm'],
    },
    implies: [{ type: 'call', method: 'final' }],
  },
  // {
  //   name: 'no insecure random',
  //   trigger: {
  //     type: 'constructor',
  //     lib: 'crypto',
  //     fn: 'createEncipheriv',
  //     args: [{ type: '*' }, { type: 'random' }, { type: 'random' }]
  //   }
  // }
];

