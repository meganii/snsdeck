module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      config: {}
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
    {
      name: '@electron-forge/plugin-vite',
      config: {
        // `build` can specify multiple entry builds, which can be Main process, Preload scripts, Worker process, etc.
        // If you are familiar with Vite configuration, it will look really familiar.
        build: [
          {
            // `entry` is just an alias for `build.lib.entry` in the corresponding file of `config`.
            entry: 'src/main.ts',
            config: 'vite.main.config.ts',
          },
          {
            entry: 'src/preload.ts',
            config: 'vite.preload.config.ts',
          },
          {
            entry: 'src/preload-page.ts',
            config: 'vite.preload.config.ts',
          },
          {
            entry: 'src/preload-modal.ts',
            config: 'vite.preload.config.ts',
          },
        ],
        renderer: [
          {
            name: 'main_window',
            config: 'vite.renderer.config.ts',
          },
        ],
      },
    },
  ],
  publishers: [
    {
      name: '@electron-forge/publisher-github',
      config: {
        repository: {
          owner: 'meganii',
          name: 'snsdeck'
        },
        prerelease: false,
        draft: true
      }
    }
  ]
};
