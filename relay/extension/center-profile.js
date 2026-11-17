/* Remembers one game account inside this browser profile's extension storage. */
(() => {
  "use strict";
  const key = "cor3CenterBrowserAccount";
  const accountPattern = /^FREEL_[A-Fa-f0-9]{8}-[A-Fa-f0-9]{4}$/;
  const api = globalThis.chrome || globalThis.browser;
  const error = code => Object.assign(Error(code), { code });

  function create(storage = api.storage.local) {
    async function verify(account, check) {
      if (!accountPattern.test(account)) throw error("CENTER_IDENTITY_FORMAT");
      await check();
      const value = (await storage.get(key))[key];
      await check();
      if (value !== undefined && (value?.version !== 1 || value.accountId !== account)) {
        throw error("CENTER_SAVED_ACCOUNT_MISMATCH");
      }
      return value;
    }
    return Object.freeze({
      verify,
      async remember(account, check) {
        if (!await verify(account, check)) {
          await check();
          await storage.set({ [key]: { version: 1, accountId: account } });
        }
        const saved = await verify(account, check);
        if (!saved) throw error("CENTER_ACCOUNT_SAVE_FAILED");
      }
    });
  }
  globalThis.Cor3CenterProfileFactory = Object.freeze({ create });
  if (api?.storage?.local) globalThis.Cor3CenterProfile = create();
})();
